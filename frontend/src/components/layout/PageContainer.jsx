import React from 'react';

const PageContainer = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`max-w-[1440px] mx-auto w-full ${noPadding ? '' : 'px-4 sm:px-6 lg:px-12'} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
