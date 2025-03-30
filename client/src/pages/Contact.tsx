import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulating form submission
    setTimeout(() => {
      toast({
        title: "Message sent",
        description: "We'll get back to you as soon as possible.",
      });
      
      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-gray-700 mb-6">
              Have a question, feedback, or need help with MediaGrab? We'd love to hear from you. 
              Fill out the form and we'll get back to you as soon as possible.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">contact@grindinglunacy.com</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">Response time: Within 24-48 hours</span>
              </div>
            </div>
            
            <div className="bg-gray-100 p-5 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Common Inquiries</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Download issues or errors</li>
                <li>• Feature requests</li>
                <li>• Platform support requests</li>
                <li>• Bug reports</li>
                <li>• General questions</li>
              </ul>
            </div>
          </div>
          
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input 
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input 
                  id="subject"
                  type="text"
                  placeholder="What is this regarding?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <Textarea 
                  id="message"
                  placeholder="Your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[150px]"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#FF0000] hover:bg-[#CC0000]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}