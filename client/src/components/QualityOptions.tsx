import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Music } from "lucide-react";
import { MediaData } from "@/pages/Home";
import { MediaFormat } from "@shared/schema";

interface QualityOptionsProps {
  media: MediaData;
  onDownload: (format: MediaFormat) => void;
}

export default function QualityOptions({ media, onDownload }: QualityOptionsProps) {
  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Format & Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video Options Section */}
          <div>
            <h4 className="text-base font-medium mb-3 flex items-center">
              <Film className="h-5 w-5 mr-1 text-[#FF0000]" />
              Video
            </h4>

            {media.formats.video && media.formats.video.length > 0 ? (
              media.formats.video.map((format, index) => (
                <div 
                  key={`video-${format.formatId}-${index}`}
                  className="quality-option mb-2 border border-gray-200 rounded-md p-3 hover:border-[#FF0000] transition flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{format.resolution || format.quality}</div>
                    <div className="text-sm text-gray-500">
                      {format.extension.toUpperCase()} • {formatFileSize(format.filesize)}
                    </div>
                  </div>
                  <Button 
                    className="bg-[#FF0000] hover:bg-[#FF0000]/90 text-white"
                    onClick={() => onDownload(format)}
                  >
                    Download
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No video formats available for this media</div>
            )}
          </div>

          {/* Audio Options Section */}
          <div>
            <h4 className="text-base font-medium mb-3 flex items-center">
              <Music className="h-5 w-5 mr-1 text-[#405DE6]" />
              Audio
            </h4>

            {media.formats.audio && media.formats.audio.length > 0 ? (
              media.formats.audio.map((format, index) => (
                <div 
                  key={`audio-${format.formatId}-${index}`}
                  className="quality-option mb-2 border border-gray-200 rounded-md p-3 hover:border-[#405DE6] transition flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">
                      {format.extension.toUpperCase()} - {format.quality}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format.bitrate || 'Standard'} • {formatFileSize(format.filesize)}
                    </div>
                  </div>
                  <Button 
                    className="bg-[#405DE6] hover:bg-[#405DE6]/90 text-white"
                    onClick={() => onDownload(format)}
                  >
                    Download
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No audio formats available for this media</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
