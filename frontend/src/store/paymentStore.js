import { create } from 'zustand';
import api from '../services/api';

const usePaymentStore = create((set) => ({
  paymentStatus: 'PENDING',
  isLoading: false,
  error: null,

  processPayment: async (orderId, paymentDetails) => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, this would integrate with Razorpay or Stripe
      // For now, we mock the API call that would happen after a successful gateway callback
      // This endpoint doesn't exist yet but prepares the architecture.
      // const response = await api.post(`/payment/process`, { orderId, ...paymentDetails });
      
      // Mock successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Inform the backend (we have an admin route for this, or a specific user route could be made)
      // await api.put(`/orders/${orderId}/payment`, { status: 'PAID' });

      set({ paymentStatus: 'PAID', isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Payment processing failed', paymentStatus: 'FAILED', isLoading: false });
      return false;
    }
  },

  resetPaymentStatus: () => set({ paymentStatus: 'PENDING', error: null })
}));

export default usePaymentStore;
