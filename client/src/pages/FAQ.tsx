import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        
        <div className="mb-8">
          <p className="text-gray-700 mb-6">
            Find answers to the most common questions about using MediaGrab. If you can't find the information 
            you're looking for, please visit our <a href="/contact" className="text-[#FF0000] hover:underline">Contact page</a>.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">
                Which platforms does MediaGrab support?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>MediaGrab currently supports the following platforms:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>YouTube</li>
                  <li>Instagram</li>
                  <li>Facebook</li>
                  <li>TikTok</li>
                  <li>X (Twitter)</li>
                </ul>
                <p className="mt-2">We regularly add support for more platforms based on user demand.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">
                Is it legal to download videos using MediaGrab?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>The legality of downloading videos varies by country and use case. In many countries, downloading videos for personal use is considered fair use. However, downloading copyrighted content for redistribution or commercial purposes is generally illegal.</p>
                <p className="mt-2">MediaGrab is designed for personal use only. We encourage users to respect copyright laws and only download content they have the right to access.</p>
                <p className="mt-2">If you're unsure about the legality in your specific situation, we recommend consulting local legal resources.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">
                Why can't I download some videos?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>There are several reasons why a video might not be downloadable:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>The video is private or restricted</li>
                  <li>The platform has implemented new protection measures</li>
                  <li>Regional restrictions on the content</li>
                  <li>The video URL format is not recognized by our system</li>
                </ul>
                <p className="mt-2">Our team constantly works to update MediaGrab to handle new platform changes and restrictions.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">
                What quality options are available for downloads?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>MediaGrab offers various quality options for both video and audio downloads:</p>
                <p className="mt-2"><strong>Video:</strong> We typically offer multiple resolutions from 360p to 1080p (and even 4K when available). The exact options depend on what the original platform provides.</p>
                <p className="mt-2"><strong>Audio:</strong> We provide MP3 format with different bitrate options for optimal sound quality.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">
                Where are downloaded files saved?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>Downloaded files are saved to your device's default download location, which is usually the "Downloads" folder. The exact location depends on your browser settings.</p>
                <p className="mt-2">In most browsers, you can change your download location in your browser settings.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-lg font-medium">
                How can I download YouTube playlists?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>Currently, MediaGrab supports downloading individual videos only. Playlist support is planned for a future update.</p>
                <p className="mt-2">For now, you would need to download each video in the playlist individually.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger className="text-lg font-medium">
                Does MediaGrab collect user data?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>MediaGrab collects minimal data necessary for the service to function. We do not track your browsing history or the content you download.</p>
                <p className="mt-2">For more details, please review our <a href="/privacy" className="text-[#FF0000] hover:underline">Privacy Policy</a>.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-8">
              <AccordionTrigger className="text-lg font-medium">
                Is there a limit to how many videos I can download?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>There is no specific limit to the number of videos you can download. However, we implement fair usage policies to ensure the service remains available for everyone.</p>
                <p className="mt-2">Excessive downloading in short periods may result in temporary rate limiting.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9">
              <AccordionTrigger className="text-lg font-medium">
                Can I use MediaGrab on mobile devices?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>Yes, MediaGrab is fully compatible with mobile browsers on both Android and iOS devices.</p>
                <p className="mt-2">The experience is optimized for mobile screens, making it easy to download content while on the go.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-10">
              <AccordionTrigger className="text-lg font-medium">
                How do I report a bug or request a feature?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700">
                <p>You can report bugs or request features through our <a href="/contact" className="text-[#FF0000] hover:underline">Contact page</a>.</p>
                <p className="mt-2">We appreciate your feedback and use it to improve MediaGrab.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}