# Raspberry Pi Setup Guide

This guide provides detailed instructions for setting up the Media Downloader on a Raspberry Pi to create a network-accessible download server for all devices on your home network.

## Why Use a Raspberry Pi?

Running the Media Downloader on a Raspberry Pi offers several advantages:

1. **Always on**: Your Raspberry Pi can run 24/7 with minimal power consumption
2. **Network accessibility**: All devices on your network can access the service without installation
3. **Centralized downloads**: Files download to a single location, making organization easier
4. **No installation needed** on each device: Just access through any web browser

## Requirements

- Raspberry Pi (any model, but Pi 3 or newer recommended for better performance)
- Raspberry Pi OS (formerly Raspbian) installed and configured
- Internet connection
- Basic knowledge of terminal commands

## Installation

### Step 1: Update Your Raspberry Pi

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Download the Media Downloader

```bash
# Create a directory for the application
mkdir -p ~/media-downloader
cd ~/media-downloader

# Clone or download the repository
git clone <repository-url> .
# Or unzip downloaded files into this directory
```

### Step 4: Install Dependencies

```bash
# Install npm dependencies
npm install
```

### Step 5: Set Up the Service

```bash
# Make the scripts executable
chmod +x run_app.sh
chmod +x install_as_service.sh

# Run the installation script (installs as a system service)
sudo ./install_as_service.sh
```

## Configuration

### Default Configuration

By default, the Media Downloader will:
- Run on port 3000
- Create downloads in the `~/media-downloader/downloads` directory
- Start automatically when your Raspberry Pi boots

### Changing the Port

If you need to change the port (e.g., if port 3000 is being used by another service):

1. Edit the `run_app.sh` script:
   ```bash
   nano run_app.sh
   ```

2. Change the `PORT` value to your desired port number:
   ```bash
   PORT=3000  # Change this to your desired port
   ```

3. Save the file (Ctrl+O, then Enter)

4. Restart the service:
   ```bash
   sudo systemctl restart media-downloader
   ```

### Changing the Download Location

To change where downloaded files are stored:

1. Edit the `run_app.sh` script:
   ```bash
   nano run_app.sh
   ```

2. Change the `DOWNLOADS_DIR` value:
   ```bash
   DOWNLOADS_DIR="$BASE_DIR/downloads"  # Change this to your desired path
   ```

3. Make sure the directory exists and has proper permissions:
   ```bash
   mkdir -p [your new downloads directory]
   chmod 755 [your new downloads directory]
   ```

4. Restart the service:
   ```bash
   sudo systemctl restart media-downloader
   ```

## Accessing the Media Downloader

1. Find your Raspberry Pi's IP address:
   ```bash
   hostname -I
   ```

2. From any device on your network, open a web browser and navigate to:
   ```
   http://<your-pi-ip-address>:3000
   ```
   (replace `3000` with your custom port if you changed it)

## Managing the Service

### Checking Service Status

```bash
sudo systemctl status media-downloader
```

### Stopping the Service

```bash
sudo systemctl stop media-downloader
```

### Starting the Service

```bash
sudo systemctl start media-downloader
```

### Restarting the Service

```bash
sudo systemctl restart media-downloader
```

### Disabling Autostart

If you don't want the service to start automatically on boot:

```bash
sudo systemctl disable media-downloader
```

### Re-enabling Autostart

```bash
sudo systemctl enable media-downloader
```

## Viewing Logs

To view the service logs for troubleshooting:

```bash
journalctl -u media-downloader -f
```

## Accessing Downloaded Files

### Option 1: Through the File System

Connect to your Raspberry Pi using SSH or VNC and navigate to the downloads directory:

```bash
cd ~/media-downloader/downloads
```

### Option 2: Setting Up a Samba Share

For easy access from Windows devices, you can set up a Samba share:

```bash
# Install Samba
sudo apt install samba samba-common-bin -y

# Create a backup of the Samba configuration
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak

# Edit the Samba configuration
sudo nano /etc/samba/smb.conf
```

Add the following at the end of the file:

```
[MediaDownloads]
path = /home/pi/media-downloader/downloads
browseable = yes
writeable = yes
create mask = 0777
directory mask = 0777
public = no
```

Set up a Samba password:

```bash
sudo smbpasswd -a pi
```

Restart the Samba service:

```bash
sudo systemctl restart smbd
```

Now you can access the downloads from any Windows device by navigating to:
```
\\<your-pi-ip-address>\MediaDownloads
```

## Troubleshooting

### Service Won't Start

Check the logs for errors:
```bash
journalctl -u media-downloader -e
```

Common issues:
- Port already in use: Change the port as described in the Configuration section
- Permission issues: Make sure the user running the service has access to the necessary directories

### Cannot Access from Other Devices

- Verify the Pi's IP address has not changed: `hostname -I`
- Check if a firewall is blocking the port: `sudo ufw status`
- If using a firewall, allow the port: `sudo ufw allow 3000/tcp`
- Verify all devices are on the same network

### Downloads Fail

- Check if yt-dlp is installed and up to date:
  ```bash
  cd ~/media-downloader
  ./update_ytdlp.sh
  ```
- Verify internet connectivity on the Raspberry Pi
- Check for storage space issues: `df -h`

## Keeping the Software Updated

### Updating the Media Downloader

```bash
cd ~/media-downloader
git pull
npm install
sudo systemctl restart media-downloader
```

### Updating yt-dlp

```bash
cd ~/media-downloader
./update_ytdlp.sh
```

## Advanced: Adding HTTPS Support

For secure access, you can set up HTTPS using a reverse proxy like Nginx with Let's Encrypt. This is recommended if you plan to access the service from outside your home network.

This setup involves several steps and is beyond the scope of this basic guide. Research "Nginx Let's Encrypt Raspberry Pi" for detailed tutorials.

## Security Considerations

- The Media Downloader service does not include authentication. It's designed for use on trusted home networks.
- If exposing to the internet (not recommended), use a VPN or add authentication through a reverse proxy.
- Keep your Raspberry Pi and all software up to date to patch security vulnerabilities.