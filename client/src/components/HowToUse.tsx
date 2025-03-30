import { Card, CardContent } from "@/components/ui/card";

export default function HowToUse() {
  return (
    <Card id="how-to">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">How to Use</h3>
        <ol className="ml-5 list-decimal space-y-3">
          <li>Copy the video URL from any supported platform (YouTube, Instagram, X, Facebook, TikTok)</li>
          <li>Paste the URL into the input box above and click "Analyze"</li>
          <li>Select your preferred quality and format</li>
          <li>Click the download button and wait for the download to complete</li>
          <li>The media file will be saved to your device's default download location</li>
        </ol>
      </CardContent>
    </Card>
  );
}
