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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/analyze", { url });
      return res.json();
    },
    onSuccess: (data) => {
      setMediaData(data);
    },
    onError: (error) => {
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
      
      // Create EventSource for progress updates
      const eventSource = new EventSource(`/api/download/progress`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setDownloadProgress(data.progress);
        setDownloadInfo({
          name: data.filename,
          size: data.totalSize,
          downloaded: data.downloadedSize,
          remaining: data.remainingTime
        });
        
        if (data.progress >= 100) {
          eventSource.close();
          setIsDownloading(false);
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
      };
      
      // Start the download
      const res = await apiRequest("POST", "/api/download", { 
        url, 
        format: format.formatId,
        quality: format.quality 
      });
      
      return res.json();
    },
    onError: (error) => {
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
    setMediaData(null);
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
