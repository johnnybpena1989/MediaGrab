@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo      Media Downloader - One-Click Installation Script
echo ========================================================
echo.

:: Set up the installation directory 
set APP_NAME=MediaDownloader
set INSTALL_DIR=%USERPROFILE%\%APP_NAME%

:: If the script is already running from the installation directory, use the current directory
if "%CD%"=="%INSTALL_DIR%" (
    set INSTALL_DIR=%CD%
    set ALREADY_INSTALLED=true
) else (
    set ALREADY_INSTALLED=false
)

:: Create the isolated installation environment if not already there
if "%ALREADY_INSTALLED%"=="false" (
    echo Creating isolated environment at: %INSTALL_DIR%
    
    if not exist "%INSTALL_DIR%" (
        mkdir "%INSTALL_DIR%"
    )
    
    :: Copy all project files to the installation directory if not already there
    if not exist "%INSTALL_DIR%\package.json" (
        echo Copying application files to isolated environment...
        xcopy /E /I /Y "%CD%\*" "%INSTALL_DIR%\"
    )
    
    :: Change to the installation directory
    cd /d "%INSTALL_DIR%"
)

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
    if !errorlevel! equ 2 exit /b 1
    echo.
)

:: Create downloads directory if it doesn't exist
if not exist "downloads" (
    echo Creating downloads directory...
    mkdir downloads
)

:: Set up log directory
if not exist "logs" (
    mkdir logs
)

:: Install dependencies (only if node_modules doesn't exist or package.json has changed)
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo ERROR: Failed to install Node.js dependencies.
        echo Check logs\npm_error.log for details.
        call npm install > logs\npm_error.log 2>&1
        pause
        exit /b 1
    )
) else (
    echo Node modules already installed.
)

:: Check if yt-dlp is already installed
echo Checking yt-dlp installation...
where yt-dlp >nul 2>nul
if !errorlevel! neq 0 (
    echo yt-dlp not found, downloading it now...
    
    :: Create a bin directory for executables
    if not exist "bin" mkdir bin
    
    :: Download yt-dlp.exe
    echo Downloading yt-dlp.exe...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile 'bin\yt-dlp.exe'}" > logs\ytdlp_download.log 2>&1
    
    if not exist "bin\yt-dlp.exe" (
        echo ERROR: Failed to download yt-dlp.exe.
        echo Check logs\ytdlp_download.log for details.
        pause
        exit /b 1
    )
    
    :: Create a batch file in the PATH to run yt-dlp.exe
    echo @echo off > yt-dlp.bat
    echo "%INSTALL_DIR%\bin\yt-dlp.exe" %%* >> yt-dlp.bat
    
    echo yt-dlp is now installed locally.
) else (
    echo yt-dlp is already installed.
)

:: Create a shortcut on the desktop if not there already
if "%ALREADY_INSTALLED%"=="false" (
    echo Creating a desktop shortcut...
    
    powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Media Downloader.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\run_app.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = 'shell32.dll,44'; $Shortcut.Save()}"
    
    :: Copy this script to the installation directory if not already there
    if not exist "%INSTALL_DIR%\run_app.bat" (
        copy "%~f0" "%INSTALL_DIR%\run_app.bat" > nul
    )
)

:: Start the application
echo.
echo Starting the Media Downloader application...
echo Environment: %INSTALL_DIR%
echo.

:: Set up environment for local development
echo Setting up local environment variables...
set LOCAL_ENV=true
set NODE_ENV=development

:: Start the application in development mode
echo Starting the application in development mode...
call npm run dev

:: Keep the window open on error
if !errorlevel! neq 0 (
    echo.
    echo ERROR: Application exited with code !errorlevel!
    echo Check logs directory for details.
    pause
)

endlocal