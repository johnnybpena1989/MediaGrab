import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import PlatformIcons from "./PlatformIcons";

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({ url, setUrl, onSubmit, isLoading }: UrlInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
  };

  const clearUrl = () => {
    setUrl("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Enter Media URL</h3>
      <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleSubmit}>
        <div className="relative flex-grow">
          <Input
            type="url"
            placeholder="Paste link from YouTube, Instagram, etc."
            className="w-full py-6 px-4"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          {url && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={clearUrl}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          className="py-3 px-6 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white" 
          disabled={isLoading || !url}
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
              Analyzing
            </span>
          ) : (
            <span className="flex items-center">
              Analyze
              <ArrowRight className="h-5 w-5 ml-1" />
            </span>
          )}
        </Button>
      </form>
      
      <PlatformIcons />
    </div>
  );
}
