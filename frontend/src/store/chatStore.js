import { create } from 'zustand';
import axios from 'axios';

const useChatStore = create((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  conversationId: null,

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  openChat: () => set({ isOpen: true }),
  
  closeChat: () => set({ isOpen: false }),

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  sendMessage: async (text) => {
    const { conversationId, messages } = get();
    
    // Add user message immediately
    const userMessage = { id: Date.now(), role: 'user', content: text };
    set({ messages: [...messages, userMessage], isLoading: true });

    try {
      const response = await axios.post('/api/chatbot/chat', {
        message: text,
        conversation_id: conversationId,
      });

      const { response: aiResponse, conversation_id, products, sources, quick_replies, action } = response.data;

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponse,
        products: products || [],
        sources: sources || [],
        quick_replies: quick_replies || [],
        action: action || null,
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        conversationId: conversation_id,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting right now. Please try again later.',
        isError: true,
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  clearHistory: () => set({ messages: [], conversationId: null }),
}));

export default useChatStore;
