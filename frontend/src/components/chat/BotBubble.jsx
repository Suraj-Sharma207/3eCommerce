import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, AlertCircle, Mail, Lock, 
  Eye, EyeOff, Calendar, ChevronRight, Loader2 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import ProductCardList from './ProductCardList';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { Link } from 'react-router-dom';

export const BotBubble = ({ message }) => {
  const isError = message.type === 'error';
  const [copied, setCopied] = useState(false);
  
  // Login Form States
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const authStore = useAuthStore();
  const chatStore = useChatStore();

  const [fetchedOrders, setFetchedOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (message.action === 'open_login' && authStore.isAuthenticated && !message.orders && !fetchedOrders && !loadingOrders) {
      const fetchOrdersDirectly = async () => {
        setLoadingOrders(true);
        try {
          const res = await axios.get('/api/orders');
          if (res.data && res.data.success) {
            setFetchedOrders(res.data.data || []);
          }
        } catch (err) {
          console.error("Failed to fetch user orders directly in bubble:", err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrdersDirectly();
    }
  }, [message.action, authStore.isAuthenticated, fetchedOrders, loadingOrders]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const renderFormattedText = (text) => {
    return text.split('\n\n').map((paragraph, idx) => (
      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
        {paragraph}
      </p>
    ));
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const success = await authStore.login(email, password);
      if (success) {
        setShowLoginForm(false);
      } else {
        setLoginError('Invalid email or password.');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-start gap-3 w-full animate-slide-up group">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#ECECEC] flex items-center justify-center shadow-sm mt-0.5 overflow-hidden p-1">
        <img src="/logo.jpg" alt="Priyal" className="w-full h-full object-contain" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-[85%] relative">
        <div
          className={`relative px-4 py-3 rounded-[16px] rounded-tl-[4px] text-[14px] leading-relaxed break-words whitespace-pre-wrap transition-all duration-300 ${
            isError
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-[#FDF5EF] border border-[#F0DFD0] text-[#1F2937]'
          }`}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            ...(!isError && { boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' })
          }}
        >
          {isError && (
            <div className="flex items-center gap-2 mb-1 text-rose-400 font-medium">
              <AlertCircle size={14} />
              <span>Connection Error</span>
            </div>
          )}
          <div className="tracking-wide font-normal">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} className="text-[#C97C4D] hover:text-[#B5673D] underline font-medium" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-[#0F172A]">
                    {children}
                  </strong>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>
              }}
            >
              {typeof message.text === 'string' ? message.text : String(message.text || '')}
            </ReactMarkdown>
          </div>

          {/* Guest Action: Open Login Button */}
          {message.action === 'open_login' && !showLoginForm && !authStore.isAuthenticated && (
            <button
              onClick={() => setShowLoginForm(true)}
              className="mt-3 w-full py-2 px-4 rounded-xl bg-[#C97C4D] hover:bg-[#B5673D] text-white font-medium text-xs shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Sign In to Account
            </button>
          )}

          {/* Guest Action: Inline Login Form */}
          {showLoginForm && !authStore.isAuthenticated && (
            <form onSubmit={handleLoginSubmit} className="mt-3 p-3 rounded-xl bg-[#F3F4F6] border border-[#ECECEC] flex flex-col gap-2.5 w-full animate-fade-in">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#ECECEC] rounded-lg py-1.5 pl-9 pr-3 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#C97C4D] focus:ring-1 focus:ring-[#C97C4D]/30"
                  disabled={isLoggingIn}
                  required
                />
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#ECECEC] rounded-lg py-1.5 pl-9 pr-9 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#C97C4D] focus:ring-1 focus:ring-[#C97C4D]/30"
                  disabled={isLoggingIn}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                  disabled={isLoggingIn}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {loginError && (
                <div className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle size={10} />
                  <span>{loginError}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-1.5 rounded-lg bg-[#C97C4D] hover:bg-[#B5673D] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* Loading orders state */}
          {loadingOrders && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#9CA3AF] py-2">
              <Loader2 size={12} className="animate-spin text-[#C97C4D]" />
              <span>Syncing your order history...</span>
            </div>
          )}

          {/* Authenticated Action: Order Cards */}
          {((message.orders && message.orders.length > 0) || (message.action === 'open_login' && authStore.isAuthenticated && fetchedOrders && fetchedOrders.length > 0)) && (
            <div className="mt-3 flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-[#D1D5DB] scrollbar-track-transparent snap-x snap-mandatory w-full max-w-full select-none animate-fade-in">
              {(message.orders || fetchedOrders).map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                let statusColor = 'text-[#3F79B5] bg-[#3F79B5]/10 border-[#3F79B5]/20';
                if (order.orderStatus === 'DELIVERED') {
                  statusColor = 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20';
                } else if (['SHIPPED', 'PROCESSING', 'PACKED', 'CONFIRMED'].includes(order.orderStatus)) {
                  statusColor = 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
                } else if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.orderStatus)) {
                  statusColor = 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20';
                }

                return (
                  <div key={order.id} className="flex-shrink-0 w-64 snap-start p-3.5 rounded-2xl bg-white border border-[#ECECEC] flex flex-col justify-between gap-2.5 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#0F172A]">
                          Order #{order.orderNumber.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-[#6B7280] flex items-center gap-1 font-medium">
                          <Calendar size={10} />
                          {dateStr}
                        </span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${statusColor}`}>
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-2">
                      {order.items?.map((item) => {
                        const prod = item.product || {};
                        const primaryImage = prod.images?.[0]?.url || null;
                        
                        return (
                          <div key={item.id} className="flex items-center gap-2.5">
                            {primaryImage ? (
                              <img 
                                src={primaryImage} 
                                alt={prod.name} 
                                className="w-10 h-10 object-cover rounded-lg bg-white border border-[#ECECEC]"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white border border-[#ECECEC] rounded-lg flex items-center justify-center text-[8px] text-[#9CA3AF]">
                                No Image
                              </div>
                            )}
                            <div className="flex-grow min-w-0">
                              <h5 className="text-[11px] font-bold text-[#0F172A] truncate">{prod.name}</h5>
                              <span className="text-[9px] text-[#6B7280] font-medium">
                                Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 border-t border-[#E5E7EB] pt-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-[#6B7280] font-medium">Total:</span>
                        <span className="text-[11px] font-bold text-[#0F172A]">
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <a
                        href="/profile/orders"
                        className="text-[9px] font-bold text-[#C97C4D] hover:text-[#B5673D] flex items-center gap-0.5 transition-colors"
                      >
                        <span>View Details</span>
                        <ChevronRight size={10} strokeWidth={2.5} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Structured Product Results: Horizontally Scrollable Cards */}
          {message.type === 'product_results' && message.products && (
            <div className="flex flex-col gap-2">
              <ProductCardList products={message.products} />
              {message.category && (
                <div className="mt-1 flex justify-start">
                  <Link
                    to={`/products?category=${encodeURIComponent(message.category.toLowerCase())}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C97C4D] hover:bg-[#B5673D] text-white text-[11px] font-bold shadow-sm transition-colors"
                  >
                    <span>View all {message.category} items in shop</span>
                    <ChevronRight size={12} strokeWidth={2.5} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Redirect button when no products are found but category was specified */}
          {message.type === 'product_search' && message.category && (
            <div className="mt-3 flex justify-start">
              <Link
                to={`/products?category=${encodeURIComponent(message.category.toLowerCase())}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C97C4D] hover:bg-[#B5673D] text-white text-[11px] font-bold shadow-sm transition-colors"
              >
                <span>View all {message.category} items in shop</span>
                <ChevronRight size={12} strokeWidth={2.5} />
              </Link>
            </div>
          )}
        </div>
        
        {/* Copy Button */}
        {!isError && (
          <button
            onClick={handleCopy}
            className="absolute -right-9 top-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#0F172A] cursor-pointer"
            title="Copy response"
          >
            {copied ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
          </button>
        )}
          
        <span className="text-[10px] text-[#6B7280] font-medium px-1 select-none">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default BotBubble;
