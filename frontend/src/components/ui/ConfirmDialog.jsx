import React, { useEffect, useRef } from 'react';
import useConfirmStore from '../../store/confirmStore';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ConfirmDialog = () => {
  const { isOpen, config, onConfirm, onCancel } = useConfirmStore();
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const { isAlert } = config || {};
      // Focus trap / auto focus on mount
      setTimeout(() => {
        if (isAlert && confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        } else if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 50);
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onCancel();
        }
        if (e.key === 'Tab') {
          // simple trap
          const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean);
          if (focusable.length > 1) {
            if (document.activeElement === focusable[0] && e.shiftKey) {
              e.preventDefault();
              focusable[1].focus();
            } else if (document.activeElement === focusable[1] && !e.shiftKey) {
              e.preventDefault();
              focusable[0].focus();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel, config]);

  if (!isOpen) return null;

  const { title, description, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', isAlert = false } = config || {};

  const getIcon = () => {
    switch(variant) {
      case 'danger': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-amber-600" />;
      default: return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch(variant) {
      case 'danger': return 'bg-red-100';
      case 'warning': return 'bg-amber-100';
      default: return 'bg-blue-100';
    }
  };

  const getButtonClass = () => {
    switch(variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white';
      default: return 'bg-[#1B2340] hover:bg-[#252f52] text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div className="flex-1 mt-1">
              <h3 id="dialog-title" className="text-lg font-bold text-slate-900 mb-2">
                {title}
              </h3>
              <p id="dialog-description" className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          {!isAlert && (
            <button
              ref={cancelBtnRef}
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${getButtonClass()}`}
          >
            {isAlert ? (confirmText === 'Confirm' ? 'OK' : confirmText) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
