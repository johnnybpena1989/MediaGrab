import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { urlAnalyzeSchema, downloadRequestSchema } from "@shared/schema";
import { analyzeUrl, downloadMedia, cancelDownload, getDownloadProgress } from "./services/downloader";
import { initializeEmailService, sendEmail } from "./services/emailService";
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
      console.log(`Checking download progress for ID: ${downloadId}`);
      
      // If there's no download ID in the session, create a placeholder response
      if (!downloadId) {
        console.log("No download session found");
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        
        // Send a friendly error message through SSE
        res.write(`data: ${JSON.stringify({
          error: true,
          message: "No active download session found. Please start a new download.",
          progress: 0
        })}\n\n`);
        
        // End the connection after a brief delay
        setTimeout(() => res.end(), 1000);
        return;
      }
      
      // For TikTok downloads, we need to give more time for the process to initialize
      // as they often complete very quickly or have a delayed start
      const downloadInfo = activeDownloads.get(downloadId);
      
      // If the download doesn't exist in our map yet or completed quickly,
      // create a placeholder download to show progress
      if (!downloadInfo) {
        console.log(`No active download found for ID: ${downloadId}`);
        
        // Check if download might have completed quickly
        const downloadsDir = path.join(process.cwd(), "downloads");
        const files = fs.readdirSync(downloadsDir);
        
        // Look for recently created files in the last 30 seconds
        const recentFiles = files.filter(file => {
          const filePath = path.join(downloadsDir, file);
          const stats = fs.statSync(filePath);
          return (Date.now() - stats.birthtime.getTime()) < 30000; // Less than 30 seconds old
        });
        
        if (recentFiles.length > 0) {
          // Sort by newest first
          recentFiles.sort((a, b) => {
            const statsA = fs.statSync(path.join(downloadsDir, a));
            const statsB = fs.statSync(path.join(downloadsDir, b));
            return statsB.birthtime.getTime() - statsA.birthtime.getTime();
          });
          
          // Create a completed download entry
          activeDownloads.set(downloadId, {
            progress: 100,
            filename: recentFiles[0],
            totalSize: fs.statSync(path.join(downloadsDir, recentFiles[0])).size,
            downloadedSize: fs.statSync(path.join(downloadsDir, recentFiles[0])).size,
            remainingTime: "Complete",
            success: true,
            completed: true,
            message: "Download completed successfully"
          });
          
          console.log(`Created completed download entry for ${recentFiles[0]}`);
        } else {
          // Create a placeholder for a non-existent or failed download
          activeDownloads.set(downloadId, {
            error: true,
            message: "Download may have failed or been cancelled. Please try again.",
            progress: 0
          });
          
          console.log(`Created placeholder for failed download`);
        }
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
            
            // Check if download completed quickly (TikTok often does)
            if (progress.completed || progress.progress >= 100) {
              res.write(`data: ${JSON.stringify({
                ...progress,
                progress: 100,
                remainingTime: "Complete",
                success: true,
                downloadId: downloadId // Add downloadId to response
              })}\n\n`);
              
              // Clean up the interval since download is complete
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
            res.write(`data: ${JSON.stringify({
              ...progress,
              downloadId: downloadId
            })}\n\n`);
          } else {
            // The download has disappeared from our map - it may have completed or errored
            // but we lost tracking. Indicate this to the client.
            res.write(`data: ${JSON.stringify({
              error: true,
              message: "Download tracking was lost. The download may have completed or failed.",
              progress: 0
            })}\n\n`);
            
            clearInterval(progressInterval);
            setTimeout(() => {
              try {
                res.end();
              } catch (err) {
                console.error("Error ending response stream:", err);
              }
            }, 1000);
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
  
  // Direct file download endpoint - sends the file directly to the user
  // Handle contact form submissions
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Basic validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address"
        });
      }
      
      // Initialize email service if not already done
      await initializeEmailService();
      
      // Send the email
      const result = await sendEmail({
        name,
        email,
        subject,
        message
      });
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Your message has been sent successfully",
          messageId: result.messageId,
          previewUrl: result.previewUrl // Only available in development
        });
      } else {
        console.error("Failed to send email:", result.error);
        return res.status(500).json({
          success: false,
          message: "Failed to send your message. Please try again later."
        });
      }
    } catch (error) {
      console.error("Error in contact endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred. Please try again later."
      });
    }
  });

  app.get("/api/download/file/:downloadId", (req: Request, res: Response) => {
    try {
      const { downloadId } = req.params;
      
      // Get download information
      const downloadInfo = activeDownloads.get(downloadId);
      
      if (!downloadInfo || !downloadInfo.filePath) {
        return res.status(404).json({
          success: false,
          message: "Download not found or file path unavailable."
        });
      }
      
      // If download is still in progress
      if (!downloadInfo.completed && !downloadInfo.success && !downloadInfo.error) {
        return res.json({
          success: true,
          status: "in_progress",
          progress: downloadInfo.progress || 0,
          message: "Download is still in progress."
        });
      }
      
      // If there was an error
      if (downloadInfo.error) {
        return res.json({
          success: false,
          status: "error",
          message: downloadInfo.message || "Download failed."
        });
      }
      
      // If download completed successfully
      if (downloadInfo.filePath && fs.existsSync(downloadInfo.filePath)) {
        const filename = path.basename(downloadInfo.filePath);
        
        // Set headers for browser to download the file
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Stream the file to the client
        const fileStream = fs.createReadStream(downloadInfo.filePath);
        fileStream.pipe(res);
        
        // Handle errors
        fileStream.on('error', (err) => {
          console.error('Error streaming file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Error streaming file to client."
            });
          }
        });
        
        // When download is complete, schedule the file for deletion
        fileStream.on('close', () => {
          // Delete the file after a short delay to ensure it's fully sent
          setTimeout(() => {
            try {
              if (fs.existsSync(downloadInfo.filePath)) {
                fs.unlinkSync(downloadInfo.filePath);
                console.log(`Deleted file: ${downloadInfo.filePath}`);
              }
            } catch (err) {
              console.error('Error deleting file:', err);
            }
          }, 5000);
        });
        
        return;
      } else {
        return res.status(404).json({
          success: false,
          message: "File not found on server."
        });
      }
    } catch (error) {
      console.error("Error retrieving download file:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve download file."
      });
    }
  });

  return httpServer;
}
