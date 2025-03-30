import { 
  FaYoutube, 
  FaInstagram, 
  FaTwitter, 
  FaFacebook, 
  FaTiktok 
} from "react-icons/fa";

export default function PlatformIcons() {
  return (
    <div className="mt-5 flex flex-wrap gap-3 justify-center">
      <PlatformIcon 
        platform="YouTube" 
        icon={<FaYoutube className="h-6 w-6 text-[#FF0000]" />} 
        bgColor="bg-red-100" 
      />
      
      <PlatformIcon 
        platform="Instagram" 
        icon={<FaInstagram className="h-6 w-6 text-[#405DE6]" />} 
        bgColor="bg-purple-100" 
      />
      
      <PlatformIcon 
        platform="X (Twitter)" 
        icon={<FaTwitter className="h-6 w-6 text-[#1DA1F2]" />} 
        bgColor="bg-blue-100" 
      />
      
      <PlatformIcon 
        platform="Facebook" 
        icon={<FaFacebook className="h-6 w-6 text-blue-600" />} 
        bgColor="bg-blue-100" 
      />
      
      <PlatformIcon 
        platform="TikTok" 
        icon={<FaTiktok className="h-6 w-6 text-black" />} 
        bgColor="bg-gray-100" 
      />
    </div>
  );
}

interface PlatformIconProps {
  platform: string;
  icon: React.ReactNode;
  bgColor: string;
}

function PlatformIcon({ platform, icon, bgColor }: PlatformIconProps) {
  return (
    <div className="platform-icon flex flex-col items-center transition-all duration-200 hover:scale-110" title={platform}>
      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${bgColor}`}>
        {icon}
      </div>
      <span className="text-xs mt-1">{platform}</span>
    </div>
  );
}
