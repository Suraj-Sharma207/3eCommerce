import React from 'react';
import PageContainer from './PageContainer';
import SectionHeader from './SectionHeader';

const HomeSection = ({ 
  title, 
  subtitle, 
  actionButton, 
  hasBackground = false, 
  children,
  className = ""
}) => {
  // Using py-5 (20px), py-6 (24px), py-8 (32px)
  // Two adjacent sections will sum their padding to create 40px, 48px, 64px gaps.
  return (
    <section className={`w-full py-5 sm:py-6 lg:py-8 ${hasBackground ? 'bg-surface' : ''} ${className}`}>
      <PageContainer>
        {(title || subtitle) && (
          <SectionHeader 
            title={title} 
            subtitle={subtitle} 
            actionButton={actionButton} 
          />
        )}
        {children}
      </PageContainer>
    </section>
  );
};

export default HomeSection;
