#!/bin/bash

# Media Downloader - Raspberry Pi Service Installation Script
echo "========================================================="
echo "    Media Downloader - Service Installation Script"
echo "========================================================="
echo ""

# Default port - can be overridden by passing a parameter: ./install_as_service.sh 8080
DEFAULT_PORT=3000
PORT=${1:-$DEFAULT_PORT}

# Get the absolute path of the application directory
APP_DIR=$(pwd)
SERVICE_NAME="media-downloader"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Check if script is run with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run with sudo to install the service."
    echo "Please run: sudo $0 $PORT"
    exit 1
fi

# Make the run script executable
chmod +x "${APP_DIR}/run_app.sh"

# Create the systemd service file
echo "Creating systemd service file..."
cat > $SERVICE_FILE << EOL
[Unit]
Description=Media Downloader Web Application
After=network.target

[Service]
Type=simple
User=$(logname)
WorkingDirectory=${APP_DIR}
ExecStart=${APP_DIR}/run_app.sh ${PORT}
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=${SERVICE_NAME}
Environment=NODE_ENV=production PORT=${PORT} PI_ENV=true

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd, enable and start the service
echo "Enabling and starting the service..."
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl start ${SERVICE_NAME}

# Get local IP address
LOCAL_IP=$(hostname -I | cut -d' ' -f1)

echo ""
echo "Media Downloader service has been installed and started!"
echo "You can access the application at: http://${LOCAL_IP}:${PORT}"
echo ""
echo "Useful commands:"
echo "  - Check service status: sudo systemctl status ${SERVICE_NAME}"
echo "  - View logs: sudo journalctl -u ${SERVICE_NAME} -f"
echo "  - Restart service: sudo systemctl restart ${SERVICE_NAME}"
echo "  - Stop service: sudo systemctl stop ${SERVICE_NAME}"
echo ""
echo "The service will automatically start when your Raspberry Pi boots up."