import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import useChatStore from '../../store/chatStore';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const { sendMessage } = useChatStore();
  const [selectedReply, setSelectedReply] = useState(null);

  const handleQuickReplyClick = (reply) => {
    if (selectedReply) return; // Prevent double clicks
    setSelectedReply(reply);
    sendMessage(reply);
  };
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 
          ${isUser ? 'ml-2 bg-gray-200 text-gray-600' : 'mr-2 bg-brand-100 text-brand-600'}`}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        {/* Message Content */}
        <div className="flex flex-col min-w-0">
          <div className={`
            px-4 py-3 rounded-2xl
            ${isUser 
              ? 'bg-gray-900 text-white rounded-tr-sm' 
              : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm'}
            ${message.isError ? 'bg-red-50 text-red-700 border-red-100' : ''}
          `}>
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
          
          {/* Products Render */}
          {message.products && message.products.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {message.products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          {/* Action Render */}
          {message.action === 'login' && (
            <div className="mt-3">
              <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
                <LogIn size={16} />
                Sign In
              </Link>
            </div>
          )}

          {message.quick_replies && message.quick_replies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.quick_replies.map((reply, i) => {
                const isSelected = selectedReply === reply;
                const isDisabled = selectedReply !== null;
                
                return (
                  <button
                    key={i}
                    onClick={() => handleQuickReplyClick(reply)}
                    disabled={isDisabled}
                    className={`
                      px-3 py-1.5 text-xs font-semibold rounded-full transition-colors shadow-sm whitespace-nowrap border
                      ${isSelected 
                        ? 'bg-brand-600 border-brand-600 text-white' 
                        : isDisabled 
                          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-white border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300'
                      }
                    `}
                  >
                    {reply}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Knowledge Sources Render */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-1">
              <span>Sources:</span>
              {message.sources.map((s, i) => (
                <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded">
                  {s.type === 'product' ? 'Catalog' : s.title}
                </span>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ChatMessage;
