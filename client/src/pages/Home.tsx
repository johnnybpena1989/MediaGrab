import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UrlInput from "@/components/UrlInput";
import MediaPreview from "@/components/MediaPreview";
import QualityOptions from "@/components/QualityOptions";
import DownloadProgress from "@/components/DownloadProgress";
import HowToUse from "@/components/HowToUse";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MediaFormat } from "@shared/schema";

export type MediaData = {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  formats: {
    video: MediaFormat[];
    audio: MediaFormat[];
  };
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [mediaData, setMediaData] = useState<MediaData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadInfo, setDownloadInfo] = useState<{ name: string; size: number; downloaded: number; remaining: string } | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      try {
        const res = await apiRequest("POST", "/api/analyze", { url });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to analyze URL");
        }
        
        return res.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to analyze URL");
      }
    },
    onSuccess: (data) => {
      setMediaData(data);
    },
    onError: (error: any) => {
      // Clear any existing media data
      setMediaData(null);
      
      // Set the error message for UI display
      setAnalyzeError(error.message || "Failed to analyze URL. Please try a different video or try again later.");
      
      // Display error toast with specific message
      toast({
        title: "Error analyzing URL",
        description: error.message || "Please try a different URL or try again later.",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ url, format }: { url: string; format: MediaFormat }) => {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      try {
        // Start the download first
        const res = await apiRequest("POST", "/api/download", { 
          url, 
          format: format.formatId,
          quality: format.quality 
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to start download");
        }
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to start download");
        }
        
        // Create EventSource for progress updates
        const eventSource = new EventSource(`/api/download/progress`);
        
        return new Promise((resolve, reject) => {
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              // Check if there's an error
              if (data.error) {
                eventSource.close();
                setIsDownloading(false);
                reject(new Error(data.message || "Download failed"));
                return;
              }
              
              setDownloadProgress(data.progress || 0);
              setDownloadInfo({
                name: data.filename || "Downloading...",
                size: data.totalSize || 0,
                downloaded: data.downloadedSize || 0,
                remaining: data.remainingTime || "Calculating..."
              });
              
              if (data.progress >= 100) {
                eventSource.close();
                setIsDownloading(false);
                
                // Trigger automatic file download by redirecting to the file endpoint
                // This will download the file directly to the user's device
                window.location.href = `/api/download/file/${data.downloadId || ''}`;
                
                console.log("Initiating direct file download for:", data.downloadId);
                
                resolve({ success: true, message: "Download complete" });
              }
            } catch (err) {
              console.error("Error parsing SSE data:", err);
            }
          };
          
          eventSource.onerror = (err) => {
            console.error("SSE error:", err);
            eventSource.close();
            setIsDownloading(false);
            reject(new Error("Connection to download stream lost. Please try again."));
          };
        });
      } catch (error: any) {
        setIsDownloading(false);
        throw new Error(error.message || "Failed to download media");
      }
    },
    onSuccess: () => {
      toast({
        title: "Download complete",
        description: "Your media has been successfully downloaded.",
      });
    },
    onError: (error: any) => {
      setIsDownloading(false);
      toast({
        title: "Download failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleUrlSubmit = async (url: string) => {
    if (!url) return;
    // Reset previous state
    setMediaData(null);
    setAnalyzeError(null);
    
    // Start new analysis
    analyzeMutation.mutate(url);
  };

  const handleDownload = (format: MediaFormat) => {
    if (!url) return;
    downloadMutation.mutate({ url, format });
  };

  const cancelDownload = () => {
    apiRequest("POST", "/api/download/cancel", {}).then(() => {
      setIsDownloading(false);
      toast({
        title: "Download canceled",
        description: "The download has been canceled.",
      });
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#FF0000]/90 to-[#405DE6]/90 text-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Download Videos & Audio</h2>
            <p className="text-lg max-w-2xl mx-auto">
              Save content from YouTube, Instagram, X, Facebook, and TikTok directly to your device
            </p>
          </div>
        </section>

        {/* Downloader Section */}
        <section className="py-8 md:py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <UrlInput 
              url={url} 
              setUrl={setUrl} 
              onSubmit={handleUrlSubmit} 
              isLoading={analyzeMutation.isPending} 
            />

            {analyzeMutation.isPending && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <p>Analyzing URL...</p>
                </div>
              </div>
            )}
            
            {!analyzeMutation.isPending && analyzeError && !mediaData && (
              <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6 mb-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-red-800 mb-2">Unable to analyze video</h3>
                  <p className="text-sm text-red-600 mb-4">{analyzeError}</p>
                  
                  {analyzeError.includes("bot protection") && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg w-full">
                      <h4 className="text-sm font-medium text-amber-800 mb-1">YouTube Bot Protection Detected</h4>
                      <p className="text-xs text-amber-700 mb-2">
                        YouTube has increased its security measures and detected our download request as automated activity.
                      </p>
                      <p className="text-xs text-amber-700">
                        Try a different video or try again later when YouTube's security checks reset.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button 
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      onClick={() => {
                        setAnalyzeError(null);
                        setUrl("");
                      }}
                    >
                      Try a different URL
                    </button>
                    
                    <button 
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        setAnalyzeError(null);
                        analyzeMutation.mutate(url);
                      }}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mediaData && (
              <MediaPreview media={mediaData} />
            )}

            {mediaData && !isDownloading && (
              <QualityOptions 
                media={mediaData} 
                onDownload={handleDownload} 
              />
            )}

            {isDownloading && downloadInfo && (
              <DownloadProgress 
                progress={downloadProgress} 
                fileName={downloadInfo.name} 
                downloadedSize={downloadInfo.downloaded}
                totalSize={downloadInfo.size}
                remainingTime={downloadInfo.remaining}
                onCancel={cancelDownload}
              />
            )}

            <HowToUse />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
