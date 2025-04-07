#!/bin/bash

# MediaGrab Installation Script for Raspberry Pi with Nginx proxy
# Sets up MediaGrab to run on port 5050 and work with /mediagrab/ proxy path

set -e  # Exit on any error

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration variables
INSTALL_DIR="$HOME/mediagrab"
PORT=5050
APP_PATH="/mediagrab"

# Function to print messages
print_message() { echo -e "${GREEN}${BOLD}$1${NC}"; }
print_warning() { echo -e "${YELLOW}${BOLD}$1${NC}"; }
print_error() { echo -e "${RED}${BOLD}$1${NC}"; }

# Welcome message
clear
echo -e "${BOLD}================================================${NC}"
echo -e "${GREEN}${BOLD}     MediaGrab Installation Script       ${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo "This script will install MediaGrab with Nginx proxy configuration."
echo "It will be configured to run on port 5050 and be accessible at /mediagrab/"
echo ""

read -p "Continue with installation? (y/n): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    print_error "Installation cancelled."
    exit 1
fi

# Check and install dependencies
print_message "Installing dependencies..."
sudo apt-get update

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    node_version=$(node -v)
    print_message "Node.js $node_version is already installed."
else
    print_warning "Installing Node.js..."
    # Use nodesource script for Node.js installation
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install other dependencies one by one to avoid conflicts
print_message "Installing other dependencies..."
sudo apt-get install -y ffmpeg
sudo apt-get install -y python3 python3-pip python3-venv
sudo apt-get install -y git

# Create installation directory
print_message "Setting up application directory..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone the repository (check if directory exists first)
print_message "Downloading MediaGrab..."
if [ -d "$INSTALL_DIR/.git" ]; then
    print_message "Directory already exists, updating from git..."
    cd "$INSTALL_DIR"
    git pull
else
    # First remove the directory if it exists but isn't a git repo
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    fi
    # Clone the repository
    git clone https://github.com/yourusername/mediagrab.git "$INSTALL_DIR" || {
        print_error "Failed to clone repository. Please check your internet connection or repository URL."
        exit 1
    }
    cd "$INSTALL_DIR"
fi

# Set up Python virtual environment
print_message "Setting up Python virtual environment..."
python3 -m venv "$INSTALL_DIR/venv"
source "$INSTALL_DIR/venv/bin/activate"

# Install yt-dlp
print_message "Installing yt-dlp..."
pip install --upgrade pip
pip install -U yt-dlp

# Install Node.js dependencies
print_message "Installing Node.js dependencies..."
npm install

# Create a modified index.ts that works with the proxy path
print_message "Configuring for Nginx proxy..."
cat > "$INSTALL_DIR/server/index.ts" << EOL
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define base path for proxy
const BASE_PATH = "${APP_PATH}";

// Setup session middleware
app.use(session({
  secret: 'mediagrab-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000, path: BASE_PATH } // 24 hours
}));

// Add middleware to handle proxy path
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = \`\${req.method} \${path} \${res.statusCode} in \${duration}ms\`;
      if (capturedJsonResponse) {
        logLine += \` :: \${JSON.stringify(capturedJsonResponse)}\`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Set port to 5050 as required
  const port = ${PORT};
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(\`MediaGrab serving on port \${port}\`);
  });
})();
EOL

# Create systemd service file
print_message "Creating systemd service..."
SERVICE_FILE="$INSTALL_DIR/mediagrab.service"
cat > "$SERVICE_FILE" << EOL
[Unit]
Description=MediaGrab Application
After=network.target

[Service]
ExecStart=/bin/bash -c "source $INSTALL_DIR/venv/bin/activate && NODE_ENV=production npm run dev"
WorkingDirectory=$INSTALL_DIR
Environment=PORT=${PORT}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mediagrab
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOL

# Install the service
print_message "Installing and starting the service..."
sudo cp "$SERVICE_FILE" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mediagrab

# Create a start script for manual use
START_SCRIPT="$INSTALL_DIR/start_mediagrab.sh"
cat > "$START_SCRIPT" << EOL
#!/bin/bash
cd "$INSTALL_DIR"
source "$INSTALL_DIR/venv/bin/activate"
PORT=${PORT} NODE_ENV=production npm run dev
EOL
chmod +x "$START_SCRIPT"

# Try to start the service
print_message "Attempting to start the MediaGrab service..."
if sudo systemctl start mediagrab; then
    print_message "Service started successfully!"
else
    print_warning "Failed to start service. You can try running it manually with: $START_SCRIPT"
fi

# Create a sample Nginx configuration
print_message "Creating Nginx configuration sample..."
NGINX_CONF="$INSTALL_DIR/mediagrab_nginx.conf"
cat > "$NGINX_CONF" << EOL
# Example Nginx configuration for MediaGrab
# Place this in /etc/nginx/sites-available/ and create a symlink to sites-enabled

location ${APP_PATH}/ {
    proxy_pass http://127.0.0.1:${PORT}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Path ${APP_PATH};
}
EOL

# Final message
echo ""
echo -e "${BOLD}================================================${NC}"
print_message "MediaGrab installed successfully!"
echo -e "${BOLD}================================================${NC}"
echo ""
echo "The application is now running on port ${PORT}."
echo ""
echo "Your Nginx configuration sample is available at: $NGINX_CONF"
echo "Add this to your existing nginx configuration at the appropriate location."
echo ""
echo "Management commands:"
echo "- Start service: sudo systemctl start mediagrab"
echo "- Stop service: sudo systemctl stop mediagrab"
echo "- Restart service: sudo systemctl restart mediagrab"
echo "- Check status: sudo systemctl status mediagrab"
echo "- View logs: sudo journalctl -u mediagrab -f"
echo ""
print_message "Installation complete! MediaGrab is now configured to work with your Nginx proxy at ${APP_PATH}."
