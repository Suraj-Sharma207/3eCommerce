import React from 'react';
import { MessageSquare, X } from 'lucide-react';

export const ChatLauncher = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-16 h-16 rounded-full glass-panel ${isOpen ? 'hidden sm:flex' : 'flex'} items-center justify-center cursor-pointer z-50 hover:scale-[1.04] active:scale-[0.96] transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090B13] group`}
      aria-label="Toggle chat assistant"
    >
      <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#c084fc] to-[#818cf8] opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
      
      <div className="relative w-7 h-7 flex items-center justify-center text-[#f3f4f6]">
        {/* Chat Icon */}
        <span
          className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
        >
          <MessageSquare size={24} className="stroke-[1.5]" />
        </span>
        
        {/* Close Icon */}
        <span
          className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
        >
          <X size={24} className="stroke-[1.5]" />
        </span>
      </div>
    </button>
  );
};

export default ChatLauncher;
