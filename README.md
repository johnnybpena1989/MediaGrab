# Media Downloader

A versatile web-based media downloader that enables users to extract videos and audio from popular social platforms with advanced quality selection and flexible download options. The application can be installed on Windows devices or run on a Raspberry Pi to serve all devices on your home network.

## Features

- Multi-platform media extraction (YouTube, Instagram, TikTok, Twitter, Facebook)
- Quality selection for downloads
- Audio extraction support (MP3 format)
- Automatic file download directly to your device
- Clean and intuitive user interface
- YouTube authenticated downloads for restricted content
- Raspberry Pi support for home network access

## Requirements

### For Windows
- Windows operating system
- Node.js (version 16 or higher)
- Internet connection

### For Raspberry Pi
- Raspberry Pi (any model with network capability)
- Raspberry Pi OS (formerly Raspbian)
- Node.js (version 16 or higher)
- Internet connection

## Installation Instructions

### Windows Installation

#### One-Click Installation
1. Download the project files
2. Double-click on the `run_app.bat` file
3. The script will:
   - Create an isolated installation at `%USERPROFILE%\MediaDownloader`
   - Install all required dependencies
   - Download yt-dlp (required for media extraction)
   - Create a desktop shortcut
   - Start the application automatically

#### Manual Installation
If you prefer to install manually:

```bash
# Clone or download the repository
git clone <repository-url>

# Navigate to the project directory
cd media-downloader

# Install dependencies
npm install

# Run the application
npm run dev
```

### Raspberry Pi Installation

1. Transfer the project files to your Raspberry Pi
2. Navigate to the project directory
3. Make the setup script executable:
   ```bash
   chmod +x run_app.sh
   ```
4. Run the setup script:
   ```bash
   ./run_app.sh
   ```
5. To install as a system service (starts automatically on boot):
   ```bash
   sudo ./install_as_service.sh
   ```

## Usage

### Local Windows Usage
1. Open your browser and go to `http://localhost:5000`
2. Paste a URL from a supported platform (YouTube, Instagram, TikTok, etc.)
3. Click "Analyze" to fetch video information
4. Select your preferred quality and format
5. Click "Download"
6. The file will automatically download to your device

### Raspberry Pi Network Usage
1. Find your Raspberry Pi's IP address using `hostname -I`
2. From any device on your network, open a browser and go to `http://<raspberry-pi-ip>:3000`
3. Use the application as described above

### YouTube Restricted Content
For age-restricted or private videos on YouTube:
1. Click the "Login to YouTube" button
2. Follow the login prompts
3. Once authenticated, you'll be able to download restricted content

## Supported Platforms

- YouTube (including age-restricted and private videos with authentication)
- Instagram
- TikTok
- Twitter/X
- Facebook

## Configuration

### Changing the Port
- Windows: Edit the `LOCAL_PORT` environment variable in `run_app.bat`
- Raspberry Pi: Edit the `PORT` variable in `run_app.sh`

## Troubleshooting

### Common Issues

- **yt-dlp not found**: The script will attempt to download it automatically. If it fails, download it manually from [yt-dlp's GitHub](https://github.com/yt-dlp/yt-dlp/releases) and place it in the `bin` folder.
- **Download not starting**: Check if your URL is from a supported platform and is publicly accessible.
- **Quality options not showing**: Some platforms limit the available quality options. Try a different video.
- **ENOTSUP error when starting the server**: This has been fixed in the latest version. The script now automatically sets `LOCAL_ENV=true` which makes the server listen on `127.0.0.1` (localhost) instead of `0.0.0.0`, which resolves this issue on Windows systems.
- **Port already in use**: If port 5000 (Windows) or 3000 (Raspberry Pi) is already in use, modify the port number in the configuration.
- **Cannot access from other devices**: Make sure your Raspberry Pi is on the same network and check if any firewall is blocking the port.

### Logs

The application creates log files in the `logs` directory. Check these logs if you encounter any issues.

## Technical Information

- Frontend: React with TailwindCSS and Shadcn components
- Backend: Node.js with Express
- Media extraction: yt-dlp
- Package management: npm
- Authentication: Session-based cookies for YouTube

## License

This project is for educational purposes only. Always respect the terms of service of the platforms you're downloading from.