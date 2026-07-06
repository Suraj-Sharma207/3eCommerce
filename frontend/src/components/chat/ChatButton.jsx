import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import useChatStore from '../../store/chatStore';

const ChatButton = () => {
  const { isOpen, toggleChat } = useChatStore();

  return (
    <button
      onClick={toggleChat}
      className={`
        fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50
        ${isOpen ? 'bg-gray-800 text-white hover:bg-gray-900 rotate-90' : 'bg-brand-600 text-white hover:bg-brand-700 hover:scale-105'}
      `}
      aria-label="Toggle AI Chat"
    >
      {isOpen ? <X className="w-6 h-6 -rotate-90 transition-transform" /> : <MessageCircle className="w-6 h-6" />}
    </button>
  );
};

export default ChatButton;
