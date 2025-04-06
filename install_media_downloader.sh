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

# Get the current script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

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

# Check for required Python packages
print_warning "Installing required Python packages..."
sudo apt-get update
sudo apt-get install -y ffmpeg python3 python3-pip python3-venv

# Create installation directory
print_message "Step 2: Setting up application directory..."
mkdir -p "$INSTALL_DIR"

# Copy local files instead of downloading from GitHub
print_message "Step 3: Copying application files from script directory..."
cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"
cd "$INSTALL_DIR"

# Create downloads directory
mkdir -p "$INSTALL_DIR/downloads"

# Update port in configuration if needed
print_message "Step 4: Configuring the application..."
if [ -f "server/index.ts" ]; then
    sed -i "s/const port = .*/const port = process.env.PORT ? parseInt(process.env.PORT, 10) : $PORT;/g" server/index.ts
elif [ -f "raspberry_pi_config/modified_index.ts" ]; then
    # Copy the modified index.ts to the correct location
    cp "raspberry_pi_config/modified_index.ts" "server/index.ts"
fi

# Set up Python virtual environment
print_message "Step 5: Setting up Python virtual environment..."
python3 -m venv "$INSTALL_DIR/venv"
source "$INSTALL_DIR/venv/bin/activate"

# Install yt-dlp in the virtual environment
print_warning "Installing yt-dlp in the virtual environment..."
pip install --upgrade pip
pip install -U yt-dlp

# Install Node.js dependencies
print_message "Step 6: Installing Node.js dependencies..."
npm install

# Create a systemd service file for autostart
print_message "Step 7: Setting up autostart service..."

SERVICE_FILE="$INSTALL_DIR/media-downloader.service"
cat > "$SERVICE_FILE" << EOL
[Unit]
Description=Media Downloader Application
After=network.target

[Service]
ExecStart=/bin/bash -c "source $INSTALL_DIR/venv/bin/activate && PORT=$PORT /usr/bin/npm run dev"
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

# Create a startup script
STARTUP_SCRIPT="$INSTALL_DIR/start_media_downloader.sh"
cat > "$STARTUP_SCRIPT" << EOL
#!/bin/bash
cd "$INSTALL_DIR"
source "$INSTALL_DIR/venv/bin/activate"
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
print_message "Installation complete! Enjoy your Media Downloader application!"