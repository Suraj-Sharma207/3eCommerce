import React from 'react';
import { Maximize2, Minimize2, Minus, Plus } from 'lucide-react';

export const ChatHeader = ({
  onMinimize,
  onClear,
  canClear,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className={`chat-header relative z-20 shrink-0 h-[72px] px-5 flex items-center justify-between select-none bg-white border-b border-[#ECECEC] ${isFullscreen ? 'rounded-none' : 'rounded-none sm:rounded-t-[28px]'}`}>
      <div className="flex items-center gap-3">
        {/* Bot Avatar */}
        <div className="relative w-11 h-11 rounded-full bg-white border-2 border-[#ECECEC] flex items-center justify-center shadow-sm overflow-hidden p-1.5">
          <img src="/logo.jpg" alt="Priyal" className="w-full h-full object-contain" />
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Priyal</h2>
          <p className="text-[11px] text-[#6B7280] font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
            Online
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        {/* New Chat */}
        <button
          onClick={onClear}
          disabled={!canClear}
          className="p-2.5 rounded-xl text-[#6B7280] hover:text-[#0F172A] hover:bg-[#F3F4F6] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
          title="New chat"
        >
          <Plus size={18} strokeWidth={2} />
        </button>

        {/* Toggle Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-xl text-[#6B7280] hover:text-[#0F172A] hover:bg-[#F3F4F6] transition-all cursor-pointer hidden sm:block"
          title={isFullscreen ? "Exit fullscreen" : "Make fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
        </button>

        {/* Minimize */}
        <button
          onClick={onMinimize}
          className="p-2.5 rounded-xl text-[#6B7280] hover:text-[#0F172A] hover:bg-[#F3F4F6] transition-all cursor-pointer"
          title="Minimize chat"
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
