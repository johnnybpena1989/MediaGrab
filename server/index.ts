import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeEmailService } from "./services/emailService";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware
app.use(session({
  secret: 'mediagrab-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize email service
  await initializeEmailService();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // Force development mode for local environments
  const isLocalDev = process.env.LOCAL_ENV === 'true';
  
  if (app.get("env") === "development" || isLocalDev) {
    // Always use development mode for local installations
    process.env.NODE_ENV = 'development';
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Check if we're running in a local environment or on Replit
  const isReplit = process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT_ID;
  const isLocalEnv = process.env.LOCAL_ENV === 'true';
  
  if (isReplit) {
    // On Replit, use "::" (IPv6 equivalent of 0.0.0.0) to listen on all interfaces
    server.listen(port, "::", () => {
      log(`serving on port ${port} (Replit environment)`);
    });
  } else if (isLocalEnv) {
    // On local environments with the LOCAL_ENV flag, use 127.0.0.1
    server.listen(port, "127.0.0.1", () => {
      log(`serving on port ${port} (local Windows environment)`);
    });
  } else {
    // Default case - use different approaches based on the platform
    try {
      // First try with 0.0.0.0 which works on most systems
      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port} (using 0.0.0.0)`);
      });
    } catch (err) {
      // If that fails, fall back to localhost
      console.error("Failed to bind to 0.0.0.0, falling back to 127.0.0.1");
      server.listen(port, "127.0.0.1", () => {
        log(`serving on port ${port} (fallback to localhost)`);
      });
    }
  }
})();
