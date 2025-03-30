import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { urlAnalyzeSchema, downloadRequestSchema } from "@shared/schema";
import { analyzeUrl, downloadMedia, cancelDownload, getDownloadProgress } from "./services/downloader";
import path from "path";
import fs from "fs";
import "express-session";

// Extend the Express Request type to include session
declare module "express-session" {
  interface SessionData {
    downloadId?: string;
  }
}

// To maintain active download progress info
export const activeDownloads = new Map<string, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create downloads directory if it doesn't exist
  const downloadsDir = path.join(process.cwd(), "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Analyze URL to get available formats
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      // First validate the URL format using Zod
      let url;
      try {
        ({ url } = urlAnalyzeSchema.parse(req.body));
      } catch (zodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid URL format. Please enter a valid URL from a supported platform." 
        });
      }
      
      // Check for empty URL after validation
      if (!url || url.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: "URL cannot be empty. Please enter a valid URL." 
        });
      }
      
      // Validate URL has a supported domain
      const supportedDomains = [
        'youtube.com', 'youtu.be', 
        'instagram.com', 
        'twitter.com', 'x.com', 
        'facebook.com', 'fb.com', 
        'tiktok.com'
      ];
      
      const isSupported = supportedDomains.some(domain => url.includes(domain));
      if (!isSupported) {
        return res.status(400).json({ 
          success: false, 
          message: "Unsupported platform. Please enter a URL from YouTube, Instagram, X, Facebook, or TikTok." 
        });
      }
      
      // Analyze the URL to get available formats
      try {
        const mediaInfo = await analyzeUrl(url);
        return res.json({
          success: true,
          ...mediaInfo
        });
      } catch (analyzeError: any) {
        console.error("Error analyzing URL:", analyzeError);
        
        // Extract error message or use default
        const errorMessage = analyzeError.message || "Failed to analyze URL";
        
        // Map common error messages to appropriate HTTP status codes
        const errorMap = [
          { pattern: "bot protection", status: 403 },
          { pattern: "region", status: 451 },
          { pattern: "private", status: 403 },
          { pattern: "age-restricted", status: 403 },
          { pattern: "unavailable", status: 404 },
          { pattern: "doesn't exist", status: 404 },
          { pattern: "removed", status: 404 },
          { pattern: "copyright", status: 451 },
          { pattern: "sign in", status: 403 },
          { pattern: "members only", status: 403 },
          { pattern: "premiere", status: 404 },
          { pattern: "live event", status: 404 },
          { pattern: "network", status: 503 }
        ];
        
        // Find appropriate status code based on error message
        let statusCode = 500;
        for (const { pattern, status } of errorMap) {
          if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
            statusCode = status;
            break;
          }
        }
        
        return res.status(statusCode).json({ 
          success: false, 
          message: errorMessage
        });
      }
    } catch (error: any) {
      // Catch-all for any unexpected errors
      console.error("Unexpected error in analyze endpoint:", error);
      
      return res.status(500).json({ 
        success: false, 
        message: "An unexpected error occurred. Please try again later."
      });
    }
  });

  // Handle download requests
  app.post("/api/download", async (req: Request, res: Response) => {
    try {
      // Validate request parameters
      let url, format, quality;
      try {
        ({ url, format, quality } = downloadRequestSchema.parse(req.body));
      } catch (zodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid download request. Please check your URL and format parameters." 
        });
      }
      
      // Validate URL is from a supported platform
      const supportedDomains = [
        'youtube.com', 'youtu.be', 
        'instagram.com', 
        'twitter.com', 'x.com', 
        'facebook.com', 'fb.com', 
        'tiktok.com'
      ];
      
      const isSupported = supportedDomains.some(domain => url.includes(domain));
      if (!isSupported) {
        return res.status(400).json({ 
          success: false, 
          message: "Unsupported platform. Please enter a URL from YouTube, Instagram, X, Facebook, or TikTok." 
        });
      }
      
      // Generate a unique download ID
      const downloadId = `download-${Date.now()}`;
      
      // Store download ID in session
      if (req.session) {
        req.session.downloadId = downloadId;
      } else {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to create download session. Please try again." 
        });
      }

      // Setup download tracking
      activeDownloads.set(downloadId, {
        progress: 0,
        filename: "",
        totalSize: 0,
        downloadedSize: 0,
        remainingTime: "Preparing download...",
        startTime: Date.now()
      });

      // Make sure downloads directory exists
      const downloadsDir = path.join(process.cwd(), "downloads");
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      // Start the download process in the background
      downloadMedia(url, format, quality, downloadId, (error, filePath) => {
        if (error) {
          console.error("Download error:", error);
          
          // Set detailed error information in activeDownloads map
          activeDownloads.set(downloadId, {
            error: true,
            message: error.message || "Download failed. Please try again.",
            progress: 0,
            filename: "",
            totalSize: 0,
            downloadedSize: 0,
            remainingTime: "Failed",
            errorTime: Date.now()
          });
          
          // Clean up after a delay to allow client to fetch the error
          setTimeout(() => {
            if (activeDownloads.has(downloadId)) {
              activeDownloads.delete(downloadId);
            }
          }, 60000); // Delete after 1 minute
          
          return;
        }
        
        // Download complete - update status info
        const downloadInfo = activeDownloads.get(downloadId);
        if (downloadInfo) {
          downloadInfo.progress = 100;
          downloadInfo.remainingTime = "Complete";
          downloadInfo.success = true;
          downloadInfo.filePath = filePath;
          downloadInfo.completeTime = Date.now();
          
          // Calculate total download time
          if (downloadInfo.startTime) {
            const downloadTime = (Date.now() - downloadInfo.startTime) / 1000; // in seconds
            downloadInfo.downloadTime = `${Math.floor(downloadTime / 60)}m ${Math.floor(downloadTime % 60)}s`;
          }
          
          activeDownloads.set(downloadId, downloadInfo);
          
          // Clean up download info after a short delay
          setTimeout(() => {
            if (activeDownloads.has(downloadId)) {
              activeDownloads.delete(downloadId);
            }
          }, 60000); // Delete after 1 minute
        }
      });

      // Return immediate confirmation that download process has started
      return res.status(202).json({ 
        success: true, 
        message: "Download started",
        downloadId 
      });
    } catch (error: any) {
      // Generic error handling for any unexpected errors
      console.error("Unexpected error in download endpoint:", error);
      
      const errorMessage = error.message || "Failed to start download";
      
      // Try to provide more specific error messages based on error content
      let message = "An unexpected error occurred while starting the download.";
      
      if (errorMessage.includes("format")) {
        message = "Invalid format specified. Please select a different quality option.";
      } else if (errorMessage.includes("URL")) {
        message = "Invalid URL format or unsupported URL.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connect")) {
        message = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("permission") || errorMessage.includes("access")) {
        message = "Server error: Unable to access download location.";
      }
      
      return res.status(500).json({ 
        success: false, 
        message: message
      });
    }
  });

  // Cancel a download
  app.post("/api/download/cancel", (req: Request, res: Response) => {
    try {
      const downloadId = req.session?.downloadId;
      
      if (!downloadId) {
        return res.status(404).json({ 
          success: false,
          message: "No download session found. Please try starting a new download." 
        });
      }
      
      if (!activeDownloads.has(downloadId)) {
        return res.status(404).json({ 
          success: false,
          message: "No active download found. The download may have already completed or been cancelled." 
        });
      }
      
      // Get download info before cancellation
      const downloadInfo = activeDownloads.get(downloadId);
      
      // Cancel the download and clean up
      try {
        cancelDownload(downloadId);
        
        // Return success with download details
        return res.json({ 
          success: true, 
          message: "Download cancelled successfully", 
          downloadDetails: {
            filename: downloadInfo?.filename || "Unknown file",
            progress: downloadInfo?.progress || 0,
            completedSize: downloadInfo?.downloadedSize || 0
          }
        });
      } catch (cancelError) {
        console.error("Error during cancellation:", cancelError);
        
        // Even if cancellation had an issue, mark the download as cancelled in our tracking
        activeDownloads.delete(downloadId);
        
        return res.status(500).json({ 
          success: false, 
          message: "There was an issue cancelling the download, but it has been marked as cancelled." 
        });
      }
    } catch (error) {
      console.error("Unexpected error cancelling download:", error);
      
      return res.status(500).json({ 
        success: false, 
        message: "Failed to cancel download due to an unexpected error. Please try again or refresh the page." 
      });
    }
  });

  // SSE endpoint for download progress
  app.get("/api/download/progress", (req: Request, res: Response) => {
    try {
      const downloadId = req.session?.downloadId;
      
      if (!downloadId) {
        res.status(404).json({ message: "No download session found", error: true });
        return;
      }
      
      if (!activeDownloads.has(downloadId)) {
        res.status(404).json({ message: "No active download found", error: true });
        return;
      }
      
      // Setup SSE connection
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      // Send initial progress
      const sendProgress = () => {
        try {
          const progress = activeDownloads.get(downloadId);
          
          if (progress) {
            // Check if there's an error
            if (progress.error) {
              res.write(`data: ${JSON.stringify({
                error: true,
                message: progress.message || "An error occurred during download",
                progress: progress.progress || 0
              })}\n\n`);
              
              // Clear the interval and end connection after sending error
              clearInterval(progressInterval);
              setTimeout(() => {
                try {
                  res.end();
                } catch (err) {
                  console.error("Error ending response stream:", err);
                }
              }, 1000);
              
              return;
            }
            
            // Send normal progress update
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
            
            // If download is complete, clean up the interval
            if (progress.progress >= 100) {
              clearInterval(progressInterval);
              setTimeout(() => {
                try {
                  res.end();
                } catch (err) {
                  console.error("Error ending response stream:", err);
                }
              }, 1000);
            }
          }
        } catch (err) {
          console.error("Error sending progress:", err);
          clearInterval(progressInterval);
          
          try {
            res.write(`data: ${JSON.stringify({
              error: true,
              message: "Error tracking download progress",
              progress: 0
            })}\n\n`);
            res.end();
          } catch (writeErr) {
            console.error("Error sending error message:", writeErr);
          }
        }
      };
      
      // Send progress immediately
      sendProgress();
      
      // Setup interval to send progress updates
      const progressInterval = setInterval(sendProgress, 1000);
      
      // Clean up on client disconnect
      req.on("close", () => {
        clearInterval(progressInterval);
      });
      
      // Set a maximum SSE connection time to prevent hanging connections
      const maxConnectionTime = setTimeout(() => {
        clearInterval(progressInterval);
        try {
          res.end();
        } catch (err) {
          console.error("Error ending response stream:", err);
        }
      }, 30 * 60 * 1000); // 30 minutes max
      
      req.on("close", () => {
        clearTimeout(maxConnectionTime);
      });
      
    } catch (error) {
      console.error("Error setting up SSE:", error);
      res.status(500).json({ 
        message: "Failed to setup download progress tracking", 
        error: true 
      });
    }
  });

  // Serve static files from downloads directory
  app.use("/downloads", express.static(downloadsDir));

  return httpServer;
}
