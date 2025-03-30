import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { MediaData } from "@/pages/Home";
import { FaYoutube, FaInstagram, FaTwitter, FaFacebook, FaTiktok } from "react-icons/fa";

interface MediaPreviewProps {
  media: MediaData;
}

export default function MediaPreview({ media }: MediaPreviewProps) {
  const getPlatformIcon = (platform: string) => {
    const iconClasses = "h-4 w-4";
    switch (platform.toLowerCase()) {
      case "youtube":
        return <FaYoutube className={`${iconClasses} text-[#FF0000]`} />;
      case "instagram":
        return <FaInstagram className={`${iconClasses} text-[#405DE6]`} />;
      case "twitter":
      case "x":
        return <FaTwitter className={`${iconClasses} text-[#1DA1F2]`} />;
      case "facebook":
        return <FaFacebook className={`${iconClasses} text-blue-600`} />;
      case "tiktok":
        return <FaTiktok className={`${iconClasses} text-black`} />;
      default:
        return <FaYoutube className={`${iconClasses} text-[#FF0000]`} />;
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-1/3">
            <AspectRatio ratio={16 / 9} className="bg-gray-200 rounded-md overflow-hidden relative">
              {media.thumbnail ? (
                <img 
                  src={media.thumbnail} 
                  alt={`Thumbnail for ${media.title}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">No thumbnail</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#FF0000]/80 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
            </AspectRatio>
          </div>
          <div className="sm:w-2/3">
            <div className="flex items-start gap-2">
              <div className={`p-1.5 rounded-full ${
                media.platform.toLowerCase() === "youtube" ? "bg-red-100" :
                media.platform.toLowerCase() === "instagram" ? "bg-purple-100" :
                media.platform.toLowerCase() === "twitter" || media.platform.toLowerCase() === "x" ? "bg-blue-100" :
                media.platform.toLowerCase() === "facebook" ? "bg-blue-100" :
                media.platform.toLowerCase() === "tiktok" ? "bg-gray-100" : "bg-gray-100"
              }`}>
                {getPlatformIcon(media.platform)}
              </div>
              <h4 className="text-lg font-medium line-clamp-2">{media.title}</h4>
            </div>
            <div className="mt-2 text-gray-600 text-sm">
              {media.duration && (
                <p>Duration: <span className="font-medium">{media.duration}</span></p>
              )}
              <p>Source: <span className="font-medium">{media.platform}</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
