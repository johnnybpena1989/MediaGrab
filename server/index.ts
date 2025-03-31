import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware
app.use(session({
  secret: 'mediagrab-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
  
  // Force development mode for local environments
  const isLocalDev = process.env.LOCAL_ENV === 'true';
  
  if (app.get("env") === "development" || isLocalDev) {
    // Always use development mode for local installations
    process.env.NODE_ENV = 'development';
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Set up the port for the server
  // Use PORT environment variable if set, otherwise use default values
  // For Raspberry Pi and other local installations, this can be configured
  const defaultPort = 5000;
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
  
  // Check the environment we're running in
  const isReplit = process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT_ID;
  const isLocalEnv = process.env.LOCAL_ENV === 'true';
  const isPiEnv = process.env.PI_ENV === 'true';
  const isWindowsEnv = process.platform === 'win32';
  
  if (isReplit) {
    // On Replit, use "::" (IPv6 equivalent of 0.0.0.0) to listen on all interfaces
    server.listen(port, "::", () => {
      log(`serving on port ${port} (Replit environment)`);
    });
  } else if (isPiEnv) {
    // On Raspberry Pi, listen on all network interfaces (0.0.0.0)
    // This allows other devices on the network to access the app
    server.listen(port, "0.0.0.0", () => {
      try {
        // Try to get the Raspberry Pi's IP address for convenience
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        let localIp = '0.0.0.0';
        
        // Find a non-internal IPv4 address
        for (const name of Object.keys(nets)) {
          for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
              localIp = net.address;
              break;
            }
          }
        }
        
        log(`serving on port ${port} (Raspberry Pi - accessible at http://${localIp}:${port})`);
      } catch (err) {
        log(`serving on port ${port} (Raspberry Pi - accessible on local network)`);
      }
    });
  } else if (isLocalEnv && isWindowsEnv) {
    // On Windows local environments, use localhost (127.0.0.1)
    server.listen(port, "127.0.0.1", () => {
      log(`serving on port ${port} (Windows local environment - using 127.0.0.1)`);
    });
  } else {
    // Default case - determine based on platform
    const host = isWindowsEnv ? "127.0.0.1" : "0.0.0.0";
    server.listen(port, host, () => {
      log(`serving on port ${port} (using ${host})`);
    });
  }
})();
