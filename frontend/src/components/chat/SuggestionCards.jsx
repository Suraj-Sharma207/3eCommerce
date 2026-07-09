import React from 'react';
import { Search, Command, MessageSquare, Coffee } from 'lucide-react';

export const SuggestionCards = ({ onActionClick }) => {
  const actions = [
    { label: 'Say Hello', value: 'Hello', icon: <MessageSquare size={16} /> },
    { label: 'Search Products', value: 'Search Products', icon: <Search size={16} /> },
    { label: 'Order Status', value: 'Order Status', icon: <Coffee size={16} /> },
    { label: 'Ask Anything', value: 'Ask Anything', icon: <Command size={16} /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
      {actions.map((act, i) => (
        <button
          key={i}
          onClick={() => onActionClick(act.value)}
          className="glass-card flex items-center gap-3 p-3.5 rounded-2xl text-left cursor-pointer group text-slate-300 hover:text-white"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/10 transition-colors">
            {act.icon}
          </div>
          <span className="text-[13px] font-medium tracking-wide">{act.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SuggestionCards;
