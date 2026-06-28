import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';

import { validateEmail as sharedValidateEmail, validatePassword as sharedValidatePassword, isFormValid } from '../../utils/validators';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [socialMessage, setSocialMessage] = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const validateEmail = (val) => {
    setEmail(val);
    setEmailError(sharedValidateEmail(val));
  };

  const validatePassword = (val) => {
    setPassword(val);
    setPasswordError(sharedValidatePassword(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid({ email: emailError, password: passwordError }, { email, password })) return;
    setSocialMessage('');
    const success = await login(email, password);
    if (success) {
      const { user } = useAuthStore.getState();
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        if (from.startsWith('/admin')) {
          navigate('/', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    }
  };

  const handleSocialClick = (e, provider) => {
    e.preventDefault();
    e.stopPropagation();
    setSocialMessage(`${provider} Sign-In coming soon.`);
    setTimeout(() => setSocialMessage(''), 3000);
  };

  return (
    <div className="w-full flex flex-col justify-center py-4">
      <div className="mb-6 stagger-1">
        <h2 className="text-[48px] leading-tight font-bold text-text-primary tracking-tight">Welcome Back</h2>
        <p className="mt-1 text-[16px] text-text-muted stagger-2">
          Sign in to your account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-[12px] font-medium flex items-start gap-2 border border-danger-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1 stagger-3">
          <Input
            label={<span className="font-medium text-[14px] text-text-primary">Email Address</span>}
            type="email"
            required
            value={email}
            onChange={(e) => validateEmail(e.target.value)}
            placeholder="you@example.com"
            error={emailError}
            className={emailError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}
          />
        </div>

        <div className="space-y-1 relative stagger-3">
          <Input
            label={<span className="font-medium text-[14px] text-text-primary">Password</span>}
            type="password"
            required
            value={password}
            onChange={(e) => validatePassword(e.target.value)}
            placeholder="Enter your password"
            error={passwordError}
            aria-invalid={!!passwordError}
            className={passwordError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}
          />
        </div>

        <div className="flex items-center justify-between pt-1 stagger-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-brand-600 focus:ring-brand-600 border-border rounded transition-colors cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-[14px] font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
              Remember me
            </label>
          </div>

          <div>
            <button type="button" onClick={() => setSocialMessage('Password reset functionality coming soon.')} className="text-[14px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        <div className="pt-2 stagger-4">
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={!isFormValid({ email: emailError, password: passwordError }, { email, password })}
            aria-disabled={!isFormValid({ email: emailError, password: passwordError }, { email, password })}
            className="rounded-[12px] h-[48px] text-[16px] font-bold shadow-sm"
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="mt-6 stagger-5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-light" />
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="px-3 bg-white text-text-muted font-medium">Or continue with</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={(e) => handleSocialClick(e, 'Google')}
            className="w-full flex items-center justify-center gap-2 h-[44px] border border-border rounded-[12px] bg-white hover:bg-surface-background transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 group relative"
            title="Coming Soon"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-[18px] h-[18px]" />
            <span className="text-[14px] font-semibold text-text-primary">Google</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSocialClick(e, 'Apple')}
            className="w-full flex items-center justify-center gap-2 h-[44px] border border-border rounded-[12px] bg-white hover:bg-surface-background transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 group relative"
            title="Coming Soon"
          >
            <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-[18px] h-[18px] opacity-90" />
            <span className="text-[14px] font-semibold text-text-primary">Apple</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSocialClick(e, 'Facebook')}
            className="w-full flex items-center justify-center gap-2 h-[44px] border border-border rounded-[12px] bg-white hover:bg-surface-background transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 group relative"
            title="Coming Soon"
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-[18px] h-[18px]" />
            <span className="text-[14px] font-semibold text-text-primary">Facebook</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center stagger-6">
        <p className="text-[14px] text-text-secondary font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
            Sign up now
          </Link>
        </p>
      </div>

      {/* Non-blocking Toast */}
      {socialMessage && (
        <div className="fixed bottom-6 right-6 bg-secondary-900 text-white px-5 py-3 rounded-xl shadow-2xl text-[14px] font-medium z-[100] animate-in fade-in slide-in-from-bottom-8 duration-300">
          {socialMessage}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
