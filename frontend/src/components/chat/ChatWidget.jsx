import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import ChatMessage from './ChatMessage';
import ChatButton from './ChatButton';

const ChatWidget = () => {
  const { isOpen, messages, isLoading, sendMessage, clearHistory, closeChat } = useChatStore();
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  // Close chat on route change
  useEffect(() => {
    if (isOpen) {
      closeChat();
    }
    if (isFullscreen) {
      setIsFullscreen(false);
    }
    if (isFullscreen) {
      setIsFullscreen(false);
    }
  }, [location.pathname]);

  // Clear chat history when user logs in or out
  useEffect(() => {
    clearHistory();
  }, [user?.id, clearHistory]);

  const initialized = useRef(false);

  // Initial greeting removed per user request

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  // Don't render chat widget in admin portal
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <ChatButton />
      
      {/* Chat Window */}
      <div 
        className={`
          fixed bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-100 z-[100]
          transition-all duration-300
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
          ${isFullscreen 
            ? 'top-0 left-0 right-0 bottom-0 w-full h-full rounded-none' 
            : 'bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-2xl origin-bottom-right'
          }
        `}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="font-semibold text-sm">AI Shopping Assistant</h3>
              <p className="text-xs text-gray-400">Ask about products, orders, or policies</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              title={isFullscreen ? "Minimize" : "Maximize"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={clearHistory}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              title="Start new conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 scroll-smooth">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-gray-500 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition-shadow"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`
                absolute right-2 p-2 rounded-lg flex items-center justify-center transition-colors
                ${input.trim() && !isLoading 
                  ? 'bg-brand-600 text-white hover:bg-brand-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">AI can make mistakes. Check important info.</p>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;
