import React from "react";
import { MessageSquare, X } from "lucide-react";

export const ChatLauncher = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full ${isOpen ? "hidden" : "flex"} items-center justify-center cursor-pointer z-50 hover:scale-[1.04] active:scale-[0.96] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97C4D] focus-visible:ring-offset-2 group bg-[#0F172A] shadow-[0_8px_32px_rgba(15,23,42,0.3)]`}
      aria-label="Toggle chat assistant"
    >
      <div className="relative w-6 h-6 flex items-center justify-center text-white">
        {/* Chat Icon */}
        <span
          className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOpen
              ? "opacity-0 rotate-90 scale-50"
              : "opacity-100 rotate-0 scale-100"
          }`}
        >
          <MessageSquare size={22} className="stroke-[1.5]" />
        </span>

        {/* Close Icon */}
        <span
          className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            isOpen
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50"
          }`}
        >
          <X size={22} className="stroke-[1.5]" />
        </span>
      </div>
    </button>
  );
};

export default ChatLauncher;
