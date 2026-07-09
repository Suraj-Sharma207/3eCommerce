import React, { useEffect, useRef } from 'react';
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

  // Auto scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-6 flex flex-col min-h-0 relative z-0">
      {messages.length === 0 && !isComposing ? (
        <WelcomeScreen onActionClick={onSelectSuggestion} onStartComposing={onStartComposing} />
      ) : (
        <div className="flex flex-col gap-6 w-full pb-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div className="h-4" />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
