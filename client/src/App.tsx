import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect, useState } from "react";

// Get base path from environment or from meta tag
const getBasePath = (): string => {
  // First try to get from environment
  const envBase = import.meta.env.VITE_BASE_URL;
  if (envBase) return envBase.endsWith('/') ? envBase : envBase + '/';
  
  // Then from window object if set by our nginx-subpath.ts script
  if (window.BASE_PATH) return window.BASE_PATH.endsWith('/') ? window.BASE_PATH : window.BASE_PATH + '/';
  
  // Then try to get from the X-Base-Path header (saved in meta)
  const metaBase = document.querySelector('meta[name="base-path"]')?.getAttribute('content');
  if (metaBase) return metaBase.endsWith('/') ? metaBase : metaBase + '/';
  
  // Finally, look for base tag
  const baseHref = document.querySelector('base')?.getAttribute('href');
  if (baseHref) return baseHref;
  
  // Default to root if nothing found
  return '/';
};

// Create a base location hook for wouter
const useBaseLocation = () => {
  const [location, setLocation] = useState(window.location.pathname);
  const basePath = getBasePath();
  
  // Adjust the pathname to be relative to the base path
  const adjustedLocation = location.startsWith(basePath) 
    ? location.slice(basePath.length - 1) 
    : location;
  
  useEffect(() => {
    // Listen for location changes
    const handleLocationChange = () => {
      setLocation(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  // Return the adjusted location
  return [adjustedLocation, setLocation];
};

// Custom router that handles base path
function Router() {
  return (
    <WouterRouter hook={useBaseLocation}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
