import React from "react";

export const TypingIndicator = () => {
  return (
    <div
      className="flex items-start gap-3 w-full animate-slide-up group"
      data-testid="typing-indicator"
    >
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center shadow-sm mt-0.5 overflow-hidden p-1">
        <img
          src="/logo.jpg"
          alt="Priyal"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex flex-col gap-1 max-w-[85%]">
        <div className="px-4 py-4 rounded-[16px] rounded-tl-[4px] bg-white border border-[#ECECEC] flex items-center gap-1.5 shadow-sm min-w-[60px] h-[45px] justify-center">
          <span
            className="w-1.5 h-1.5 rounded-full typing-dot"
            style={{ animationDelay: "0ms" }}
          ></span>
          <span
            className="w-1.5 h-1.5 rounded-full typing-dot"
            style={{ animationDelay: "150ms" }}
          ></span>
          <span
            className="w-1.5 h-1.5 rounded-full typing-dot"
            style={{ animationDelay: "300ms" }}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
