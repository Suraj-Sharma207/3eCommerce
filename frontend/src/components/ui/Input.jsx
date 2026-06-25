import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ label, error, isValid, className = '', type = 'text', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  // Determine border and ring styles based on state
  let stateClasses = 'border-secondary-200 focus:ring-primary-500';
  if (error) {
    stateClasses = 'border-danger focus:ring-danger';
  } else if (isValid) {
    stateClasses = 'border-green-500 focus:ring-green-500';
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full px-4 py-3 rounded-[12px] border bg-surface
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:border-transparent
            transition-all duration-200 shadow-sm
            ${isPassword ? 'pr-12' : ''}
            ${stateClasses}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-danger mt-1">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
