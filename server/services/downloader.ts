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

    // Run youtube-dl to get information about the video
    const { stdout } = await execAsync(`yt-dlp --dump-json "${url}"`);
    const info = JSON.parse(stdout);
    
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
  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw new Error('Failed to analyze URL');
  }
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
    
    // Build the youtube-dl command
    const ytDlpArgs = [
      "--newline",
      "--progress",
      "-f", formatId,
      "-o", outputTemplate,
      url
    ];
    
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
    
    downloadProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });
    
    downloadProcess.on("close", (code) => {
      activeDownloads.delete(downloadId);
      
      if (code === 0) {
        callback(null, filePath);
      } else {
        callback(new Error(`Download process exited with code ${code}`));
      }
    });
    
  } catch (error) {
    console.error('Error starting download:', error);
    callback(error as Error);
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
