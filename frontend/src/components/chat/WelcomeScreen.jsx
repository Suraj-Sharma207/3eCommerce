import React from 'react';
import { Search, Package, MessageCircle, Compass, ArrowRight, RotateCcw, Lock, HeadphonesIcon } from 'lucide-react';

export const WelcomeScreen = ({ onActionClick, onStartComposing }) => {
  const handleSearchClick = (message) => {
    if (onStartComposing) {
      onStartComposing(message);
    }
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Ask me anything..."]');
      if (input) {
        input.focus();
      }
    }, 50);
  };

  const quickActions = [
    {
      icon: Search,
      title: 'Search Products',
      subtitle: 'Find furniture by style, category, or specific needs.',
      accent: true,
      onClick: () => handleSearchClick("Please type your product name below (e.g., 'I want a wooden table')."),
    },
    {
      icon: Package,
      title: 'Order Status',
      subtitle: 'Track your order or check shipping details.',
      accent: false,
      onClick: () => onActionClick('show my orders'),
    },
    {
      icon: MessageCircle,
      title: 'Ask Anything',
      subtitle: 'Get help with returns, delivery, or product info.',
      accent: false,
      onClick: () => handleSearchClick("What would you like to know about our store or products?"),
    },
    {
      icon: Compass,
      title: 'Just Say Hello',
      subtitle: 'Start a conversation with our assistant.',
      accent: false,
      onClick: () => onActionClick('hello'),
    },
  ];

  return (
    <div
      className="chat-welcome flex flex-col h-full overflow-y-auto hide-scrollbar"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* 
        Full-bleed hero background — the image covers the top portion of the 
        entire welcome screen and fades into the cream/off-white tone (#FDF8F3)
        that the content area uses, so there is NO hard edge.
      */}
      <div
        className="shrink-0 relative"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Gradient overlay that dissolves the photo into the content background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, transparent 40%, #FDF8F3 92%, #FDF8F3 100%)",
          }}
        />

        {/* Hero text content */}
        <div className="relative z-10 px-7 pt-10 pb-14 w-[70%]">
          <p className="text-[14px] text-[#C97C4D] font-semibold mb-1.5">
            Hi there! 👋
          </p>
          <h1 className="text-[24px] font-extrabold text-[#0F172A] leading-[1.2] mb-2.5 tracking-tight">
            I'm your shopping assistant
          </h1>
          <p className="text-[13px] text-[#6B7280] font-medium leading-relaxed">
            I can help you find the perfect furniture, check orders, explore collections, and answer any questions you have.
          </p>
        </div>
      </div>

      {/* Content area — sits on cream background, no hard edge from above */}
      <div className="flex-1 flex flex-col" style={{ background: "#FDF8F3" }}>

        {/* Quick Actions */}
        <div className="px-7 pb-5 flex flex-col gap-3">
          <h3 className="text-[13px] font-bold text-[#0F172A] mb-1 tracking-tight">
            How can I help you today?
          </h3>

          <div className="flex flex-col gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isSearch = action.accent;

              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`group w-full flex items-center gap-4 rounded-[18px] text-left transition-all duration-300 cursor-pointer border ${
                    isSearch
                      ? 'p-[18px] bg-white border-[#C97C4D]/25 shadow-[0_4px_20px_rgba(201,124,77,0.08)] hover:border-[#C97C4D]/45 hover:shadow-[0_6px_24px_rgba(201,124,77,0.14)]'
                      : 'p-4 bg-white border-[#ECECEC] shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:border-[#D5D5D5] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                  } hover:-translate-y-[1px]`}
                  style={{
                    animation: `slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.08 + index * 0.06}s both`
                  }}
                >
                  {/* Icon Circle */}
                  <div className={`shrink-0 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
                    isSearch
                      ? 'w-11 h-11 bg-[#C97C4D]/10'
                      : 'w-10 h-10 bg-[#F3F4F6]'
                  }`}>
                    <Icon
                      size={isSearch ? 20 : 18}
                      className={isSearch ? 'text-[#C97C4D]' : 'text-[#0F172A]'}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className={`block text-[13.5px] font-bold tracking-tight ${
                      isSearch ? 'text-[#C97C4D]' : 'text-[#0F172A]'
                    }`}>
                      {action.title}
                    </span>
                    <span className="block text-[11.5px] text-[#6B7280] mt-0.5 leading-snug font-medium">
                      {action.subtitle}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ArrowRight size={16} className={`shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                    isSearch ? 'text-[#C97C4D]' : 'text-[#9CA3AF]'
                  }`} strokeWidth={2} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider with trust text */}
        <div className="px-7 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-[10px] text-[#9CA3AF] font-medium whitespace-nowrap">
              Trusted by thousands of happy customers
            </span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="px-7 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: RotateCcw, label: '30-Day Returns', sub: 'Hassle-free returns', color: '#C97C4D' },
              { icon: Lock, label: 'Secure Shopping', sub: 'Your data is safe', color: '#C97C4D' },
              { icon: HeadphonesIcon, label: '24/7 Support', sub: "We're here to help", color: '#C97C4D' },
            ].map((badge, i) => {
              const BadgeIcon = badge.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-[#FDF5EF] flex items-center justify-center">
                    <BadgeIcon size={14} className="text-[#C97C4D]" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-bold text-[#0F172A] leading-tight">{badge.label}</span>
                  <span className="text-[9.5px] text-[#9CA3AF] font-medium leading-tight">{badge.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer branding */}
        <div className="px-7 py-3 border-t border-[#E5E7EB]">
          <p className="text-[10px] text-[#9CA3AF] text-center font-medium tracking-wide">
            Priyal Furniture • Premium Quality • Timeless Design
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
