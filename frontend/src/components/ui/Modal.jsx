import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // Lock body scroll when modal is open to prevent double scrollbars
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay with blur */}
      <div 
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Modal Container Card */}
      <div className="relative w-full max-w-lg bg-white rounded-[16px] border border-border shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-background">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-light transition-all outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body section */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
