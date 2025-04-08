import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get the base path from environment variables or other sources
const getApiBasePath = (): string => {
  // Try to get from environment variable
  const envBase = import.meta.env.VITE_BASE_URL;
  if (envBase) return envBase.endsWith('/') ? envBase : envBase + '/';
  
  // Try to get from window object if set by our nginx-subpath.ts script
  if (typeof window !== 'undefined' && window.BASE_PATH) {
    return window.BASE_PATH.endsWith('/') ? window.BASE_PATH : window.BASE_PATH + '/';
  }
  
  // Default to root
  return '/';
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If the URL starts with /api, prepend the base path
  if (url.startsWith('/api') && url !== '/api') {
    const basePath = getApiBasePath();
    // If basePath is not just /, then prepend it to the url
    if (basePath !== '/') {
      // Remove leading slash from URL if base path doesn't end with one
      if (basePath.endsWith('/')) {
        url = basePath + url.substring(1);
      } else {
        url = basePath + url;
      }
    }
  }
  
  console.log(`Making API request to: ${url}`);
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the API URL with any base path applied
    let url = queryKey[0] as string;
    
    // If the URL starts with /api, prepend the base path
    if (url.startsWith('/api')) {
      const basePath = getApiBasePath();
      // If basePath is not just /, then prepend it to the url
      if (basePath !== '/') {
        // Remove leading slash from URL if base path doesn't end with one
        if (basePath.endsWith('/')) {
          url = basePath + url.substring(1);
        } else {
          url = basePath + url;
        }
      }
    }
    
    console.log(`Making query request to: ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
