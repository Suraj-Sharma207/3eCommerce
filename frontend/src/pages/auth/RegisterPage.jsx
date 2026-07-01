import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import useAuthStore from '../../store/authStore';
import { useBrandingStore } from '../../store/brandingStore';
import { validateName, validateEmail, validatePhone, validatePassword, validateConfirmPassword, isFormValid as checkFormValid } from '../../utils/validators';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [socialMessage, setSocialMessage] = useState('');

  const { register, isLoading, error: backendError, clearError } = useAuthStore();
  const { branding } = useBrandingStore();

  useEffect(() => {
    clearError();
  }, [clearError]);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let errorMsg = '';

    switch (name) {
      case 'name':
        errorMsg = validateName(value, 'Full Name');
        break;
      case 'email':
        errorMsg = validateEmail(value);
        break;
      case 'phone':
        if (value) {
          errorMsg = validatePhone(value);
        }
        break;
      case 'password':
        errorMsg = validatePassword(value);
        break;
      case 'confirmPassword':
        errorMsg = validateConfirmPassword(formData.password, value);
        break;
      default:
        break;
    }

    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // We no longer sanitize phone numbers because PhoneInput provides an E.164 string (+123...)
    const parsedValue = value;

    setFormData(prev => ({ ...prev, [name]: parsedValue }));

    const errorMsg = validateField(name, parsedValue);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
    
    // Re-validate confirm password if password changes
    if (name === 'password' && formData.confirmPassword) {
       setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(sanitizedValue, formData.confirmPassword) }));
    }
  };

  const isPasswordValid = formData.password.length > 0 && validatePassword(formData.password) === '';
  const passwordTouched = formData.password.length > 0;

  const confirmTouched = formData.confirmPassword.length > 0;
  const passwordsMatch = formData.confirmPassword.length > 0 && validateConfirmPassword(formData.password, formData.confirmPassword) === '';

  const isFormValid = () => {
    const newErrors = {};

    ['name', 'email', 'phone', 'password', 'confirmPassword'].forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (!termsAccepted) {
      newErrors.terms = 'Please accept the terms and conditions.';
    }

    setErrors(newErrors);
    
    return checkFormValid(newErrors, { 
      name: formData.name, 
      email: formData.email, 
      password: formData.password, 
      confirmPassword: formData.confirmPassword 
    }) && termsAccepted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setSocialMessage('');
    const success = await register(formData.name, formData.email, formData.password, formData.phone);
    if (success) {
      navigate('/');
    }
  };

  const handleSocialClick = (e, provider) => {
    e.preventDefault();
    e.stopPropagation();
    setSocialMessage(`${provider} Sign-In coming soon.`);
    setTimeout(() => setSocialMessage(''), 3000);
  };

  // Determine password field styling and messages
  let passwordBorderClass = '';
  let PasswordHelper = () => (
    <div className="text-[12px] text-gray-500 mt-[6px] mb-[10px] min-h-[36px] flex items-start leading-snug transition-colors duration-300">
      Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.
    </div>
  );

  if (passwordTouched) {
    if (isPasswordValid) {
      passwordBorderClass = '!border-success-500 focus:!ring-success-200';
      PasswordHelper = () => (
        <div className="text-sm text-success-600 mt-[6px] mb-[10px] min-h-[36px] flex items-center gap-1.5 transition-colors duration-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Password looks good.</span>
        </div>
      );
    } else {
      passwordBorderClass = '!border-danger-500 focus:!ring-danger-200';
      PasswordHelper = () => (
        <div className="text-sm text-danger-600 mt-[6px] mb-[10px] min-h-[36px] flex items-start gap-1.5 leading-snug transition-colors duration-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.</span>
        </div>
      );
    }
  }

  // Determine confirm password styling
  let confirmBorderClass = '';
  let ConfirmHelper = () => <div className="min-h-[20px] mt-[6px]" />; // Spacer

  if (confirmTouched) {
    if (passwordsMatch) {
      confirmBorderClass = '!border-success-500 focus:!ring-success-200';
      ConfirmHelper = () => (
        <div className="text-sm text-success-600 mt-[6px] min-h-[20px] flex items-center gap-1.5 transition-colors duration-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Passwords match.</span>
        </div>
      );
    } else {
      confirmBorderClass = '!border-danger-500 focus:!ring-danger-200';
      ConfirmHelper = () => (
        <div className="text-sm text-danger-600 mt-[6px] min-h-[20px] flex items-center gap-1.5 transition-colors duration-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Passwords do not match.</span>
        </div>
      );
    }
  }

  return (
    <div className="w-full flex flex-col justify-center py-2">
      <div className="mb-6 stagger-1">
        <h2 className="text-[48px] leading-tight font-bold text-text-primary tracking-tight">Create Account</h2>
        <p className="mt-1 text-[16px] text-text-muted font-medium stagger-2">
          Join {branding?.platformName || 'Store'} to experience premium shopping.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {backendError && (
          <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-[12px] font-medium flex items-start gap-2 border border-danger-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{backendError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-3">
          <div className="space-y-1">
            <Input
              label={<span className="font-medium text-[14px] text-text-primary">Full Name</span>}
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              error={errors.name}
              className={errors.name ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}
            />
          </div>

          <div className="space-y-1">
            <PhoneInput
              label={<span className="font-medium text-[14px] text-text-primary">Phone <span className="text-text-muted font-normal text-[12px]">(Optional)</span></span>}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
            />
          </div>
        </div>

        <div className="space-y-1 stagger-3">
          <Input
            label={<span className="font-medium text-[14px] text-text-primary">Email Address</span>}
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            className={errors.email ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200' : ''}
          />
        </div>

        <div className="relative stagger-3">
          <Input
            label={<span className="font-medium text-[14px] text-text-primary">Password</span>}
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            className={passwordBorderClass}
            aria-invalid={!isPasswordValid && passwordTouched}
          />
          <PasswordHelper />
        </div>

        <div className="relative stagger-3">
          <Input
            label={<span className="font-medium text-[14px] text-text-primary">Confirm Password</span>}
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className={confirmBorderClass}
            aria-invalid={!passwordsMatch && confirmTouched}
          />
          <ConfirmHelper />
        </div>

        <div className="flex items-start pt-1 stagger-4">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (e.target.checked) setErrors(prev => ({ ...prev, terms: '' }));
              }}
              className="h-4 w-4 text-brand-600 focus:ring-brand-600 border-border rounded transition-colors cursor-pointer"
            />
          </div>
          <div className="ml-2 text-[12px] mt-[2px]">
            <label htmlFor="terms" className={`cursor-pointer font-medium ${errors.terms ? 'text-danger-600' : 'text-text-secondary'}`}>
              I agree to the <a href="#" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Terms of Service</a> and <a href="#" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Privacy Policy.</a>
            </label>
            {errors.terms && <p className="mt-0.5 text-danger-600 font-medium">{errors.terms}</p>}
          </div>
        </div>

        <div className="pt-2 stagger-4">
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={!checkFormValid(errors, { name: formData.name, email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword }) || !termsAccepted}
            aria-disabled={!checkFormValid(errors, { name: formData.name, email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword }) || !termsAccepted}
            className="rounded-[12px] h-[48px] text-[16px] font-bold shadow-sm"
          >
            Create Account
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
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">
            Sign in
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

export default RegisterPage;
