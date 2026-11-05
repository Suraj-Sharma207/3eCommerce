import React from "react";

export const UserBubble = ({ message }) => {
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex items-start justify-end gap-3 w-full animate-slide-up group">
      <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
        <div className="px-4 py-3 rounded-[16px] rounded-tr-[4px] text-[14px] leading-relaxed break-words whitespace-pre-wrap bg-[#0F172A] text-white shadow-sm font-medium tracking-wide">
          {message.text}
        </div>
        <span className="text-[10px] text-[#9CA3AF] font-medium px-1 select-none">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default UserBubble;
