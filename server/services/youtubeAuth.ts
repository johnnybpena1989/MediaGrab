import axios from 'axios';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Directory for storing cookie files
const COOKIE_DIR = path.join(process.cwd(), 'cookies');

// Ensure the cookie directory exists
if (!fs.existsSync(COOKIE_DIR)) {
  fs.mkdirSync(COOKIE_DIR, { recursive: true });
}

// Generate a secure cookie file name for each user session
function generateCookieFileName(username: string): string {
  const hash = crypto.createHash('sha256').update(username).digest('hex');
  return path.join(COOKIE_DIR, `yt_cookies_${hash.substring(0, 10)}.txt`);
}

// Handle YouTube login using yt-dlp's authentication
export async function authenticateYouTube(
  username: string,
  password: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    try {
      const cookieFile = generateCookieFileName(username);
      
      // Build arguments for yt-dlp authentication
      const args = [
        // Authentication parameters
        '--username', username,
        '--password', password,
        // Cookie file to save the session
        '--cookies', cookieFile,
        // Just dump the cookies, don't actually download
        '--skip-download',
        // Log in to YouTube
        'https://www.youtube.com/feed/subscriptions'
      ];
      
      console.log('Starting YouTube authentication process...');
      
      // Spawn yt-dlp process for authentication
      const authProcess = spawn('yt-dlp', args);
      
      // Collect stdout to monitor the authentication process
      let output = '';
      authProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log(`[yt-dlp auth] ${chunk.trim()}`);
      });
      
      // Collect stderr for error analysis
      let errorOutput = '';
      authProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        console.error(`[yt-dlp auth error] ${chunk.trim()}`);
      });
      
      // Handle process completion
      authProcess.on('close', (code) => {
        if (code === 0) {
          // Check if the cookie file was created successfully
          if (fs.existsSync(cookieFile)) {
            // Read cookie data from the file
            const cookieData = fs.readFileSync(cookieFile, 'utf8');
            
            if (cookieData && cookieData.includes('youtube.com')) {
              console.log('YouTube authentication successful');
              resolve(cookieFile);
            } else {
              console.error('Cookie file exists but does not contain valid YouTube cookies');
              reject(new Error('Authentication failed: Invalid cookie data'));
            }
          } else {
            console.error('Cookie file was not created');
            reject(new Error('Authentication failed: Cookie file not created'));
          }
        } else {
          // Authentication failed
          const errorMsg = parseAuthenticationError(errorOutput);
          console.error(`Authentication process exited with code ${code}: ${errorMsg}`);
          reject(new Error(`Authentication failed: ${errorMsg}`));
        }
      });
    } catch (error: any) {
      console.error('Error during YouTube authentication:', error);
      reject(new Error(`Authentication failed: ${error.message}`));
    }
  });
}

// Parse authentication errors to provide user-friendly messages
function parseAuthenticationError(errorOutput: string): string {
  if (errorOutput.includes('Incorrect username or password')) {
    return 'Incorrect username or password';
  } else if (errorOutput.includes('This account has been')) {
    return 'This account has been suspended';
  } else if (errorOutput.includes('Please sign in')) {
    return 'Login required';
  } else if (errorOutput.includes('verify it')) {
    return 'Additional verification required. Please log in through a browser first';
  } else if (errorOutput.includes('429')) {
    return 'Too many requests. Please try again later';
  } else {
    return 'Unknown authentication error';
  }
}

// Use cookie file for YouTube downloads
export function downloadWithCookies(
  url: string, 
  format: string, 
  cookieFile: string,
  outputPath: string,
  callback: (error: Error | null, filePath?: string) => void
) {
  try {
    console.log(`Starting YouTube download with authenticated cookies from ${cookieFile}`);
    
    // Build args with cookie file
    const ytDlpArgs = [
      // Basic arguments
      '--format', format,
      '--output', outputPath,
      
      // Use the cookie file for authentication
      '--cookies', cookieFile,
      
      // Additional arguments
      '--no-warnings',
      '--no-progress',
      
      // The URL to download
      url
    ];
    
    const downloadProcess = spawn('yt-dlp', ytDlpArgs);
    
    // ... handle the download process similar to your existing downloader.ts logic
    // (This would typically include tracking progress, handling errors, etc.)
    
    downloadProcess.on('close', (code) => {
      if (code === 0) {
        callback(null, outputPath);
      } else {
        callback(new Error(`Download failed with exit code ${code}`));
      }
    });
  } catch (error: any) {
    callback(new Error(`Download with cookies failed: ${error.message}`));
  }
}

// Check if a cookie file is still valid
export async function validateCookies(cookieFile: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(cookieFile)) {
        console.error('Cookie file does not exist');
        resolve(false);
        return;
      }
      
      // We'll use yt-dlp to verify if the cookies are still valid
      const args = [
        '--cookies', cookieFile,
        '--skip-download',
        '--print', 'title',
        'https://www.youtube.com/feed/library'
      ];
      
      const verifyProcess = spawn('yt-dlp', args);
      
      let output = '';
      verifyProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      let errorOutput = '';
      verifyProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      verifyProcess.on('close', (code) => {
        // If the process succeeded and we got some output,
        // the cookies are likely still valid
        if (code === 0 && output.trim() !== '') {
          console.log('Cookie validation successful');
          resolve(true);
        } else {
          console.error(`Cookie validation failed with output: ${errorOutput}`);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error validating cookies:', error);
      resolve(false);
    }
  });
}

// Clean up expired cookie files (you'd call this periodically)
export function cleanupExpiredCookies(): void {
  try {
    const files = fs.readdirSync(COOKIE_DIR);
    
    for (const file of files) {
      if (file.startsWith('yt_cookies_')) {
        const filePath = path.join(COOKIE_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Consider cookies expired after 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        if (stats.mtime < twoDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`Removed expired cookie file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired cookies:', error);
  }
}