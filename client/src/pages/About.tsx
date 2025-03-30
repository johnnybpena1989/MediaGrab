import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">About MediaGrab</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            MediaGrab aims to provide a simple, fast, and reliable way to save videos and audio from popular social media platforms.
            We believe in giving users the freedom to access content offline, with no registration required and no intrusive ads.
          </p>
          <p className="text-gray-700">
            Our platform supports a wide range of services including YouTube, Instagram, Facebook, TikTok, and X (formerly Twitter),
            with more platforms being added regularly.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">How We're Different</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Fast and Reliable</h3>
              <p className="text-gray-700">
                Our advanced download technology ensures quick and stable downloads even for high-definition videos.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Multi-platform Support</h3>
              <p className="text-gray-700">
                We support all major social media platforms with specialized optimizations for each one.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Quality Options</h3>
              <p className="text-gray-700">
                Choose the perfect balance between file size and quality with our multiple format options.
              </p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Responsible Use</h2>
          <p className="text-gray-700 mb-4">
            MediaGrab is designed for personal, non-commercial use only. We strongly encourage users to respect copyright 
            laws and the terms of service of content platforms. Only download content that you have the right to access.
          </p>
          <p className="text-gray-700">
            We do not host any videos on our servers - our service only facilitates the download of publicly available content.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Our Technology</h2>
          <p className="text-gray-700">
            MediaGrab uses cutting-edge web technologies to provide the best possible user experience:
          </p>
          <ul className="list-disc ml-6 mt-3 space-y-2 text-gray-700">
            <li>React-based frontend for a responsive, fast user interface</li>
            <li>Optimized backend with multiple download strategies</li>
            <li>Specialized handling for each supported platform</li>
            <li>Cross-platform compatibility with Windows, macOS, and Linux</li>
            <li>Mobile-friendly design that works on smartphones and tablets</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}