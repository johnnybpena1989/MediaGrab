import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { MediaFormat, VideoFormat, AudioFormat, isVideoFormat, isAudioFormat } from "@shared/schema";
import { spawn } from "child_process";
import { activeDownloads } from "../routes";

const execAsync = promisify(exec);

// Local map to store processes for cancelation
const downloadProcesses = new Map();

// Function to parse duration into a readable format
function formatDuration(durationInSeconds: number): string {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Extract platform name from URL
function getPlatformFromUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "YouTube";
  } else if (url.includes("instagram.com")) {
    return "Instagram";
  } else if (url.includes("twitter.com") || url.includes("x.com")) {
    return "X";
  } else if (url.includes("facebook.com") || url.includes("fb.com")) {
    return "Facebook";
  } else if (url.includes("tiktok.com")) {
    return "TikTok";
  }
  return "Unknown";
}

// Analyze URL and get available formats
export async function analyzeUrl(url: string) {
  try {
    // Create downloads directory if it doesn't exist
    const downloadsDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // First, try with the standard approach
    try {
      // Run yt-dlp to get information about the video
      // Add a user-agent to appear more like a browser request
      const args = [
        '--dump-json',
        '--no-check-certificates',
        '--no-warnings',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        url
      ];
      
      const { stdout } = await execAsync(`yt-dlp ${args.map(arg => `"${arg}"`).join(' ')}`);
      const info = JSON.parse(stdout);
      
      return processVideoInfo(info, url);
    } catch (firstError: any) {
      console.error("First attempt error:", firstError);

      // If the error is due to YouTube bot protection, try an alternative approach
      if (firstError.stderr && firstError.stderr.includes("Sign in to confirm you're not a bot")) {
        console.log("Bot protection detected, trying alternative approach...");
        
        try {
          // For YouTube specifically, try with additional arguments that might bypass the protection
          if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const altArgs = [
              '--dump-json',
              '--no-check-certificates',
              '--no-warnings',
              '--extractor-args', 'youtube:player_client=android',
              '--user-agent', 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
              url
            ];
            
            console.log("Trying with Android extractor args...");
            const { stdout } = await execAsync(`yt-dlp ${altArgs.map(arg => `"${arg}"`).join(' ')}`);
            const info = JSON.parse(stdout);
            
            return processVideoInfo(info, url);
          }
        } catch (secondError: any) {
          console.error("Second attempt error:", secondError);
          // If all attempts fail, throw the original error
          throw firstError;
        }
      }
      
      // If it's not a bot protection error or the fallback failed, throw the original error
      throw firstError;
    }
  } catch (error: any) {
    console.error('Error analyzing URL:', error);
    
    // Get the error message or stderr if available
    const errorOutput = error.stderr || error.message || 'Unknown error';
    console.error('Error details:', errorOutput);
    
    // Check for specific error patterns and provide user-friendly messages
    const errorPatterns = [
      { pattern: "Sign in to confirm you're not a bot", message: 'YouTube bot protection triggered. Please try a different URL or try again later.' },
      { pattern: "is not available in your country", message: 'This content is not available in your region due to restrictions.' },
      { pattern: "Private video", message: 'This video is private and cannot be accessed.' },
      { pattern: "age-restricted", message: 'This content is age-restricted and cannot be downloaded.' },
      { pattern: "This video is unavailable", message: 'This video is unavailable or has been removed.' },
      { pattern: "COPYRIGHT_CLAIM", message: 'This content has been removed due to a copyright claim.' },
      { pattern: "Unable to extract", message: 'Unable to extract video information. The link may be invalid or content is no longer available.' },
      { pattern: "Unsupported URL", message: 'Unsupported URL or website. Please try with a URL from a supported platform (YouTube, Instagram, Twitter, Facebook, TikTok).' },
      { pattern: "Premieres in", message: 'This video is a premiere and has not been released yet.' },
      { pattern: "This live event will begin in", message: 'This is a scheduled live stream that has not started yet.' },
      { pattern: "doesn't exist", message: 'This content does not exist or has been removed.' },
      { pattern: "sign in", message: 'This content requires sign-in and cannot be accessed.' },
      { pattern: "members only", message: 'This content is for channel members only and cannot be accessed.' },
      { pattern: "requested format not available", message: 'The requested video format is not available.' }
    ];
    
    // Check each pattern against the error output
    for (const { pattern, message } of errorPatterns) {
      if (errorOutput.includes(pattern)) {
        throw new Error(message);
      }
    }
    
    // If no specific error pattern was matched, return a general error
    throw new Error(`Failed to analyze URL: ${error.message || 'Unknown error'}. Please verify the URL is correct and try again.`);
  }
}

