import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';

const AuthTransition = () => {
  const location = useLocation();
  const currentOutlet = useOutlet();
  
  const [displayLocation, setDisplayLocation] = useState(location);
  const lastOutletRef = useRef(currentOutlet);

  const actuallyExiting = location.pathname !== displayLocation.pathname;

  if (!actuallyExiting) {
    lastOutletRef.current = currentOutlet;
  }

  useEffect(() => {
    if (actuallyExiting) {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        
        setTimeout(() => {
          const firstInput = document.querySelector('main input:not([disabled])');
          if (firstInput) {
            firstInput.focus({ preventScroll: true });
          }
        }, 350);
      }, 250);
      
      return () => clearTimeout(timer);
    }
  }, [actuallyExiting, location]);

  return (
    <div 
      className={`w-full h-full ${
        actuallyExiting 
          ? 'transition-all duration-[250ms] ease-in-out opacity-0 -translate-x-4 scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100' 
          : 'opacity-100 translate-x-0 scale-100'
      }`}
    >
      {actuallyExiting ? lastOutletRef.current : currentOutlet}
    </div>
  );
};

export default AuthTransition;
