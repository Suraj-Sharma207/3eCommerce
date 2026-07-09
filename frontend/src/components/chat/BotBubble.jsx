import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, AlertCircle, Cat, Mail, Lock, 
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
        // Automatically request order status / orders
        await chatStore.sendMessage('show my orders');
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
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 p-[1px] shadow-sm mt-0.5 animate-pulse">
        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-white">
          <Cat size={18} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-w-[85%] relative">
        <div
          className={`relative px-4 py-3 rounded-[16px] rounded-tl-[4px] text-[14px] leading-relaxed break-words whitespace-pre-wrap transition-all duration-300 ${
            isError
              ? 'bg-rose-950/30 border border-rose-900/50 text-rose-200'
              : 'glass-bubble text-slate-100'
          }`}
        >
          {isError && (
            <div className="flex items-center gap-2 mb-1 text-rose-400 font-medium">
              <AlertCircle size={14} />
              <span>Connection Error</span>
            </div>
          )}
          <div className="tracking-wide font-light">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} className="text-indigo-400 hover:text-indigo-300 underline font-medium" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">
                    {children}
                  </strong>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>

          {/* Guest Action: Open Login Button */}
          {message.action === 'open_login' && !showLoginForm && !authStore.isAuthenticated && (
            <button
              onClick={() => setShowLoginForm(true)}
              className="mt-3 w-full py-2 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-medium text-xs shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Sign In to Account
            </button>
          )}

          {/* Guest Action: Inline Login Form */}
          {showLoginForm && !authStore.isAuthenticated && (
            <form onSubmit={handleLoginSubmit} className="mt-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-2.5 w-full animate-fade-in">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  disabled={isLoggingIn}
                  required
                />
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-lg py-1.5 pl-9 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  disabled={isLoggingIn}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
                className="w-full py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 disabled:cursor-not-allowed text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 size={12} className="animate-spin text-indigo-500" />
              <span>Syncing your order history...</span>
            </div>
          )}

          {/* Authenticated Action: Order Cards */}
          {((message.orders && message.orders.length > 0) || (message.action === 'open_login' && authStore.isAuthenticated && fetchedOrders && fetchedOrders.length > 0)) && (
            <div className="mt-3 flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory w-full max-w-full select-none animate-fade-in">
              {(message.orders || fetchedOrders).map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                let statusColor = 'text-indigo-400 bg-indigo-950/40 border-indigo-900/50';
                if (order.orderStatus === 'DELIVERED') {
                  statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
                } else if (['SHIPPED', 'PROCESSING', 'PACKED', 'CONFIRMED'].includes(order.orderStatus)) {
                  statusColor = 'text-amber-400 bg-amber-950/40 border-amber-900/50';
                } else if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.orderStatus)) {
                  statusColor = 'text-rose-400 bg-rose-950/40 border-rose-900/50';
                }

                return (
                  <div key={order.id} className="flex-shrink-0 w-64 snap-start p-3.5 rounded-2xl bg-slate-950/30 border border-slate-800/80 flex flex-col justify-between gap-2.5 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-100">
                          Order #{order.orderNumber.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Calendar size={10} />
                          {dateStr}
                        </span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
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
                                className="w-10 h-10 object-cover rounded-lg bg-slate-900 border border-slate-800"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-[8px] text-slate-600">
                                No Image
                              </div>
                            )}
                            <div className="flex-grow min-w-0">
                              <h5 className="text-[11px] font-medium text-slate-200 truncate">{prod.name}</h5>
                              <span className="text-[9px] text-slate-500">
                                Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/60 pt-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-slate-500">Total:</span>
                        <span className="text-[11px] font-bold text-slate-100">
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <a
                        href="/profile/orders"
                        className="text-[9px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
                      >
                        <span>View Details</span>
                        <ChevronRight size={10} />
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-md transition-colors"
                  >
                    <span>View all {message.category} items in shop</span>
                    <ChevronRight size={12} />
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-md transition-colors"
              >
                <span>View all {message.category} items in shop</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>
        
        {/* Copy Button */}
        {!isError && (
          <button
            onClick={handleCopy}
            className="absolute -right-9 top-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Copy response"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        )}
          
        <span className="text-[10px] text-slate-500 font-medium px-1 select-none">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default BotBubble;
