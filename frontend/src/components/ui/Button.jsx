import React from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  disabled = false,
  className = '', 
  as,
  href,
  ...props 
}) => {
  let Component = as || 'button';
  const extraProps = {};

  if (!as && href) {
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      Component = 'a';
      extraProps.href = href;
    } else {
      Component = Link;
      extraProps.to = href;
    }
  }
  const isIcon = variant === 'icon';
  const borderRadius = isIcon ? 'rounded-[12px]' : 'rounded-[14px]';
  
  const baseStyles = `relative inline-flex items-center justify-center font-semibold ${borderRadius} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-surface-background disabled:text-text-muted disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]`;
  
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-md focus:ring-brand-600',
    secondary: 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50 shadow-sm focus:ring-brand-600',
    outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 focus:ring-brand-600',
    ghost: 'text-brand-600 hover:bg-brand-50 focus:ring-brand-600 bg-transparent',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-sm focus:ring-danger-600',
    icon: 'bg-white text-text-primary border border-border hover:bg-surface-background shadow-sm focus:ring-brand-600', 
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
      disabled={Component === 'button' ? (disabled || isLoading) : undefined}
      aria-disabled={disabled || isLoading}
      {...extraProps}
      {...props}
    >
      {/* Invisible content wrapper maintains width while loading */}
      <span className={`inline-flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      
      {/* Absolute positioned spinner */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center font-normal">
          <Loader2 className="w-5 h-5 animate-spin font-normal" />
        </span>
      )}
    </Component>
  );
};

export default Button;
