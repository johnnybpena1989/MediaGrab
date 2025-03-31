# Media Downloader - Raspberry Pi Installation

This guide provides instructions for installing the Media Downloader application on your Raspberry Pi.

## Requirements

- Raspberry Pi 3 or newer (with at least 1GB RAM)
- Raspberry Pi OS (Bullseye or newer)
- Internet connection

## Installation Options

### Option 1: One-Click Installer (Recommended)

1. Download the installer script:
   ```bash
   wget -O install_media_downloader.sh https://raw.githubusercontent.com/yourusername/media-downloader/main/install_media_downloader.sh
   ```

2. Make the script executable:
   ```bash
   chmod +x install_media_downloader.sh
   ```

3. Run the installer:
   ```bash
   ./install_media_downloader.sh
   ```

4. Follow the prompts to complete the installation.

### Option 2: Manual Installation

If you prefer to install manually:

1. Install dependencies:
   ```bash
   sudo apt-get update
   sudo apt-get install -y nodejs npm python3 python3-pip ffmpeg git
   sudo pip3 install -U yt-dlp
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/media-downloader.git
   cd media-downloader
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Modify the port in server/index.ts:
   - Open server/index.ts in a text editor
   - Change `const port = 5000;` to your desired port number
   - Or use the environment variable: `PORT=5050 npm run dev`

5. Start the application:
   ```bash
   npm run dev
   ```

## Usage

Once installed, you can:

1. Access the application in your web browser at: `http://localhost:PORT` (replace PORT with your configured port)
2. Use the desktop shortcut created during installation
3. Start/stop the service with: `sudo systemctl start|stop media-downloader`

## Troubleshooting

Common issues and solutions:

### Port Conflicts
If the default port is already in use, you can:
- Choose a different port during installation
- Modify the PORT environment variable in `/etc/systemd/system/media-downloader.service`
- Run with a custom port: `PORT=8080 npm run dev`

### Download Issues
If you encounter download problems:
- Ensure yt-dlp is up to date: `sudo pip3 install -U yt-dlp`
- Check internet connectivity: `ping google.com`
- Verify that the download directory exists and is writable

### Service Not Starting
If the systemd service doesn't start:
- Check the logs: `sudo journalctl -u media-downloader -f`
- Verify the service file: `cat /etc/systemd/system/media-downloader.service`
- Restart the service: `sudo systemctl restart media-downloader`

## Updating

To update the application:

1. Stop the service:
   ```bash
   sudo systemctl stop media-downloader
   ```

2. Navigate to the installation directory:
   ```bash
   cd ~/media-downloader  # Or your custom installation directory
   ```

3. Pull the latest changes:
   ```bash
   git pull
   ```

4. Update dependencies:
   ```bash
   npm install
   ```

5. Restart the service:
   ```bash
   sudo systemctl start media-downloader
   ```

For yt-dlp updates:
```bash
sudo pip3 install -U yt-dlp
```

## Customization

The installation script creates several files that can be customized:

- **Service file**: `/etc/systemd/system/media-downloader.service`
- **Start script**: `~/media-downloader/start_media_downloader.sh`
- **Desktop shortcut**: `~/Desktop/Media-Downloader.desktop`

## Uninstallation

To completely remove the application:

```bash
sudo systemctl stop media-downloader
sudo systemctl disable media-downloader
sudo rm /etc/systemd/system/media-downloader.service
sudo systemctl daemon-reload
rm -rf ~/media-downloader  # Or your custom installation directory
rm ~/Desktop/Media-Downloader.desktop
```