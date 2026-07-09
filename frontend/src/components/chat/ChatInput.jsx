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
    <div className="shrink-0 p-4 bg-transparent mt-auto relative z-10 w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end w-full glass-panel rounded-[24px] p-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-400/30 transition-all duration-300 shadow-lg"
      >
        <div className="flex flex-col w-full">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything..."
            autoComplete="off"
            className="w-full min-h-[44px] px-3 pt-1 bg-transparent border-0 outline-none text-[14px] text-slate-100 placeholder-slate-500 disabled:text-slate-600 transition-colors tracking-wide font-light"
            onKeyDown={handleKeyDown}
          />
          
          <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors cursor-not-allowed opacity-50"
                title="Attach file (coming soon)"
              >
                <Paperclip size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors cursor-not-allowed opacity-50"
                title="Voice input (coming soon)"
              >
                <Mic size={16} strokeWidth={2} />
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex items-center justify-center w-8 h-8 rounded-[12px] bg-gradient-to-br from-brand-400 to-brand-600 hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:from-slate-800 disabled:to-slate-800 text-white cursor-pointer disabled:cursor-not-allowed transition-all shadow-md shadow-brand-900/30"
            >
              <Send size={14} strokeWidth={2.5} className="ml-0.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
