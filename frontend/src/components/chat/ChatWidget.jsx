import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useChatStore from '../../store/chatStore';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import ChatLauncher from './ChatLauncher';

export const ChatWidget = () => {
  const { 
    isOpen, 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages, 
    toggleChat, 
    closeChat 
  } = useChatStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const location = useLocation();

  // Lock body scroll when chat is open to prevent page scrolling in background
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsComposing(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset fullscreen when minimized or closed
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Close chat on page navigation
  useEffect(() => {
    if (isOpen) {
      closeChat();
    }
  }, [location.pathname]);

  const handleMinimize = () => {
    closeChat();
    setIsFullscreen(false);
    setIsComposing(false);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleSendMessage = (text) => {
    sendMessage(text);
    setIsComposing(false);
  };

  // Don't render chat widget in admin portal
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed z-[9999] glass-panel flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${
          isFullscreen
            ? 'top-0 left-0 right-0 bottom-0 w-full h-full rounded-none border-none'
            : 'top-0 left-0 right-0 bottom-0 w-full h-full rounded-none border-none sm:top-auto sm:left-auto sm:bottom-28 sm:right-6 sm:w-[400px] sm:h-[680px] sm:max-w-[calc(100vw-32px)] sm:max-h-[calc(100vh-140px)] sm:rounded-[24px]'
        } ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto visible'
            : 'opacity-0 translate-y-8 scale-95 pointer-events-none invisible'
        } overflow-hidden`}
      >
        <ChatHeader
          onMinimize={handleMinimize}
          onClear={clearMessages}
          canClear={messages.length > 0}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
        
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSelectSuggestion={handleSendMessage}
          isComposing={isComposing}
          onStartComposing={(initialMessage) => {
            setIsComposing(true);
            if (initialMessage) {
              useChatStore.getState().addBotMessage(initialMessage);
            }
          }}
        />
        
        {(messages.length > 0 || isComposing) && (
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
          />
        )}

        {/* Background Gradient Orbs */}
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-brand-600/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
      </div>

      {/* Launcher button */}
      {!isFullscreen && (
        <ChatLauncher isOpen={isOpen} onClick={toggleChat} />
      )}
    </>
  );
};

export default ChatWidget;
