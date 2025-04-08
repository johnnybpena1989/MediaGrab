import { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Configure the Express app to work with an Nginx subpath
 * This adds middleware to handle base path redirects and adjusts URLs
 */
export function configureForNginxSubpath(app: Express, basePath: string) {
  if (!basePath || basePath === '/') {
    console.log('No basePath specified or root path (/). Skipping Nginx subpath configuration.');
    return;
  }
  
  // Remove trailing slash if present
  if (basePath.endsWith('/') && basePath !== '/') {
    basePath = basePath.slice(0, -1);
  }
  
  // Add leading slash if missing
  if (!basePath.startsWith('/')) {
    basePath = '/' + basePath;
  }
  
  console.log(`Configuring application for Nginx subpath: ${basePath}`);
  
  // Add middleware to handle the base path
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Store the base path in res.locals for use in templates
    res.locals.basePath = basePath;
    
    // Check if the X-Forwarded-Prefix header is set by Nginx
    const forwarded = req.headers['x-forwarded-prefix'];
    if (forwarded) {
      // Store the forwarded prefix for potential use
      res.locals.forwardedPrefix = forwarded;
      console.log(`Request received with X-Forwarded-Prefix: ${forwarded}`);
    }
    
    // Set a header that client-side code can use to determine the base path
    res.setHeader('X-Base-Path', basePath);
    
    next();
  });
  
  // Create an HTML rewriter middleware that will rewrite asset paths in HTML responses
  // This will be applied to production mode only
  if (process.env.NODE_ENV === 'production') {
    console.log('Adding production-mode HTML asset path rewriting for Nginx subpath');
    
    // This middleware will intercept HTML responses and modify asset paths
    app.use((req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(body: any) {
        if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
          // Adjust asset paths in HTML
          body = body.replace(/(href|src)="\/(?!\/)/g, `$1="${basePath}/`);
          
          // Also fix any asset paths without leading slash
          body = body.replace(/(href|src)="(?!http|\/|#)/g, `$1="${basePath}/`);
          
          // Add a base tag if not present
          if (!body.includes('<base')) {
            body = body.replace('<head>', `<head><base href="${basePath}/">`);
          }
          
          // Fix script path issues
          body = body.replace(/<script([^>]*)>/g, (match: string, attrs: string) => {
            return `<script${attrs} data-base-path="${basePath}">`;
          });
          
          // Inject a small script to help client-side scripts know the base path
          const scriptInjection = `
            <script>
              window.BASE_PATH = "${basePath}";
              document.addEventListener('DOMContentLoaded', function() {
                console.log('Application running with base path: ${basePath}');
              });
            </script>
          `;
          body = body.replace('</head>', `${scriptInjection}</head>`);
        }
        
        // Call the original send with our modified body
        return originalSend.call(this, body);
      };
      
      next();
    });
  }
}