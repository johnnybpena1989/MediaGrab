# Media Downloader - Raspberry Pi Setup Guide

This guide will help you set up the Media Downloader application on your Raspberry Pi, allowing you to access it from any device on your home network.

## Requirements

- Raspberry Pi (3 or newer recommended)
- Raspbian OS / Raspberry Pi OS installed
- Internet connection
- Node.js (v16 or newer)

## Installation Steps

### 1. Install Node.js (if not already installed)

```bash
# Update your system
sudo apt update
sudo apt upgrade -y

# Install Node.js and npm
sudo apt install -y nodejs npm

# Check Node.js version
node -v
```

If the Node.js version is below 16, you may need to install a newer version:

```bash
# Install Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Set Up the Application

Transfer the Media Downloader files to your Raspberry Pi using one of these methods:
- Copy from a USB drive
- Use `scp` to copy files from another computer
- Clone from a Git repository if available
- Download and extract a zip file

Navigate to the application directory:

```bash
cd /path/to/media-downloader
```

### 3. Make the Scripts Executable

```bash
chmod +x run_app.sh
chmod +x install_as_service.sh
```

### 4. Run the Application Manually

To run the application with the default port (3000):

```bash
./run_app.sh
```

To run on a different port (for example, 8080):

```bash
./run_app.sh 8080
```

### 5. Install as a System Service (Optional, Recommended)

To set up the application to run automatically when your Raspberry Pi boots:

```bash
# Install with default port (3000)
sudo ./install_as_service.sh

# Or specify a custom port (e.g., 8080)
sudo ./install_as_service.sh 8080
```

## Accessing the Application

Once the application is running, you can access it from any device on your network:

1. Find your Raspberry Pi's IP address (usually displayed in the console when starting the app)
2. Open a web browser on any device on your network
3. Enter the URL: `http://[RASPBERRY_PI_IP]:[PORT]`
   (e.g., `http://192.168.1.100:3000`)

## Managing the Service

If you installed the application as a service, you can manage it with these commands:

```bash
# Check the service status
sudo systemctl status media-downloader

# View real-time logs
sudo journalctl -u media-downloader -f

# Restart the service
sudo systemctl restart media-downloader

# Stop the service
sudo systemctl stop media-downloader

# Start the service (if stopped)
sudo systemctl start media-downloader

# Disable autostart at boot
sudo systemctl disable media-downloader

# Enable autostart at boot
sudo systemctl enable media-downloader
```

## Troubleshooting

### Application Not Starting
Check the logs for errors:
```bash
cat logs/app.log
# Or if running as a service
sudo journalctl -u media-downloader -e
```

### Port Already in Use
If you get an error that the port is already in use, try a different port:
```bash
./run_app.sh 8081  # Try a different port number
```

### Network Access Issues
If you can't access the application from other devices:
1. Check that your Raspberry Pi is on the same network
2. Verify that the application is binding to "0.0.0.0" not "localhost"
3. Ensure there's no firewall blocking the port

## Updating the Application

To update the application, stop the service, replace the files with the new version, and restart the service:

```bash
sudo systemctl stop media-downloader
# Update files here
sudo systemctl start media-downloader
```