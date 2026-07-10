import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';

export const ChatWindow = ({
  messages,
  isLoading,
  onSelectSuggestion,
  isComposing,
  onStartComposing
}) => {
  const containerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Check if user is scrolled up by more than 30px from bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 30;
    setShowScrollBtn(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Run initial check
      handleScroll();
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [messages, isLoading]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 min-h-0 relative flex flex-col">
      {/* Scrollable chat messages container */}
      <div 
        ref={containerRef} 
        className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col relative z-0 ${messages.length === 0 && !isComposing ? 'bg-transparent' : 'bg-[#FAFAF8]'}`}
      >
        {messages.length === 0 && !isComposing ? (
          <WelcomeScreen onActionClick={onSelectSuggestion} onStartComposing={onStartComposing} />
        ) : (
          <div className="flex flex-col gap-5 w-full px-5 pt-6 pb-[110px] bg-[#FAFAF8]">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Arrow Button - Positioned fixed relative to ChatWindow wrapper */}
      {showScrollBtn && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-[96px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-[#ECECEC] shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-[#C97C4D] hover:text-[#B5673D] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer z-30 animate-fade-in"
          title="Scroll to bottom"
        >
          <ChevronDown size={18} strokeWidth={2.5} className="mt-0.5" />
        </button>
      )}
    </div>
  );
};

export default ChatWindow;
