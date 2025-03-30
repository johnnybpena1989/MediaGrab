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
      const { url } = urlAnalyzeSchema.parse(req.body);
      
      const mediaInfo = await analyzeUrl(url);
      
      return res.json(mediaInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid URL format" });
      }
      console.error("Error analyzing URL:", error);
      return res.status(500).json({ message: "Failed to analyze URL" });
    }
  });

  // Handle download requests
  app.post("/api/download", async (req: Request, res: Response) => {
    try {
      const { url, format, quality } = downloadRequestSchema.parse(req.body);
      
      // Generate a unique download ID
      const downloadId = `download-${Date.now()}`;
      
      // Store download ID in session
      if (req.session) {
        req.session.downloadId = downloadId;
      }

      // Setup download tracking
      activeDownloads.set(downloadId, {
        progress: 0,
        filename: "",
        totalSize: 0,
        downloadedSize: 0,
        remainingTime: "Calculating...",
      });

      // Start download in the background
      downloadMedia(url, format, quality, downloadId, (error, filePath) => {
        if (error) {
          console.error("Download error:", error);
          activeDownloads.delete(downloadId);
          return;
        }
        
        // Download complete
        const downloadInfo = activeDownloads.get(downloadId);
        if (downloadInfo) {
          downloadInfo.progress = 100;
          downloadInfo.remainingTime = "Complete";
          
          // Clean up download info after a short delay
          setTimeout(() => {
            activeDownloads.delete(downloadId);
          }, 60000); // Delete after 1 minute
        }
      });

      return res.json({ message: "Download started", downloadId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid download request" });
      }
      console.error("Error starting download:", error);
      return res.status(500).json({ message: "Failed to start download" });
    }
  });

  // Cancel a download
  app.post("/api/download/cancel", (req: Request, res: Response) => {
    try {
      const downloadId = req.session?.downloadId;
      
      if (!downloadId || !activeDownloads.has(downloadId)) {
        return res.status(404).json({ message: "No active download found" });
      }
      
      cancelDownload(downloadId);
      activeDownloads.delete(downloadId);
      
      return res.json({ message: "Download cancelled" });
    } catch (error) {
      console.error("Error cancelling download:", error);
      return res.status(500).json({ message: "Failed to cancel download" });
    }
  });

  // SSE endpoint for download progress
  app.get("/api/download/progress", (req: Request, res: Response) => {
    const downloadId = req.session?.downloadId;
    
    if (!downloadId || !activeDownloads.has(downloadId)) {
      return res.status(404).json({ message: "No active download found" });
    }
    
    // Setup SSE connection
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    // Send initial progress
    const sendProgress = () => {
      const progress = activeDownloads.get(downloadId);
      if (progress) {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
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
  });

  // Serve static files from downloads directory
  app.use("/downloads", express.static(downloadsDir));

  return httpServer;
}
