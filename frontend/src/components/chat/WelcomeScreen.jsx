import React from 'react';
import { Search, Package, Sparkles, MessageCircle, ChevronRight, Cat } from 'lucide-react';

export const WelcomeScreen = ({ onActionClick, onStartComposing }) => {
  const handleSearchClick = (message) => {
    if (onStartComposing) {
      onStartComposing(message);
    }
    // Focus the input field when clicked with a small delay to allow render
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Ask me anything..."]');
      if (input) {
        input.focus();
      }
    }, 50);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 pb-12 animate-slide-up w-full">
      {/* Bot Icon */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 p-[1px] mb-8 shadow-xl shadow-brand-900/30">
        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-white">
          <Cat size={36} />
        </div>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">
        Find your next <span className="text-brand-400">favorite</span> piece
      </h1>
      
      {/* Subtitle */}
      <p className="text-[15px] text-slate-300 mb-10 text-center max-w-[260px] leading-relaxed">
        Ask me to find products, check an order, or just say hi.
      </p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Main Search Button */}
        <button
          onClick={() => handleSearchClick("Please type your product name below (e.g., 'I want a wooden table').")}
          className="w-full relative overflow-hidden group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-left transition-all duration-300 shadow-lg shadow-brand-900/40 hover:-translate-y-1"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm">
              <Search className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-[15px] mb-0.5">Search Products</span>
              <span className="text-white/80 text-[11px] font-medium">Find sofas, chairs, tables and more</span>
            </div>
          </div>
          <ChevronRight className="text-white/80" size={20} />
        </button>

        {/* Small Action Buttons */}
        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          <button
            onClick={() => onActionClick('show my orders')}
            className="flex flex-col items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all duration-300 group"
          >
            <Package className="text-brand-400 group-hover:scale-110 transition-transform" size={18} />
            <span className="text-[11px] font-medium text-slate-300 text-center leading-tight">Order<br/>Status</span>
          </button>
          
          <button
            onClick={() => handleSearchClick("What would you like to know about our store or products?")}
            className="flex flex-col items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all duration-300 group"
          >
            <Sparkles className="text-brand-400 group-hover:scale-110 transition-transform" size={18} />
            <span className="text-[11px] font-medium text-slate-300 text-center leading-tight">Ask<br/>Anything</span>
          </button>

          <button
            onClick={() => onActionClick('hello')}
            className="flex flex-col items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all duration-300 group"
          >
            <MessageCircle className="text-brand-400 group-hover:scale-110 transition-transform" size={18} />
            <span className="text-[11px] font-medium text-slate-300 text-center leading-tight">Say<br/>Hello</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
