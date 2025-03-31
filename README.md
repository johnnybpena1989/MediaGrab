# Media Downloader

A web-based media downloader that enables users to extract videos and audio from popular social platforms with advanced quality selection and flexible download options.

## Features

- Multi-platform media extraction (YouTube, Instagram, TikTok, Twitter, Facebook)
- Quality selection for downloads
- Audio extraction support (MP3 format)
- Automatic file download directly to your device
- Clean and intuitive user interface

## Requirements

- Windows operating system
- Node.js (version 16 or higher)
- Internet connection

## Installation Instructions

### One-Click Installation (Windows)

1. Download the project files
2. Double-click on the `run_app.bat` file
3. The script will:
   - Create an isolated installation at `%USERPROFILE%\MediaDownloader`
   - Install all required dependencies
   - Download yt-dlp (required for media extraction)
   - Create a desktop shortcut
   - Start the application automatically

### Manual Installation

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

## Usage

1. Open your browser and go to `http://localhost:5000`
2. Paste a URL from a supported platform (YouTube, Instagram, TikTok, etc.)
3. Click "Analyze" to fetch video information
4. Select your preferred quality and format
5. Click "Download"
6. The file will automatically download to your device

## Supported Platforms

- YouTube
- Instagram
- TikTok
- Twitter/X
- Facebook

## Troubleshooting

### Common Issues

- **yt-dlp not found**: The script will attempt to download it automatically. If it fails, download it manually from [yt-dlp's GitHub](https://github.com/yt-dlp/yt-dlp/releases) and place it in the `bin` folder.
- **Download not starting**: Check if your URL is from a supported platform and is publicly accessible.
- **Quality options not showing**: Some platforms limit the available quality options. Try a different video.
- **ENOTSUP error when starting the server**: This has been fixed in the latest version. The script now automatically sets `LOCAL_ENV=true` which makes the server listen on `127.0.0.1` (localhost) instead of `0.0.0.0`, which resolves this issue on Windows systems.
- **Port already in use**: If port 5000 is already in use on your system, either close the application using it or modify the port number in `server/index.ts` file.

### Logs

The application creates log files in the `logs` directory. Check these logs if you encounter any issues.

## Technical Information

- Frontend: React with TailwindCSS and Shadcn components
- Backend: Node.js with Express
- Media extraction: yt-dlp
- Package management: npm

## License

This project is for educational purposes only. Always respect the terms of service of the platforms you're downloading from.