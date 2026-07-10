import React, { useState, useRef } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

export const ChatInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (text && !disabled) {
      onSend(text);
      setMessage('');
      if (window.innerWidth > 768) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isSubmitDisabled = disabled || !message.trim();

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 animate-fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full h-[72px] bg-white rounded-[20px] px-[18px] py-[16px] gap-[12px] border border-[#E5E7EB] shadow-[0_12px_40px_rgba(15,23,42,0.12)] hover:shadow-[0_16px_48px_rgba(15,23,42,0.16)] focus-within:border-[#0F172A] focus-within:shadow-[0_12px_40px_rgba(15,23,42,0.18)] transition-all duration-200 ease-in-out"
      >
        {/* Left Icons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="text-[#9CA3AF] hover:text-[#374151] transition-colors cursor-not-allowed"
            title="Attach file"
          >
            <Paperclip size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="text-[#9CA3AF] hover:text-[#374151] transition-colors cursor-not-allowed"
            title="Voice input"
          >
            <Mic size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me anything..."
          autoComplete="off"
          className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[15px] text-[#0F172A] placeholder-[#9CA3AF] disabled:text-[#9CA3AF] tracking-wide"
          onKeyDown={handleKeyDown}
        />
        
        {/* Right Send Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="shrink-0 flex items-center justify-center w-[42px] h-[42px] rounded-full bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-white cursor-pointer disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Send size={18} strokeWidth={2} className={!isSubmitDisabled ? 'ml-0.5' : ''} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
