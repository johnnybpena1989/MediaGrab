import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose max-w-none text-gray-700">
          <p className="mb-4">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using MediaGrab ("Service"), you agree to be bound by these Terms of Service. If you do not
            agree to these terms, please do not use the Service.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">2. Description of Service</h2>
          <p>
            MediaGrab provides a web-based service that allows users to download videos and audio from various social media platforms
            for personal use. The Service is provided "as is" and "as available" without any warranties of any kind.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">3. User Responsibilities</h2>
          <p>
            When using our Service, you agree to:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>Use the Service only for lawful purposes and in accordance with these Terms.</li>
            <li>Not download copyrighted content without proper authorization.</li>
            <li>Not use the Service for commercial purposes without explicit permission.</li>
            <li>Not attempt to disrupt or compromise the security of the Service.</li>
            <li>Comply with all applicable laws and regulations.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">4. Intellectual Property</h2>
          <p>
            MediaGrab respects intellectual property rights and expects users to do the same. You should only download content
            that you have the legal right to access and download.
          </p>
          <p className="mt-3">
            The Service, including all of its content, features, and functionality, is owned by MediaGrab and is protected by
            international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">5. Fair Use and Copyright</h2>
          <p>
            MediaGrab is designed for personal, non-commercial use only. Downloading content for personal viewing may be considered fair use
            in some jurisdictions, but this can vary. It is your responsibility to ensure that your use of downloaded content
            complies with applicable copyright laws in your jurisdiction.
          </p>
          <p className="mt-3">
            MediaGrab does not encourage, promote, or condone copyright infringement or any other illegal activities.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">6. Limitation of Liability</h2>
          <p>
            In no event shall MediaGrab be liable for any indirect, incidental, special, consequential, or punitive damages, including
            without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or
            use of or inability to access or use the Service.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">7. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless MediaGrab and its officers, directors, employees, and agents from and against
            any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses arising from your use of the Service.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">8. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason
            whatsoever, including without limitation if you breach the Terms.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. It is your responsibility to review these Terms periodically
            for changes. Your continued use of the Service following the posting of any changes constitutes acceptance of those changes.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="/contact" className="text-[#FF0000] hover:underline">our contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}