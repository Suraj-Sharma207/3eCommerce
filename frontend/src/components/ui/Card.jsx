import React from 'react';

const Card = ({ children, className = '', hover = false, elevated = false, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-[20px] border border-border ${elevated ? 'shadow-md' : 'shadow-sm'} ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
