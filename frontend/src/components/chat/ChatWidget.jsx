import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useChatStore from "../../store/chatStore";
import ChatHeader from "./ChatHeader";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import ChatLauncher from "./ChatLauncher";

/* Animation variants — panel grows out of the bottom-right corner (where the icon sits) */
const panelVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.34, 1.56, 0.64, 1], // gentle overshoot "pop"
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 10,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1], // fast ease-in for close
    },
  },
};

export const ChatWidget = () => {
  const {
    isOpen,
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    toggleChat,
    closeChat,
  } = useChatStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const location = useLocation();
  const widgetRef = useRef(null);

  // Click outside to close chat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        !isFullscreen &&
        widgetRef.current &&
        !widgetRef.current.contains(event.target)
      ) {
        // Prevent closing if we clicked the launcher button itself
        const launcher = document.querySelector(
          '[aria-label="Toggle chat assistant"]',
        );
        if (launcher && launcher.contains(event.target)) {
          return;
        }
        closeChat();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isFullscreen, closeChat]);

  // Lock body scroll when chat is open to prevent page scrolling in background
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsComposing(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset fullscreen when minimized or closed
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Close chat on page navigation
  useEffect(() => {
    if (isOpen) {
      closeChat();
    }
  }, [location.pathname]);

  const handleMinimize = () => {
    closeChat();
    setIsFullscreen(false);
    setIsComposing(false);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleSendMessage = (text) => {
    sendMessage(text);
    setIsComposing(false);
  };

  // Don't render chat widget in admin portal
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            ref={widgetRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "bottom right" }}
            className={`fixed z-[9999] chat-panel-premium flex flex-col ${
              isFullscreen
                ? "top-0 left-0 right-0 bottom-0 w-full h-full rounded-none"
                : "top-0 left-0 right-0 bottom-0 w-full h-full rounded-none sm:top-auto sm:left-auto chat-panel-desktop-size sm:max-w-[calc(100vw-32px)] sm:rounded-[28px]"
            } overflow-hidden bg-white`}
          >
            <ChatHeader
              onMinimize={handleMinimize}
              onClear={clearMessages}
              canClear={messages.length > 0}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />

            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onSelectSuggestion={handleSendMessage}
              isComposing={isComposing}
              onStartComposing={(initialMessage) => {
                setIsComposing(true);
                if (initialMessage) {
                  useChatStore.getState().addBotMessage(initialMessage);
                }
              }}
            />

            {(messages.length > 0 || isComposing) && (
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher button — always visible in its fixed position */}
      {!isFullscreen && <ChatLauncher isOpen={isOpen} onClick={toggleChat} />}
    </>
  );
};

export default ChatWidget;
