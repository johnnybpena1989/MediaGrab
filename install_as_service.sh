#!/bin/bash

# Install Media Downloader as a systemd service
# This script must be run as root (with sudo)

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root (with sudo)"
  exit 1
fi

# Get the absolute path of the current directory
BASE_DIR=$(pwd)

# Create the systemd service file
cat > /etc/systemd/system/media-downloader.service << EOF
[Unit]
Description=Media Downloader Service
After=network.target

[Service]
Type=simple
User=$(logname)
WorkingDirectory=$BASE_DIR
ExecStart=$BASE_DIR/run_app.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=

[Install]
WantedBy=multi-user.target
EOF

# Create the logs directory if it doesn't exist
mkdir -p "$BASE_DIR/logs"
chown $(logname):$(logname) "$BASE_DIR/logs"

# Create the downloads directory if it doesn't exist
mkdir -p "$BASE_DIR/downloads"
chown $(logname):$(logname) "$BASE_DIR/downloads"

# Create update script for yt-dlp
cat > "$BASE_DIR/update_ytdlp.sh" << EOF
#!/bin/bash

# Get the latest yt-dlp release
YT_DLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
BIN_DIR="$BASE_DIR/bin"

# Create bin directory if it doesn't exist
mkdir -p "\$BIN_DIR"

# Download yt-dlp
echo "Downloading latest yt-dlp..."
curl -L \$YT_DLP_URL -o "\$BIN_DIR/yt-dlp"

# Make it executable
chmod +x "\$BIN_DIR/yt-dlp"

echo "yt-dlp has been updated successfully!"
EOF

# Make the update script executable
chmod +x "$BASE_DIR/update_ytdlp.sh"

# Run the yt-dlp update script to download the latest version
sudo -u $(logname) "$BASE_DIR/update_ytdlp.sh"

# Reload systemd to recognize the new service
systemctl daemon-reload

# Enable the service to start at boot
systemctl enable media-downloader

# Start the service
systemctl start media-downloader

# Display status information
echo "Media Downloader service has been installed and started."
echo "Service status:"
systemctl status media-downloader

echo ""
echo "The service will automatically start on boot."
echo "You can manually control it with these commands:"
echo "  - sudo systemctl start media-downloader"
echo "  - sudo systemctl stop media-downloader"
echo "  - sudo systemctl restart media-downloader"

echo ""
echo "View logs with:"
echo "  - journalctl -u media-downloader -f"

# Get the local IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')
PORT=$(grep -o 'PORT=[0-9]*' "$BASE_DIR/run_app.sh" | cut -d'=' -f2)
if [ -z "$PORT" ]; then
  PORT=3000  # Default port if not found in run_app.sh
fi

echo ""
echo "Access Media Downloader at: http://$IP_ADDRESS:$PORT"
echo "from any device on your network."