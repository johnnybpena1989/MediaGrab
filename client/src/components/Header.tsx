import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto p-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-[#FF0000]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
            />
          </svg>
          <h1 className="ml-2 text-xl font-bold">MediaGrab</h1>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li><Link href="/" className="text-[#212529] hover:text-[#FF0000] transition">Home</Link></li>
            <li><a href="#how-to" className="text-[#212529] hover:text-[#FF0000] transition">How-to</a></li>
            <li><a href="#faq" className="text-[#212529] hover:text-[#FF0000] transition">FAQ</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
