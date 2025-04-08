#!/bin/bash

# Media Downloader Installer/Updater/Uninstaller Script for Raspberry Pi
# This script installs, updates, or uninstalls the Media Downloader application
# with production build, virtual environment and nginx proxy support

# Don't exit on error during uninstall as some components might not exist
if [[ "$1" != "uninstall" ]]; then
  set -e  # Exit on any error
fi

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default installation directory and port
INSTALL_DIR="/home/admin/mediagrab"
DEFAULT_PORT=5050
NGINX_PATH="/mediagrab"

# GitHub repository URL for this specific application
GITHUB_REPO="https://github.com/johnnybpena1989/MediaGrab.git"

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
echo -e "${GREEN}${BOLD}   Media Downloader Installer/Updater    ${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo "Usage options:"
echo "  ./install.sh         - Install or update Media Downloader"
echo "  ./install.sh uninstall - Uninstall Media Downloader"
echo ""

# Check if script was called with uninstall parameter first
if [[ "$1" == "uninstall" ]]; then
    uninstall_app
    exit 0
fi

# GitHub repository URL is hardcoded for this specific application

# Check if this is an update or new installation
IS_UPDATE=false
if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/package.json" ]; then
    IS_UPDATE=true
    print_warning "Existing installation detected at $INSTALL_DIR"
    echo "This script will update your existing installation."
    
    # Check if server/index.ts has port 5000 hardcoded
    if [ -f "$INSTALL_DIR/server/index.ts" ] && grep -q "const port = 5000" "$INSTALL_DIR/server/index.ts"; then
        print_warning "Detected hardcoded port 5000 in server/index.ts!"
        print_message "This will be fixed during the update to use port 5050 consistently."
    fi
    
    read -p "Continue with update? (y/n): " confirm
    if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
        print_error "Update cancelled."
        exit 1
    fi
    
    # During updates, always use port 5050 for consistency
    DEFAULT_PORT=5050
    print_message "Using port 5050 for Media Downloader application"
else
    echo "This script will install the Media Downloader application on your Raspberry Pi."
    # Ask for installation directory
    read -p "Installation directory [$INSTALL_DIR]: " custom_dir
    INSTALL_DIR=${custom_dir:-$INSTALL_DIR}
fi

