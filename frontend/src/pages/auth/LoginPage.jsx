import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
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

  const handleEmailChange = (val) => {
    setEmail(val);
    setEmailError('');
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    setPasswordError('');
  };

  const handleEmailBlur = () => {
    setEmailError(sharedValidateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(sharedValidatePassword(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailValidation = sharedValidateEmail(email);
    const passwordValidation = sharedValidatePassword(password);
    
    if (emailValidation || passwordValidation) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      return;
    }
    
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
    <div className="w-full flex flex-col justify-center font-normal">
      <div className="mb-6 stagger-1 text-center shrink-0 font-normal">
        <h2 className="text-[32px] md:text-[36px] leading-tight font-bold text-text-primary tracking-tight">Welcome Back</h2>
        <p className="mt-1.5 text-[15px] text-text-muted font-medium stagger-2">
          Sign in to continue shopping.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-normal">
        {error && (
          <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-[12px] flex items-start gap-2 border border-danger-200 font-normal">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 font-normal" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1 stagger-3 font-normal">
          <Input
            label={<span className="text-[13px] text-text-primary font-normal">Email Address</span>}
            type="email"
            required
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="you@example.com"
            error={emailError}
            leftIcon={<Mail className="w-4 h-4 font-normal" />}
            inputClassName="!h-[46px] !rounded-[12px] pl-10 !border-brand-500 focus:!ring-brand-500/20"
            className={emailError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}
          />
        </div>

        <div className="space-y-1 relative stagger-3 font-normal">
          <Input
            label={<span className="text-[13px] text-text-primary font-normal">Password</span>}
            type="password"
            required
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={handlePasswordBlur}
            placeholder="Enter your password"
            error={passwordError}
            aria-invalid={!!passwordError}
            leftIcon={<Lock className="w-4 h-4 font-normal" />}
            inputClassName="!h-[46px] !rounded-[12px] pl-10 !border-brand-500 focus:!ring-brand-500/20"
            className={passwordError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}
          />
        </div>

        <div className="flex items-center justify-between pt-1 stagger-4 font-normal">
          <div className="flex items-center font-normal">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-brand-600 focus:ring-brand-600 border-border rounded transition-colors cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-[13px] text-text-secondary cursor-pointer hover:text-text-primary transition-colors font-normal">
              Remember me
            </label>
          </div>

          <div>
            <button type="button" onClick={() => setSocialMessage('Password reset functionality coming soon.')} className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        <div className="pt-2 stagger-4 font-normal">
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={!!sharedValidateEmail(email) || !!sharedValidatePassword(password)}
            aria-disabled={!!sharedValidateEmail(email) || !!sharedValidatePassword(password)}
            className="rounded-[12px] h-[48px] text-[15px] shadow-md bg-[#0F2343] hover:bg-[#1a345c] transition-all font-normal"
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="mt-5 text-center stagger-6 font-normal">
        <p className="text-[14px] text-text-secondary font-normal">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 transition-colors font-semibold">
            Sign up now
          </Link>
        </p>
      </div>

      {/* Non-blocking Toast */}
      {socialMessage && (
        <div className="fixed bottom-6 right-6 bg-secondary-900 text-white px-5 py-3 rounded-xl shadow-2xl text-[14px] z-[100] animate-in fade-in slide-in-from-bottom-8 duration-300 font-normal">
          {socialMessage}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
