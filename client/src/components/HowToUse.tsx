import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HowToUse() {
  return (
    <Card id="how-to">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">How to Use</h3>
        <ol className="ml-5 list-decimal space-y-3">
          <li>Copy the video URL from YouTube</li>
          <li>Paste the URL into the input box above and click "Analyze"</li>
          <li>Select your preferred quality from the available options</li>
          <li>Click the download button and wait for the download to complete</li>
          <li>The video file will be saved to your device's default download location</li>
        </ol>
        
        <Alert variant="warning" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>YouTube Protection Limitations</AlertTitle>
          <AlertDescription>
            <p>Due to YouTube's protective measures against automated downloads, only lower quality versions may be available. Higher quality formats might fail during download.</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
