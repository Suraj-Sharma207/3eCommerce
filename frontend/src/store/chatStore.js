import { create } from "zustand";
import api from "../services/api";
import useAuthStore from "./authStore";

const now = Date.now();

export const useChatStore = create((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  conversationId: null,

  // Initial Conversation State
  conversationStatus: "NEW",
  greetingCount: 0,
  lastGreeting: null,
  lastDetectedIntent: null,
  lastHandler: null,
  pendingState: null,

  // Timestamps
  lastUserMessageAt: 0,
  lastBotMessageAt: 0,
  lastInteractionAt: now,
  sessionStartedAt: now,
  conversationStartedAt: null,

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  addBotMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sender: "bot",
          text,
          timestamp: new Date().toISOString(),
          type: "default",
        },
      ],
    })),

  sendMessage: async (text) => {
    const currentTime = Date.now();
    const currentState = get();

    // Ensure auth state is checked and loaded (guards against hydration/timing issues)
    if (!useAuthStore.getState().hasCheckedAuth) {
      await useAuthStore.getState().checkAuth();
    }

    const authState = useAuthStore.getState();
    const isAuthenticated = authState.isAuthenticated;
    const userId = authState.user?.id || null;

    // Evaluate IDLE status based on lastInteractionAt
    let statusToSend = currentState.conversationStatus;
    if (
      statusToSend === "ACTIVE" &&
      currentState.lastInteractionAt > 0 &&
      currentTime - currentState.lastInteractionAt > 10 * 60 * 1000
    ) {
      statusToSend = "IDLE";
    }

    // Determine conversation start time
    const conversationStartedAt =
      currentState.conversationStartedAt || currentTime;

    // 1. Create and append User Message
    const userMsg = {
      id: `user-${currentTime}-${Math.random().toString(36).substring(2, 9)}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    // Prepare context history
    const history = currentState.messages.slice(-50).map((msg) => ({
      role: msg.sender === "bot" ? "assistant" : "user",
      content: msg.text,
    }));

    const messageCount = currentState.messages.length;
    const conversationStarted = messageCount > 0;

    // Construct metadata for backend
    const metadata = {
      conversationStarted,
      conversationStatus: statusToSend,
      greetingCount: currentState.greetingCount,
      messageCount,
      lastGreeting: currentState.lastGreeting,
      lastDetectedIntent: currentState.lastDetectedIntent,
      lastHandler: currentState.lastHandler,
      lastUserMessageAt: currentTime,
      lastBotMessageAt: currentState.lastBotMessageAt,
      lastInteractionAt: currentTime,
      sessionStartedAt: currentState.sessionStartedAt,
      conversationStartedAt: conversationStartedAt,
      isAuthenticated,
      userId,
      pendingState: currentState.pendingState,
    };

    // Optimistically update store
    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
      conversationStartedAt,
      lastUserMessageAt: currentTime,
      lastInteractionAt: currentTime,
    }));

    try {
      // 2. Call Node.js Express backend proxy /api/chatbot/chat
      const response = await api.post("/chatbot/chat", {
        message: text,
        conversation_id: currentState.conversationId,
        history,
        metadata,
      });

      const responseTime = Date.now();
      const {
        reply,
        type,
        conversation_id,
        action,
        orders,
        pending_state,
        products,
      } = response.data;

      const isGreeting = type === "greeting";

      // 3. Create and append Bot Message
      const botMsg = {
        id: `bot-${responseTime}-${Math.random().toString(36).substring(2, 9)}`,
        sender: "bot",
        text: reply,
        timestamp: new Date().toISOString(),
        type: type,
        action,
        orders,
        products,
      };

      set((state) => {
        const nextStatus =
          state.conversationStatus === "NEW" && isGreeting
            ? "ACTIVE"
            : state.conversationStatus;

        return {
          messages: [...state.messages, botMsg],
          isLoading: false,
          conversationId: conversation_id || state.conversationId,
          conversationStatus: nextStatus,
          greetingCount: isGreeting
            ? state.greetingCount + 1
            : state.greetingCount,
          lastGreeting: isGreeting ? text : state.lastGreeting,
          lastBotMessageAt: responseTime,
          lastInteractionAt: responseTime,
          lastHandler: type,
          pendingState: pending_state || null,
        };
      });
    } catch (err) {
      console.error("API Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Could not connect to the backend server.";

      set({
        isLoading: false,
        error: errorMessage,
      });

      const errorBotMsg = {
        id: `error-${Date.now()}`,
        sender: "bot",
        text: "Sorry, I couldn't process your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        type: "error",
      };

      set((state) => ({
        messages: [...state.messages, errorBotMsg],
      }));
    }
  },

  clearMessages: () => {
    const t = Date.now();
    set({
      messages: [],
      error: null,
      isLoading: false,
      conversationId: null,
      conversationStatus: "NEW",
      greetingCount: 0,
      lastGreeting: null,
      lastDetectedIntent: null,
      lastHandler: null,
      pendingState: null,
      lastUserMessageAt: 0,
      lastBotMessageAt: 0,
      lastInteractionAt: t,
      sessionStartedAt: t,
      conversationStartedAt: null,
    });
  },
}));

export default useChatStore;
