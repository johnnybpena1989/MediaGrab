import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose max-w-none text-gray-700">
          <p className="mb-4">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          
          <p className="mb-4">
            MediaGrab ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our website and services.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Process</h2>
          
          <h3 className="text-lg font-medium mt-4 mb-2">1.1 Temporary Processing Information</h3>
          <p>
            When you use MediaGrab, we temporarily process the following information solely to provide our download service:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>URLs of videos you want to download (processed temporarily, not stored)</li>
            <li>Your download preferences (format, quality, etc.) for the current session only</li>
          </ul>
          
          <h3 className="text-lg font-medium mt-4 mb-2">1.2 We Do Not Collect or Store</h3>
          <p>
            Unlike many web services, we do not collect or store:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>IP addresses</li>
            <li>Browser type</li>
            <li>Operating system information</li>
            <li>Device information</li>
            <li>Usage data (pages visited, time spent, etc.)</li>
            <li>User accounts or profiles</li>
            <li>Download history</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Handle Your Information</h2>
          <p>
            The information we temporarily process is used only for:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>Processing your current download request</li>
            <li>Delivering the requested media file to your device</li>
            <li>Providing download progress information during active downloads</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">3. Session Usage</h2>
          <p>
            We use browser sessions only to maintain the state of your current download. We do not use persistent cookies 
            for tracking or analytics purposes. Session information is automatically cleared when you close your browser 
            or after a short period of inactivity.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">4. Media File Handling</h2>
          <p>
            Media files that you download are temporarily stored on our servers only during the download process. Once the download 
            is complete or after a short timeout period (approximately one minute), the files are automatically and permanently 
            deleted from our servers. We do not maintain copies of your downloaded content.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Security</h2>
          <p>
            While no information is permanently stored, we implement appropriate technical measures to protect any temporarily 
            processed information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee 
            absolute security during the download process.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Third-Party Content</h2>
          <p>
            Our Service processes content from third-party platforms (YouTube, Instagram, TikTok, etc.). We do not control 
            and are not responsible for the privacy practices of these platforms. Please review the privacy policies of these 
            third-party services for information about how they collect and use your data.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Children's Privacy</h2>
          <p>
            Our Service is not intended for use by children under the age of 13. We do not knowingly process information 
            from children under 13.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last updated" date.
          </p>
          <p className="mt-3">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective 
            when they are posted on this page.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="/contact" className="text-[#FF0000] hover:underline">our contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}