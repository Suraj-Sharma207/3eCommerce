import React from 'react';
import { Cat } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 w-full animate-slide-up group" data-testid="typing-indicator">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-[12px] bg-gradient-to-br from-[#c084fc] to-[#818cf8] p-[1px] shadow-sm mt-0.5">
        <div className="w-full h-full bg-[#111522] rounded-[11px] flex items-center justify-center text-white">
          <Cat size={18} />
        </div>
      </div>
      
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div className="px-4 py-4 rounded-[16px] rounded-tl-[4px] glass-bubble flex items-center gap-1.5 shadow-sm border border-indigo-900/10 min-w-[60px] h-[45px] justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80 typing-dot" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80 typing-dot" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80 typing-dot" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
