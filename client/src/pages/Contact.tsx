import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Mail, Clock, ArrowRight } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        
        <div className="mb-8">
          <p className="text-gray-700 mb-6 text-lg">
            Have a question, feedback, or need help with MediaGrab? We'd love to hear from you.
            For any inquiries, please reach out to us via email.
          </p>
          
          <div className="bg-white shadow-md rounded-lg p-8 border border-gray-100 max-w-xl mx-auto">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-red-50 p-3 rounded-full mb-4">
                <Mail className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Email Us</h2>
              <p className="text-gray-600 mb-4">
                Send us an email and we'll get back to you as soon as possible
              </p>
              
              <a 
                href="mailto:contact@grindinglunacy.com" 
                className="text-lg font-medium text-[#FF0000] hover:underline"
              >
                contact@grindinglunacy.com
              </a>
              
              <div className="flex items-center mt-4 text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>Response time: Within 24-48 hours</span>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">What you can contact us about:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Download issues or errors</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Feature requests and suggestions</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Platform support requests</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Bug reports</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>General questions</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 text-center">
              <Button 
                asChild
                className="bg-[#FF0000] hover:bg-[#CC0000]"
              >
                <a href="mailto:contact@grindinglunacy.com">
                  Send an Email
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}