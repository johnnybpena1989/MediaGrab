import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DownloadProgressProps {
  fileName: string;
  progress: number;
  downloadedSize: number;
  totalSize: number;
  remainingTime: string;
  onCancel: () => void;
}

export default function DownloadProgress({ 
  fileName, 
  progress, 
  downloadedSize, 
  totalSize, 
  remainingTime,
  onCancel 
}: DownloadProgressProps) {
  
  // Format file size in MB
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Downloading...</h3>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">{fileName}</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full h-2.5" />
          <div className="mt-3 flex justify-between text-sm text-gray-500">
            <span>{formatSize(downloadedSize)} / {formatSize(totalSize)}</span>
            <span>{remainingTime} remaining</span>
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              className="text-gray-600 hover:text-gray-800"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