# For new installations or if updating port configuration
if [ "$IS_UPDATE" = false ]; then
    # Ask for custom port
    read -p "Port to run the application on [$DEFAULT_PORT]: " custom_port
    PORT=${custom_port:-$DEFAULT_PORT}
    
    # Ask for nginx path
    read -p "Nginx proxy path [$NGINX_PATH]: " custom_path
    NGINX_PATH=${custom_path:-$NGINX_PATH}

    # Ensure nginx path starts with /
    if [[ $NGINX_PATH != /* ]]; then
        NGINX_PATH="/$NGINX_PATH"
    fi

    # Confirm settings
    echo ""
    echo -e "${BOLD}Installation Settings:${NC}"
    echo "* GitHub Repository: $GITHUB_REPO"
    echo "* Installation directory: $INSTALL_DIR"
    echo "* Port: $PORT"
    echo "* Nginx Path: $NGINX_PATH"
    echo ""
    read -p "Continue with these settings? (y/n): " confirm
    if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
        print_error "Installation cancelled."
        exit 1
    fi
else
    # Use existing port for updates
    PORT=$DEFAULT_PORT
    
    # Check for existing nginx config
    if [ -f "$INSTALL_DIR/nginx-mediagrab.conf" ]; then
        EXISTING_PATH=$(grep -o "location /[^/]*" "$INSTALL_DIR/nginx-mediagrab.conf" | sed 's/location //')
        if [ ! -z "$EXISTING_PATH" ]; then
            NGINX_PATH=$EXISTING_PATH
        fi
    fi
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
sudo apt-get install -y ffmpeg python3 python3-pip python3-venv git

if [ "$IS_UPDATE" = true ]; then
    print_message "Step 2: Backing up configuration files..."
    
    # Create a backup directory
    BACKUP_DIR="$INSTALL_DIR/backup_$(date +%Y%m%d%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup important configuration files
    if [ -f "$INSTALL_DIR/server/index.ts" ]; then
        cp "$INSTALL_DIR/server/index.ts" "$BACKUP_DIR/index.ts.backup"
    fi
    
    if [ -f "$INSTALL_DIR/.env" ]; then
        cp "$INSTALL_DIR/.env" "$BACKUP_DIR/.env.backup"
    fi
    
    if [ -f "$INSTALL_DIR/nginx-mediagrab.conf" ]; then
        cp "$INSTALL_DIR/nginx-mediagrab.conf" "$BACKUP_DIR/nginx-mediagrab.conf.backup"
    fi
    
    # Backup media files if they exist
    if [ -d "$INSTALL_DIR/downloads" ]; then
        cp -r "$INSTALL_DIR/downloads" "$BACKUP_DIR/downloads"
    fi
    
    # Stop the service if it's running
    if systemctl is-active --quiet media-downloader; then
        print_warning "Stopping Media Downloader service..."
        sudo systemctl stop media-downloader
    fi
    
    # Change to parent directory for git clone
    cd "$(dirname "$INSTALL_DIR")"
    
    # Rename current directory temporarily
    TEMP_DIR="$INSTALL_DIR.old"
    mv "$INSTALL_DIR" "$TEMP_DIR"
else
    # For new installation, make sure parent directory exists
    mkdir -p "$(dirname "$INSTALL_DIR")"
    cd "$(dirname "$INSTALL_DIR")"
fi

# Clone repository
print_message "Step 3: Cloning repository from GitHub..."
git clone "$GITHUB_REPO" "$(basename "$INSTALL_DIR")"

# Enter the installation directory
cd "$INSTALL_DIR"

# If this is an update, restore backed up files
if [ "$IS_UPDATE" = true ]; then
    print_message "Restoring configuration files..."
    
    # Restore downloads directory
    if [ -d "$BACKUP_DIR/downloads" ]; then
        rm -rf "$INSTALL_DIR/downloads" # Remove any downloads directory from the repo
        cp -r "$BACKUP_DIR/downloads" "$INSTALL_DIR/downloads"
    fi
    
    # Restore specific configuration files if needed
    if [ -f "$BACKUP_DIR/.env.backup" ]; then
        cp "$BACKUP_DIR/.env.backup" "$INSTALL_DIR/.env"
    fi
    
    # We'll restore the server index.ts later after modifications
else
    # For new installation, create downloads directory
    mkdir -p "$INSTALL_DIR/downloads"
fi

# Update port and base URL in configuration
print_message "Step 4: Configuring the application..."

# Create or update .env file with base URL for subpath
echo "VITE_BASE_URL=\"$NGINX_PATH\"" > "$INSTALL_DIR/.env"

# Configure port in server file
if [ -f "server/index.ts" ]; then
    sed -i "s/const port = .*/const port = process.env.PORT ? parseInt(process.env.PORT, 10) : $PORT;/g" server/index.ts
elif [ -f "raspberry_pi_config/modified_index.ts" ]; then
    # Copy the modified index.ts to the correct location
    cp "raspberry_pi_config/modified_index.ts" "server/index.ts"
    sed -i "s/const port = .*/const port = process.env.PORT ? parseInt(process.env.PORT, 10) : $PORT;/g" server/index.ts
fi

# If this is an update and we had a previous index.ts configuration, compare and merge changes
if [ "$IS_UPDATE" = true ] && [ -f "$BACKUP_DIR/index.ts.backup" ]; then
    # This is a simplified approach - in a real scenario, we might need a more sophisticated diff/merge
    # For now, we'll restore the port setting we just configured
    CURRENT_PORT_LINE=$(grep "const port = .*" server/index.ts)
    cp "$BACKUP_DIR/index.ts.backup" server/index.ts
    sed -i "s/const port = .*/$CURRENT_PORT_LINE/g" server/index.ts
fi

# Update vite.config.ts for base URL
if [ -f "vite.config.ts" ]; then
    # Check if base is already configured
    if grep -q "base:" "vite.config.ts"; then
        sed -i "s|base:.*|base: process.env.VITE_BASE_URL || '/',|" vite.config.ts
    else
        # Add base configuration before the plugins array
        sed -i "/plugins/i \ \ base: process.env.VITE_BASE_URL || '/'," vite.config.ts
    fi
fi

# Ensure we're using 127.0.0.1 instead of localhost in all files
find . -type f -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs sed -i 's/localhost:5050/127.0.0.1:5050/g'
find . -type f -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs sed -i 's/localhost:5000/127.0.0.1:5050/g'

# Set up Python virtual environment
print_message "Step 5: Setting up Python virtual environment..."
if [ ! -d "$INSTALL_DIR/venv" ]; then
    python3 -m venv "$INSTALL_DIR/venv"
fi
source "$INSTALL_DIR/venv/bin/activate"

# Update yt-dlp in the virtual environment
print_warning "Updating yt-dlp in the virtual environment..."
pip install --upgrade pip
pip install -U yt-dlp

# Install Node.js dependencies
print_message "Step 6: Installing Node.js dependencies..."
npm install

# Build for production
print_message "Step 7: Building for production..."
npm run build

# Create or update systemd service file
print_message "Step 8: Setting up autostart service..."

SERVICE_FILE="$INSTALL_DIR/media-downloader.service"
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Media Downloader Application
After=network.target

[Service]
ExecStart=/bin/bash -c "source $INSTALL_DIR/venv/bin/activate && PORT=$PORT NODE_ENV=production /usr/bin/npm run start"
WorkingDirectory=$INSTALL_DIR
Environment=PORT=$PORT
Environment=NODE_ENV=production
Environment=VITE_BASE_URL=$NGINX_PATH
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
EOF

# Install the service
sudo cp "$SERVICE_FILE" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable media-downloader

# Create nginx configuration file
print_message "Step 9: Creating nginx configuration..."
NGINX_CONF="$INSTALL_DIR/nginx-mediagrab.conf"
cat > "$NGINX_CONF" << EOF
# Nginx configuration for Media Downloader at $NGINX_PATH
# Include this file in your nginx configuration with:
# include $NGINX_CONF;

location ${NGINX_PATH}/ {
    proxy_pass http://127.0.0.1:${PORT}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    
    # These headers are critical for the application to work with a subpath
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Prefix ${NGINX_PATH};
    
    # Increase timeouts for downloading large files
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
EOF

print_message "Nginx configuration file created at $NGINX_CONF"
echo "To use this configuration with your nginx server, include it in your nginx config:"
echo "include $NGINX_CONF;"

# Create startup script
STARTUP_SCRIPT="$INSTALL_DIR/start_media_downloader.sh"
cat > "$STARTUP_SCRIPT" << EOF
#!/bin/bash
cd "$INSTALL_DIR"
source "$INSTALL_DIR/venv/bin/activate"
export PORT=$PORT
export NODE_ENV=production
export VITE_BASE_URL=$NGINX_PATH
npm run start
EOF

chmod +x "$STARTUP_SCRIPT"

# Add a production start script to package.json if it doesn't exist
if ! grep -q "\"start\":" "package.json"; then
    print_message "Adding production start script to package.json..."
    sed -i '/"scripts": {/a \    "start": "node dist/server/index.js",' package.json
fi

# Clean up the old installation directory if this was an update
if [ "$IS_UPDATE" = true ] && [ -d "$TEMP_DIR" ]; then
    print_message "Cleaning up old installation files..."
    rm -rf "$TEMP_DIR"
fi

# Start the service
sudo systemctl start media-downloader

# Final message
echo ""
echo -e "${BOLD}================================================${NC}"
if [ "$IS_UPDATE" = true ]; then
    print_message "Media Downloader updated successfully!"
else
    print_message "Media Downloader installed successfully!"
fi
echo -e "${BOLD}================================================${NC}"
echo ""
echo "The application is now running on port $PORT."
echo "You can access it via your nginx proxy at $NGINX_PATH"
echo "Direct access (for testing): http://127.0.0.1:$PORT or http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""
echo "To use with Nginx:"
echo "1. Make sure nginx is installed: sudo apt install nginx"
echo "2. Add the following line to your nginx config file:"
echo "   include $NGINX_CONF;"
echo "3. Reload nginx: sudo systemctl reload nginx"
echo ""
echo "Management commands:"
echo "- Start manually: bash $STARTUP_SCRIPT"
echo "- Manage service: sudo systemctl (start|stop|restart) media-downloader"
echo "- View logs: sudo journalctl -u media-downloader -f"
echo ""
if [ "$IS_UPDATE" = true ]; then
    print_message "Update complete! Enjoy your updated Media Downloader application!"
else
    print_message "Installation complete! Enjoy your Media Downloader application!"
fi

# Uninstall function - called when script is invoked with 'uninstall' parameter
uninstall_app() {
    clear
    echo -e "${BOLD}================================================${NC}"
    echo -e "${RED}${BOLD}   Media Downloader Uninstaller    ${NC}"
    echo -e "${BOLD}================================================${NC}"
    echo ""
    
    # Ask for installation directory to uninstall
    read -p "Enter the installation directory to uninstall [$INSTALL_DIR]: " uninstall_dir
    UNINSTALL_DIR=${uninstall_dir:-$INSTALL_DIR}
    
    if [ ! -d "$UNINSTALL_DIR" ] || [ ! -f "$UNINSTALL_DIR/package.json" ]; then
        print_error "Media Downloader not found at $UNINSTALL_DIR!"
        exit 1
    fi
    
    print_warning "WARNING: This will completely remove Media Downloader from your system."
    print_warning "Including all configuration files and downloaded media."
    read -p "Are you sure you want to uninstall? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        print_error "Uninstallation cancelled."
        exit 1
    fi
    
    print_message "Step 1: Stopping service..."
    # Stop and disable the service
    if systemctl is-enabled --quiet media-downloader; then
        sudo systemctl stop media-downloader
        sudo systemctl disable media-downloader
    fi
    
    print_message "Step 2: Removing service file..."
    # Remove the systemd service file
    if [ -f "/etc/systemd/system/media-downloader.service" ]; then
        sudo rm /etc/systemd/system/media-downloader.service
        sudo systemctl daemon-reload
    fi
    
    print_message "Step 3: Checking for Nginx configuration..."
    # Check if Nginx is using our config
    NGINX_CONF=$(find "$UNINSTALL_DIR" -name "nginx-*.conf" -type f | head -1)
    if [ -n "$NGINX_CONF" ]; then
        NGINX_PATH=$(grep -o "location /[^/]*" "$NGINX_CONF" | head -1 | sed 's/location //')
        INCLUDE_LINE="include $NGINX_CONF;"
        print_warning "You may need to manually remove the following line from your Nginx configuration:"
        echo "$INCLUDE_LINE"
        print_warning "And then reload Nginx with: sudo systemctl reload nginx"
    fi
    
    print_message "Step 4: Removing application files..."
    # Remove the installation directory
    rm -rf "$UNINSTALL_DIR"
    
    print_message "Media Downloader has been successfully uninstalled."
    echo ""
    echo -e "${BOLD}================================================${NC}"
    print_message "Uninstallation complete! Media Downloader has been removed."
    echo -e "${BOLD}================================================${NC}"
}

# uninstall function is called at the beginning of the script
# when "$1" is "uninstall"