import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Copyright() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Copyright Information</h1>
        
        <div className="prose max-w-none text-gray-700">
          <h2 className="text-xl font-semibold mt-6 mb-3">Our Copyright Policy</h2>
          <p>
            MediaGrab respects the intellectual property rights of others and expects its users to do the same. 
            We provide a service that allows users to download media content from various platforms for personal use only.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Copyright Compliance</h2>
          <p>
            When using MediaGrab, please ensure that you:
          </p>
          <ul className="list-disc ml-6 my-3 space-y-1">
            <li>Only download content that you have the legal right to access</li>
            <li>Use downloaded content in accordance with applicable copyright laws</li>
            <li>Do not download content for commercial use without proper authorization</li>
            <li>Respect the terms of service of the original platforms</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Fair Use</h2>
          <p>
            In many jurisdictions, limited use of copyrighted material without permission is allowed under the doctrine of "fair use" 
            or "fair dealing." This typically includes uses such as personal viewing, commentary, criticism, news reporting, 
            research, teaching, or scholarship.
          </p>
          <p className="mt-3">
            However, fair use rules vary by country and circumstance. It is your responsibility to understand and comply with the 
            copyright laws in your jurisdiction.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Digital Millennium Copyright Act (DMCA)</h2>
          <p>
            MediaGrab complies with the provisions of the Digital Millennium Copyright Act (DMCA) and other applicable copyright laws. 
            We will promptly remove any content that infringes on the copyrights of others upon receiving proper notification.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Copyright Infringement Notification</h2>
          <p>
            If you believe that your copyrighted work has been used in a way that constitutes copyright infringement, please provide 
            us with the following information:
          </p>
          <ol className="list-decimal ml-6 my-3 space-y-1">
            <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity</li>
            <li>Your contact information, including your address, telephone number, and email address</li>
            <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law</li>
            <li>A statement that the information provided is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
          </ol>
          
          <p>
            You can submit a copyright infringement notification via our <a href="/contact" className="text-[#FF0000] hover:underline">Contact page</a>.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Counter-Notification</h2>
          <p>
            If you believe that your content was removed due to a mistake or misidentification, you may submit a counter-notification 
            with the following information:
          </p>
          <ol className="list-decimal ml-6 my-3 space-y-1">
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that has been removed or to which access has been disabled, and the location where the material appeared before it was removed or disabled</li>
            <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification</li>
            <li>Your name, address, telephone number, and email address</li>
            <li>A statement that you consent to the jurisdiction of the federal court in the district where you reside, or if you reside outside the United States, any judicial district in which the service provider may be found</li>
            <li>A statement that you will accept service of process from the person who provided the original notification</li>
          </ol>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Repeat Infringers</h2>
          <p>
            MediaGrab maintains a policy of terminating the accounts of repeat infringers in appropriate circumstances.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Disclaimer</h2>
          <p>
            MediaGrab is a service that facilitates downloading content from various platforms. We do not host, store, or distribute 
            any media content on our servers beyond the temporary storage necessary to process download requests. 
            All downloaded content is immediately removed from our servers after the download is complete.
          </p>
          <p className="mt-3">
            We are not responsible for the content that users download using our service. It is the user's responsibility to ensure 
            that their use of downloaded content complies with applicable copyright laws.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-3">Contact Information</h2>
          <p>
            For any copyright-related inquiries, please contact us through our <a href="/contact" className="text-[#FF0000] hover:underline">Contact page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}