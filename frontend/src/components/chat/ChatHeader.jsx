import React from 'react';
import { Minus, RotateCcw, Maximize2, Minimize2, Cat } from 'lucide-react';

export const ChatHeader = ({
  onMinimize,
  onClear,
  canClear,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className={`relative z-20 shrink-0 h-[72px] px-5 flex items-center justify-between select-none bg-slate-950 border-b border-brand-500/10 shadow-sm ${isFullscreen ? 'rounded-none' : 'rounded-none sm:rounded-t-[24px]'}`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 p-[1px] shadow-lg shadow-brand-900/30">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-white">
            <Cat size={20} />
          </div>
          {/* Status Dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-[2px] border-slate-950"></span>
        </div>
        
        <div className="flex flex-col justify-center">
          <h2 className="text-[14px] font-semibold text-slate-100 tracking-wide">AI Assistant</h2>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80"></span>
            Online
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-0.5">
        {/* Clear chat history */}
        <button
          onClick={onClear}
          disabled={!canClear}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
          title="Reset conversation"
        >
          <RotateCcw size={16} strokeWidth={2} />
        </button>

        {/* Toggle Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer hidden sm:block"
          title={isFullscreen ? "Exit fullscreen" : "Make fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
        </button>
        
        {/* Minimize widget */}
        <button
          onClick={onMinimize}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
          title="Minimize chat"
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
