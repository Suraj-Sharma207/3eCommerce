import React from 'react';

const Card = ({ children, className = '', elevated = false, ...props }) => {
  const shadowClass = elevated ? 'shadow-soft' : 'shadow-sm';
  
  return (
    <div 
      className={`bg-white rounded-xl border border-secondary-100 ${shadowClass} overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
