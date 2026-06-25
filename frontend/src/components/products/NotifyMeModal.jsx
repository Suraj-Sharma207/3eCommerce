import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../ui/Button';

const NotifyMeModal = ({ isOpen, onClose, productId, productName, onSuccess }) => {
  const { user } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (user?.email) setEmail(user.email);
      if (user?.phone) setPhone(user.phone);
      setSuccess(false);
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { default: api } = await import('../../services/api');
      await api.post(`/products/${productId}/notify`, { email, phone });
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-xl animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-secondary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Notify Me</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-text-primary mb-2">Request Received!</h4>
              <p className="text-text-secondary mb-6">
                We'll email you as soon as <span className="font-semibold text-text-primary">{productName}</span> is back in stock.
              </p>
              <Button 
                onClick={onClose}
                fullWidth
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-text-secondary mb-6">
                <span className="font-semibold text-text-primary">{productName}</span> is currently out of stock. Leave your details below and we'll notify you when it's available.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-danger-light text-danger-dark text-sm rounded-lg border border-danger-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-surface"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-surface"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="mt-8">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!email}
                  fullWidth
                >
                  Notify Me When Available
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotifyMeModal;
