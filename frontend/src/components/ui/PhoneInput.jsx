import React, { forwardRef } from'react';
import PhoneInputLib from'react-phone-number-input';
import'react-phone-number-input/style.css'; // Default styles for flags

const PhoneInput = forwardRef(({
 label,
 error,
 className ='',
 inputClassName ='',
 id,
 name,
 value,
 onChange,
 disabled,
 required,
 ...props
}, ref) => {
 // Wrap onChange to act like a standard synthetic event so we don't break existing forms
 const handleChange = (val) => {
 if (onChange) {
 onChange({
 target: {
 name: name,
 value: val ||'', // E.164 format, e.g.,'+12025550191'
 }
 });
 }
 };

 return (
 <div className={`flex flex-col gap-1.5 ${className}`}>
 {label && (
 <label className="text-sm text-text-primary" htmlFor={id}>
 {label}
 {required && <span className="text-danger-600 ml-0.5">*</span>}
 </label>
 )}
 <div className="relative">
 <PhoneInputLib
 ref={ref}
 international
 defaultCountry="IN"
 limitMaxLength={true}
 id={id}
 name={name}
 value={value}
 onChange={handleChange}
 disabled={disabled}
 className={`
 w-full h-[48px] px-4 rounded-[12px] text-base transition-all duration-200
 border bg-surface text-text-primary
 focus-within:ring-2 focus-within:ring-brand-600 focus-within:border-brand-600
 ${error ?'border-danger-600 focus-within:ring-danger-600 focus-within:border-danger-600' :'border-border'}
 ${disabled ?'bg-surface-background opacity-70 cursor-not-allowed' :''}
 ${inputClassName}
`}
 numberInputProps={{
 className:'w-full h-full bg-transparent outline-none text-text-primary placeholder:text-text-muted',
 ...props
 }}
 />
 </div>
 {error && (
 <p className="text-sm text-danger-600 mt-1" id={`${id || name}-error`} role="alert">
 {error}
 </p>
 )}
 </div>
 );
});

PhoneInput.displayName ='PhoneInput';

export default PhoneInput;
