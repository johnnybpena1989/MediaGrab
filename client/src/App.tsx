import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import type { BaseLocationHook } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect, useState } from "react";

// Add BASE_PATH to Window interface
declare global {
  interface Window {
    BASE_PATH?: string;
  }
}

// Get base path from environment or from meta tag
const getBasePath = (): string => {
  // First try to get from environment
  const envBase = import.meta.env.VITE_BASE_URL;
  if (envBase) return envBase.endsWith('/') ? envBase : envBase + '/';
  
  // Then from window object if set by our nginx-subpath.ts script
  if (typeof window !== 'undefined' && window.BASE_PATH) {
    return window.BASE_PATH.endsWith('/') ? window.BASE_PATH : window.BASE_PATH + '/';
  }
  
  // Then try to get from the X-Base-Path header (saved in meta)
  const metaBase = document.querySelector('meta[name="base-path"]')?.getAttribute('content');
  if (metaBase) return metaBase.endsWith('/') ? metaBase : metaBase + '/';
  
  // Finally, look for base tag
  const baseHref = document.querySelector('base')?.getAttribute('href');
  if (baseHref) return baseHref;
  
  // Default to root if nothing found
  return '/';
};

// Create a base location hook for wouter that matches BaseLocationHook type
const useBaseLocation: BaseLocationHook = () => {
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
  
  // Return the adjusted location and a navigate function
  // that handles the base path
  return [
    adjustedLocation, 
    (to: string) => {
      // If it's an absolute path, prepend the base path
      if (to.startsWith('/')) {
        to = basePath + to.slice(1);
      }
      
      // Update browser history and location state
      window.history.pushState(null, '', to);
      setLocation(to);
    }
  ];
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
