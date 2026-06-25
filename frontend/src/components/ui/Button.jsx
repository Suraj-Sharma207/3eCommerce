import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  disabled = false,
  className = '', 
  as: Component = 'button',
  ...props 
}) => {
  const isIcon = variant === 'icon';
  const borderRadius = isIcon ? 'rounded-[12px]' : 'rounded-[14px]';
  
  const baseStyles = `relative inline-flex items-center justify-center font-semibold ${borderRadius} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`;
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500',
    secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 shadow-sm focus:ring-neutral-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500',
    icon: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 shadow-sm focus:ring-neutral-500', 
  };

  const sizes = {
    sm: 'h-[40px] px-4 text-sm',
    md: 'h-[48px] px-6 text-base',
    lg: 'h-[56px] px-8 text-lg',
    iconSm: 'h-[40px] w-[40px]',
    iconMd: 'h-[48px] w-[48px]',
    iconLg: 'h-[56px] w-[56px]',
  };

  const finalSize = isIcon ? (size === 'sm' ? 'iconSm' : size === 'lg' ? 'iconLg' : 'iconMd') : size;

  return (
    <Component 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[finalSize] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Invisible content wrapper maintains width while loading */}
      <span className={`inline-flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      
      {/* Absolute positioned spinner */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </span>
      )}
    </Component>
  );
};

export default Button;