// Helper function to process video information
function processVideoInfo(info: any, url: string) {
  // Extract video formats
  const videoFormats: any[] = [];
  const audioFormats: any[] = [];
  
  // Parse formats
  if (info.formats) {
    // Video formats (with video stream)
    const uniqueResolutions = new Set();
    
    info.formats.forEach((format: any) => {
      if (format.vcodec !== 'none' && format.acodec !== 'none') {
        // This is a format with both video and audio
        const resolution = format.height ? `${format.height}p` : 'Unknown';
        
        // Skip if we already have this resolution to avoid duplicates
        if (!uniqueResolutions.has(resolution)) {
          uniqueResolutions.add(resolution);
          
          videoFormats.push({
            formatId: format.format_id,
            quality: format.height ? `${format.height}p` : 'Unknown',
            resolution: resolution,
            filesize: format.filesize || 0,
            extension: format.ext || 'mp4',
            type: 'video'
          });
        }
      } else if (format.acodec !== 'none' && format.vcodec === 'none') {
        // This is an audio-only format
        audioFormats.push({
          formatId: format.format_id,
          quality: format.abr ? `${format.abr}kbps` : 'Unknown',
          bitrate: format.abr ? `${format.abr}kbps` : undefined,
          filesize: format.filesize || 0,
          extension: format.ext || 'mp3',
          type: 'audio'
        });
      }
    });
  }
  
  // Sort formats by quality (highest first for video, highest first for audio)
  videoFormats.sort((a, b) => {
    if (isVideoFormat(a) && isVideoFormat(b)) {
      const heightA = parseInt((a.resolution || '0').replace('p', ''));
      const heightB = parseInt((b.resolution || '0').replace('p', ''));
      return heightB - heightA;
    }
    return 0;
  });
  
  audioFormats.sort((a, b) => {
    if (isAudioFormat(a) && isAudioFormat(b)) {
      const bitrateA = parseInt((a.bitrate || '0').replace('kbps', ''));
      const bitrateB = parseInt((b.bitrate || '0').replace('kbps', ''));
      return bitrateB - bitrateA;
    }
    return 0;
  });
  
  return {
    title: info.title || 'Unknown Title',
    thumbnail: info.thumbnail || '',
    duration: formatDuration(info.duration || 0),
    platform: getPlatformFromUrl(url),
    formats: {
      video: videoFormats,
      audio: audioFormats
    }
  };
}

