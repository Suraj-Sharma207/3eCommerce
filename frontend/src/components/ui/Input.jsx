import React, { forwardRef, useState } from'react';
import { Eye, EyeOff } from'lucide-react';

const Input = forwardRef(({ 
 label, 
 error, 
 isValid, 
 className ='', 
 inputClassName ='', 
 type ='text', 
 disabled, 
 id, 
 icon,
 helperText,
 leftIcon,
 rightIcon,
 description,
 loading,
 variant,
 fullWidth,
 ...props 
}, ref) => {
 const [showPassword, setShowPassword] = useState(false);
 const isPassword = type ==='password';
 const inputType = isPassword ? (showPassword ?'text' :'password') : type;

 return (
 <div className={`flex flex-col gap-1.5 ${className}`}>
 {label && (
 <label className="text-sm text-text-primary" htmlFor={id}>
 {label}
 {props.required && <span className="text-danger-600 ml-0.5">*</span>}
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
 ${error ?'border-danger-600 focus:ring-danger-600 focus:border-danger-600' :''}
 ${icon || leftIcon ?'pl-11' :''}
 ${isPassword || rightIcon ?'pr-12' :''}
 ${inputClassName}
`}
 aria-invalid={!!error}
 aria-describedby={error ?`${id ||'input'}-error` : undefined}
 onCopy={isPassword ? (e) => e.preventDefault() : props.onCopy}
 onPaste={isPassword ? (e) => e.preventDefault() : props.onPaste}
 onCut={isPassword ? (e) => e.preventDefault() : props.onCut}
 {...props}
 />
 {(icon || leftIcon) && (
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">
 {icon || leftIcon}
 </div>
 )}
 {(isPassword || rightIcon) && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">
 {isPassword ? (
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="hover:text-text-secondary focus:outline-none"
 >
 {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
 </button>
 ) : rightIcon}
 </div>
 )}
 </div>
 {helperText && !error && (
 <p className="text-xs text-gray-500 mt-1">{helperText}</p>
 )}
 {description && !helperText && !error && (
 <p className="text-xs text-gray-500 mt-1">{description}</p>
 )}
 {error && (
 <span id={`${id ||'input'}-error`} className="text-xs text-danger-600 mt-1">{error}</span>
 )}
 </div>
 );
});

Input.displayName ='Input';

export default Input;
