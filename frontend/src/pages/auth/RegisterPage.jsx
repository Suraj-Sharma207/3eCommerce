import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';
import { Check } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    const success = await register(name, email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-80px)]">
      {/* Left side - Image */}
      <div className="hidden lg:block relative w-1/2 xl:w-7/12 overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] hover:scale-105"
          src="/images/auth/auth-bg.jpg"
          alt="Premium Furniture"
        />
        <div className="absolute inset-0 bg-secondary-900/10 mix-blend-multiply" />
        
        {/* Value Prop Overlay */}
        <div className="absolute bottom-0 left-0 p-16 text-white max-w-lg">
          <h3 className="text-3xl font-extrabold mb-4">Join LuxeHome today</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-medium">Early access to new collections</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-medium">Save your favorite items</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-medium">Faster checkout experience</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 bg-surface">
        <div className="w-full max-w-md mx-auto">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-text-primary">Create Account</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Join LuxeHome to experience premium furniture shopping.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-4 rounded-lg bg-danger-light text-danger-dark text-sm font-medium">
                  {error}
                </div>
              )}

              {passwordError && (
                <div className="p-4 rounded-lg bg-danger-light text-danger-dark text-sm font-medium">
                  {passwordError}
                </div>
              )}

              <Input
                label="Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />

              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />

              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-text-secondary">
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-primary-600 hover:text-primary-500">
                    Terms & Conditions
                  </a>
                </label>
              </div>

              <div>
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            <div className="mt-8 flex justify-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
