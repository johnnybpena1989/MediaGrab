@echo off
echo ===================================
echo   Media Downloader - Setup Script
echo ===================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: Node.js 16 or higher
    echo.
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=1,2,3 delims=." %%a in ('node -v') do (
    set NODE_MAJOR=%%a
    set NODE_MINOR=%%b
)
set NODE_MAJOR=%NODE_MAJOR:~1%

if %NODE_MAJOR% LSS 16 (
    echo WARNING: Your Node.js version is older than recommended.
    echo Current: v%NODE_MAJOR%.%NODE_MINOR%
    echo Recommended: v16 or higher
    echo The application might not work correctly.
    echo.
    choice /C YN /M "Do you want to continue anyway?"
    if %errorlevel% equ 2 exit /b 1
    echo.
)

:: Create downloads directory if it doesn't exist
if not exist "downloads" (
    echo Creating downloads directory...
    mkdir downloads
)

:: Install dependencies
echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies.
    pause
    exit /b 1
)

:: Check if yt-dlp is already installed
where yt-dlp >nul 2>nul
if %errorlevel% neq 0 (
    echo yt-dlp not found, downloading it now...
    
    :: Create a temp directory for downloads
    if not exist ".tmp" mkdir .tmp
    
    :: Download yt-dlp.exe
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile '.tmp\yt-dlp.exe'}"
    
    if not exist ".tmp\yt-dlp.exe" (
        echo ERROR: Failed to download yt-dlp.exe
        pause
        exit /b 1
    )
    
    :: Create a batch file in the PATH to run yt-dlp.exe
    echo Creating yt-dlp batch file...
    set YT_DLP_BAT=yt-dlp.bat
    
    echo @echo off > %YT_DLP_BAT%
    echo "%CD%\.tmp\yt-dlp.exe" %%* >> %YT_DLP_BAT%
    
    echo yt-dlp is now installed locally.
) else (
    echo yt-dlp is already installed.
)

:: Start the application
echo.
echo Starting the Media Downloader application...
echo.
call npm run dev

:: Keep the window open on error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Application exited with code %errorlevel%
    pause
)