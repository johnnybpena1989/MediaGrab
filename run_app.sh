#!/bin/bash

# Media Downloader - Raspberry Pi Startup Script
echo "========================================================="
echo "    Media Downloader - Raspberry Pi Startup Script"
echo "========================================================="
echo ""

# Set up environment variables
export LOCAL_ENV=true
export NODE_ENV=development
export PI_ENV=true

# Create necessary directories
mkdir -p downloads
mkdir -p logs
mkdir -p cookies

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js using: sudo apt install nodejs npm"
    echo "Recommended version: Node.js 16 or higher"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "WARNING: Your Node.js version is older than recommended."
    echo "Current: v$NODE_VERSION"
    echo "Recommended: v16 or higher"
    echo "The application might not work correctly."
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install Node.js dependencies."
        echo "See logs/npm_error.log for details."
        npm install > logs/npm_error.log 2>&1
        exit 1
    fi
else
    echo "Node modules already installed."
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "yt-dlp not found, installing it now..."
    
    # Create bin directory
    mkdir -p bin
    
    # Download yt-dlp
    echo "Downloading yt-dlp..."
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
    
    if [ ! -f "bin/yt-dlp" ]; then
        echo "ERROR: Failed to download yt-dlp."
        exit 1
    fi
    
    # Make it executable
    chmod +x bin/yt-dlp
    
    # Create a symlink to make it available in PATH
    echo "#!/bin/bash" > yt-dlp
    echo "$(pwd)/bin/yt-dlp \"\$@\"" >> yt-dlp
    chmod +x yt-dlp
    
    echo "yt-dlp is now installed locally."
else
    echo "yt-dlp is already installed."
fi

# Get local IP address for display purposes
LOCAL_IP=$(hostname -I | cut -d' ' -f1)

echo ""
echo "Starting Media Downloader application..."
echo "Once started, access the application at: http://$LOCAL_IP:5000"
echo ""

# Start the application with output logging
npm run dev | tee logs/app.log