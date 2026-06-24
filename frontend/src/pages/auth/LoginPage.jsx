import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-80px)]">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 bg-surface">
        <div className="w-full max-w-md mx-auto">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-text-primary">Welcome Back</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to your account
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div className="p-4 rounded-lg bg-danger-light text-danger-dark text-sm font-medium">
                    {error}
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />

                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <div className="flex justify-end">
                    <a href="#" className="text-sm font-semibold text-primary-600 hover:text-primary-500">
                      Forgot password?
                    </a>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
              </form>

              <div className="mt-8 flex justify-center">
                <p className="text-sm text-text-secondary">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-1/2 xl:w-7/12 overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] hover:scale-105"
          src="/images/auth/auth-bg.jpg"
          alt="Premium Furniture"
        />
        <div className="absolute inset-0 bg-secondary-900/10 mix-blend-multiply" />
      </div>
    </div>
  );
};

export default LoginPage;
