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
            MediaGrab ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our website and services.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
          
          <h3 className="text-lg font-medium mt-4 mb-2">1.1 Information You Provide</h3>
          <p>
            When you use MediaGrab, we collect minimal information necessary to provide our services:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>URLs of videos you want to download</li>
            <li>Your download preferences (format, quality, etc.)</li>
            <li>Contact information if you reach out to us through our contact form</li>
          </ul>
          
          <h3 className="text-lg font-medium mt-4 mb-2">1.2 Automatically Collected Information</h3>
          <p>
            We automatically collect certain information when you visit or use our website:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Operating system</li>
            <li>Device information</li>
            <li>Usage data (pages visited, time spent, etc.)</li>
            <li>Referring website</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
          <p>
            We use the collected information for various purposes:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>To provide and maintain our Service</li>
            <li>To process and complete your download requests</li>
            <li>To respond to your inquiries and support requests</li>
            <li>To monitor and analyze usage patterns and trends</li>
            <li>To detect, prevent, and address technical issues</li>
            <li>To improve our website and user experience</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">3. Cookies and Similar Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
            Cookies are files with a small amount of data that may include an anonymous unique identifier.
          </p>
          <p className="mt-3">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
            if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Retention</h2>
          <p>
            We retain your information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy. 
            Media files that you download are not stored on our servers beyond the download process. Once the download is complete, 
            the files are automatically deleted from our servers.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information. However, no method 
            of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Third-Party Services</h2>
          <p>
            Our Service may contain links to third-party websites, services, or advertisements. These third parties have separate 
            and independent privacy policies. We have no responsibility or liability for the content and activities of these linked sites.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Children's Privacy</h2>
          <p>
            Our Service is not intended for use by children under the age of 13. We do not knowingly collect personal information 
            from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it immediately.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, such as:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>The right to access, update, or delete your information</li>
            <li>The right to rectification (to correct inaccurate information)</li>
            <li>The right to object to or restrict processing of your information</li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last updated" date.
          </p>
          <p className="mt-3">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective 
            when they are posted on this page.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="/contact" className="text-[#FF0000] hover:underline">our contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}