#!/bin/bash

# Media Downloader Raspberry Pi Startup Script

# Configuration
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=3000
NODE_ENV=production
DOWNLOADS_DIR="$BASE_DIR/downloads"
LOGS_DIR="$BASE_DIR/logs"
BIN_DIR="$BASE_DIR/bin"
LOG_FILE="$LOGS_DIR/media-downloader-$(date +%Y-%m-%d).log"

# Create required directories
mkdir -p "$DOWNLOADS_DIR" "$LOGS_DIR" "$BIN_DIR"

# Redirect output to logfile and console
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "Media Downloader Starting"
echo "Date: $(date)"
echo "Working Directory: $BASE_DIR"
echo "Port: $PORT"
echo "Downloads Directory: $DOWNLOADS_DIR"
echo "========================================"

# Check if yt-dlp exists and is executable
if [ ! -x "$BIN_DIR/yt-dlp" ]; then
    echo "yt-dlp not found or not executable. Downloading..."
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BIN_DIR/yt-dlp"
    chmod +x "$BIN_DIR/yt-dlp"
fi

# Add bin directory to PATH
export PATH="$BIN_DIR:$PATH"

# Set environment variables for the application
export PORT="$PORT"
export NODE_ENV="$NODE_ENV"
export DOWNLOADS_DIR="$DOWNLOADS_DIR"
export LOGS_DIR="$LOGS_DIR"
export HOST="0.0.0.0"  # Listen on all interfaces for network access

# Start the application
cd "$BASE_DIR"
echo "Starting Media Downloader application..."
npm run dev

# This script should not normally reach this point as npm run dev keeps running
echo "Application stopped at $(date)"