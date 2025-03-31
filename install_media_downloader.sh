#!/bin/bash

# Media Downloader Installer Script for Raspberry Pi
# This script installs and configures the Media Downloader application
# with a custom port (default: 5050)

set -e  # Exit on any error

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default installation directory and port
INSTALL_DIR="$HOME/media-downloader"
DEFAULT_PORT=5050

# Function to print colorful messages
print_message() {
    echo -e "${GREEN}${BOLD}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${BOLD}$1${NC}"
}

print_error() {
    echo -e "${RED}${BOLD}$1${NC}"
}

# Welcome message
clear
echo -e "${BOLD}================================================${NC}"
echo -e "${GREEN}${BOLD}       Media Downloader Installer        ${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo "This script will install the Media Downloader application on your Raspberry Pi."
echo ""

# Ask for installation directory
read -p "Installation directory [$INSTALL_DIR]: " custom_dir
INSTALL_DIR=${custom_dir:-$INSTALL_DIR}

# Ask for custom port
read -p "Port to run the application on [$DEFAULT_PORT]: " custom_port
PORT=${custom_port:-$DEFAULT_PORT}

# Confirm settings
echo ""
echo -e "${BOLD}Installation Settings:${NC}"
echo "* Directory: $INSTALL_DIR"
echo "* Port: $PORT"
echo ""
read -p "Continue with these settings? (y/n): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    print_error "Installation cancelled."
    exit 1
fi

# Check and install dependencies
print_message "Step 1: Checking and installing dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js 20.x..."
    
    # Update repository information for Node.js
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    
    # Install Node.js
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node -v)
    print_message "Node.js $node_version installed successfully."
else
    node_version=$(node -v)
    print_message "Node.js $node_version is already installed."
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    print_warning "yt-dlp not found. Installing yt-dlp..."
    
    # Install python3-pip if not already installed
    sudo apt-get update
    sudo apt-get install -y python3-pip
    
    # Install yt-dlp using pip
    sudo pip3 install -U yt-dlp
    
    print_message "yt-dlp installed successfully."
else
    print_message "yt-dlp is already installed."
    
    # Update yt-dlp to the latest version
    print_warning "Updating yt-dlp to the latest version..."
    sudo pip3 install -U yt-dlp
    print_message "yt-dlp updated successfully."
fi

# Check for other required packages
print_warning "Installing additional required packages..."
sudo apt-get install -y ffmpeg python3 python3-pip

# Create installation directory
print_message "Step 2: Setting up application directory..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone the repository or download the release
print_message "Step 3: Downloading the application..."
if command -v git &> /dev/null; then
    git clone https://github.com/yourusername/media-downloader.git .
    if [ $? -ne 0 ]; then
        print_error "Failed to clone repository. Falling back to direct download."
        # Fallback to direct download if repository doesn't exist or is private
        curl -L -o media-downloader.zip "https://github.com/yourusername/media-downloader/archive/refs/heads/main.zip"
        unzip media-downloader.zip
        mv media-downloader-main/* .
        rm -rf media-downloader-main media-downloader.zip
    fi
else
    sudo apt-get install -y unzip
    curl -L -o media-downloader.zip "https://github.com/yourusername/media-downloader/archive/refs/heads/main.zip"
    unzip media-downloader.zip
    mv media-downloader-main/* .
    rm -rf media-downloader-main media-downloader.zip
fi

# Create downloads directory
mkdir -p "$INSTALL_DIR/downloads"

# Update the port in the configuration
print_message "Step 4: Configuring the application..."
sed -i "s/const PORT = .*/const PORT = $PORT;/g" server/index.ts

# Install Node.js dependencies
print_message "Step 5: Installing Node.js dependencies..."
npm install

# Create a systemd service file for autostart
print_message "Step 6: Setting up autostart service..."

SERVICE_FILE="$INSTALL_DIR/media-downloader.service"
cat > "$SERVICE_FILE" << EOL
[Unit]
Description=Media Downloader Application
After=network.target

[Service]
ExecStart=/usr/bin/npm run dev
WorkingDirectory=$INSTALL_DIR
Environment=PORT=$PORT
Restart=always
# Restart service after 10 seconds if service crashes
RestartSec=10
# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=media-downloader
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOL

# Install the service
sudo cp "$SERVICE_FILE" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable media-downloader
sudo systemctl start media-downloader

# Create a desktop shortcut
print_message "Step 7: Creating desktop shortcut..."
DESKTOP_FILE="$HOME/Desktop/Media-Downloader.desktop"
cat > "$DESKTOP_FILE" << EOL
[Desktop Entry]
Name=Media Downloader
Comment=Download videos from various platforms
Exec=xdg-open http://localhost:$PORT
Icon=web-browser
Terminal=false
Type=Application
Categories=Network;Video;
EOL

chmod +x "$DESKTOP_FILE"

# Create a startup script
STARTUP_SCRIPT="$INSTALL_DIR/start_media_downloader.sh"
cat > "$STARTUP_SCRIPT" << EOL
#!/bin/bash
cd "$INSTALL_DIR"
PORT=$PORT npm run dev
EOL

chmod +x "$STARTUP_SCRIPT"

# Final message
echo ""
echo -e "${BOLD}================================================${NC}"
print_message "Media Downloader installed successfully!"
echo -e "${BOLD}================================================${NC}"
echo ""
echo "The application will automatically start on boot."
echo "You can also:"
echo "- Access the application at http://localhost:$PORT"
echo "- Start manually with: bash $STARTUP_SCRIPT"
echo "- Manage the service with: sudo systemctl (start|stop|restart) media-downloader"
echo "- View logs with: sudo journalctl -u media-downloader -f"
echo ""
echo "A desktop shortcut has been created for easy access."
echo ""
print_message "Installation complete! Enjoy your Media Downloader application!"