// Download media file
export function downloadMedia(
  url: string, 
  formatId: string, 
  quality: string, 
  downloadId: string,
  callback: (error: Error | null, filePath?: string) => void
) {
  try {
    const downloadsDir = path.join(process.cwd(), "downloads");
    const outputTemplate = path.join(downloadsDir, `%(title)s-${Date.now()}.%(ext)s`);
    
    // Build the youtube-dl command with options to bypass bot protection
    const ytDlpArgs = [
      "--newline",
      "--progress",
      "-f", formatId,
      "-o", outputTemplate,
      "--no-check-certificates",
      "--no-warnings"
    ];
    
    // Add extra parameters to try bypassing YouTube bot protection
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      ytDlpArgs.push(
        "--extractor-args", 
        "youtube:player_client=android",
        "--user-agent", 
        "Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
      );
    } else {
      // For other platforms, use a regular browser UA
      ytDlpArgs.push(
        "--user-agent", 
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
      );
    }
    
    // Add the URL last
    ytDlpArgs.push(url);
    
    const downloadProcess = spawn("yt-dlp", ytDlpArgs);
    let filePath = '';
    
    // Store the download process for cancellation
    downloadProcesses.set(downloadId, {
      process: downloadProcess,
      filePath: '',
    });
    
    // Track download progress
    let downloadedBytes = 0;
    let totalBytes = 0;
    let filename = '';
    let eta = '';
    
    downloadProcess.stdout.on("data", (data) => {
      const output = data.toString();
      
      // Parse progress information
      if (output.includes('[download]')) {
        // Extract filename if found
        const filenameMatch = output.match(/Destination: (.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = path.basename(filenameMatch[1]);
          filePath = filenameMatch[1];
          const processInfo = downloadProcesses.get(downloadId);
          if (processInfo) {
            processInfo.filePath = filePath;
          }
        }
        
        // Extract progress percentage
        const progressMatch = output.match(/(\d+\.\d+)%/);
        if (progressMatch && progressMatch[1]) {
          const progressPercent = parseFloat(progressMatch[1]);
          
          // Extract downloaded and total size
          const sizeMatch = output.match(/(\d+\.\d+)(\w+)\s+of\s+(\d+\.\d+)(\w+)/);
          if (sizeMatch) {
            const downloadedSize = parseFloat(sizeMatch[1]);
            const downloadedUnit = sizeMatch[2];
            const totalSize = parseFloat(sizeMatch[3]);
            const totalUnit = sizeMatch[4];
            
            // Convert to bytes for consistency
            const unitMultiplier = {
              'B': 1,
              'KiB': 1024,
              'MiB': 1024 * 1024,
              'GiB': 1024 * 1024 * 1024
            };
            
            downloadedBytes = downloadedSize * (unitMultiplier as any)[downloadedUnit];
            totalBytes = totalSize * (unitMultiplier as any)[totalUnit];
          }
          
          // Extract ETA
          const etaMatch = output.match(/ETA\s+(\d+:\d+)/);
          if (etaMatch && etaMatch[1]) {
            eta = etaMatch[1];
          }
          
          // Update progress tracking in the shared map from routes.ts
          activeDownloads.set(downloadId, {
            progress: progressPercent,
            filename: filename || 'Downloading...',
            totalSize: totalBytes,
            downloadedSize: downloadedBytes,
            remainingTime: eta || 'Calculating...',
            process: downloadProcess
          });
        }
      }
    });
    
    // Buffer to collect stderr for error analysis
    let stderrBuffer = '';
    
    downloadProcess.stderr.on("data", (data) => {
      const errorOutput = data.toString();
      console.error(`Error: ${errorOutput}`);
      stderrBuffer += errorOutput;
      
      // Update active downloads with error status so the frontend knows about it
      const currentProgress = activeDownloads.get(downloadId);
      if (currentProgress) {
        currentProgress.error = true;
        currentProgress.message = 'Error detected during download. Check logs for details.';
        activeDownloads.set(downloadId, currentProgress);
      }
      
      // Check for common errors in real-time and handle appropriately
      const errorHandlers = [
        { pattern: "Sign in to confirm you're not a bot", message: 'YouTube bot protection triggered. Please try a different URL or try again later.' },
        { pattern: "is not available in your country", message: 'This content is not available in your region due to restrictions.' },
        { pattern: "Private video", message: 'This video is private and cannot be accessed.' },
        { pattern: "age-restricted", message: 'This content is age-restricted and cannot be downloaded.' },
        { pattern: "This video is unavailable", message: 'This video is unavailable or has been removed.' },
        { pattern: "Unable to extract", message: 'Unable to extract video information. The link may be invalid or content is no longer available.' },
        { pattern: "Unable to download", message: 'Unable to download. The video format may be incompatible or protected.' },
        { pattern: "requested format not available", message: 'The requested format is not available for this video. Please try a different format.' },
        { pattern: "Network is unreachable", message: 'Network error. Please check your internet connection and try again.' },
        { pattern: "ERROR: ", message: 'Download failed: Technical error encountered.' }
      ];
      
      for (const handler of errorHandlers) {
        if (errorOutput.includes(handler.pattern)) {
          // Update active downloads with specific error message
          if (currentProgress) {
            currentProgress.error = true;
            currentProgress.message = handler.message;
            activeDownloads.set(downloadId, currentProgress);
          }
          
          // Kill the process and notify callback
          downloadProcess.kill();
          activeDownloads.delete(downloadId);
          callback(new Error(handler.message));
          return;
        }
      }
    });
    
    downloadProcess.on("close", (code) => {
      activeDownloads.delete(downloadId);
      
      if (code === 0) {
        callback(null, filePath);
      } else {
        // Check the stderr buffer for known error patterns
        if (stderrBuffer.includes("Sign in to confirm you're not a bot")) {
          callback(new Error('YouTube bot protection triggered. Please try a different URL or try again later.'));
        } else if (stderrBuffer.includes("is not available in your country")) {
          callback(new Error('This content is not available in your region due to restrictions.'));
        } else if (stderrBuffer.includes("Private video")) {
          callback(new Error('This video is private and cannot be accessed.'));
        } else if (stderrBuffer.includes("age-restricted")) {
          callback(new Error('This content is age-restricted and cannot be downloaded.'));
        } else if (stderrBuffer.includes("This video is unavailable")) {
          callback(new Error('This video is unavailable or has been removed.'));
        } else {
          callback(new Error(`Download failed with exit code ${code}. Please try a different video or format.`));
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error starting download:', error);
    
    // Check for common download errors
    if (error.message && error.message.includes("bot")) {
      callback(new Error('YouTube bot protection triggered. Please try a different URL or try again later.'));
    } else if (error.message && error.message.includes("region")) {
      callback(new Error('This content is not available in your region due to restrictions.'));
    } else if (error.message && error.message.includes("private")) {
      callback(new Error('This video is private and cannot be accessed.'));
    } else if (error.message && error.message.includes("age")) {
      callback(new Error('This content is age-restricted and cannot be downloaded.'));
    } else {
      callback(new Error(`Download failed: ${error.message || 'Unknown error'}`));
    }
  }
}

// Cancel an ongoing download
export function cancelDownload(downloadId: string) {
  const download = activeDownloads.get(downloadId);
  const processInfo = downloadProcesses.get(downloadId);
  
  if (download && download.process) {
    // Kill the download process
    download.process.kill();
  } else if (processInfo && processInfo.process) {
    processInfo.process.kill();
  }
  
  // Delete the incomplete file if it exists
  let filePath = '';
  
  if (download && download.filePath) {
    filePath = download.filePath;
  } else if (processInfo && processInfo.filePath) {
    filePath = processInfo.filePath;
  }
  
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Failed to delete incomplete file: ${filePath}`, err);
    }
  }
  
  // Clean up both maps
  activeDownloads.delete(downloadId);
  downloadProcesses.delete(downloadId);
}

// Get current download progress
export function getDownloadProgress(downloadId: string) {
  // Access the shared map of active downloads from routes.ts
  return activeDownloads.get(downloadId) || null;
}