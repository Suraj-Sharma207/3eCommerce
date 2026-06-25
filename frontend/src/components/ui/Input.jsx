import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ label, error, isValid, className = '', inputClassName = '', type = 'text', disabled, id, icon, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-text-primary" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={inputType}
          disabled={disabled}
          className={`
            w-full h-[48px] px-4 rounded-[12px] text-base transition-all duration-200
            border border-border bg-surface text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600
            disabled:bg-surface-background disabled:text-text-muted disabled:cursor-not-allowed
            ${error ? 'border-danger-600 focus:ring-danger-600 focus:border-danger-600' : ''}
            ${icon ? 'pl-11' : ''}
            ${isPassword ? 'pr-12' : ''}
            ${inputClassName}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-danger-600 mt-1">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
