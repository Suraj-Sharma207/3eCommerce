import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemTitle,
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false
}) => {
  useEffect(() => {
    if (isOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Scrollable Content */}
        <div className="p-6 pb-4 overflow-y-auto flex-1">
          <button 
            onClick={!isLoading ? onClose : undefined}
            className="absolute right-4 top-4 text-text-muted hover:text-text-primary transition-colors focus:outline-none rounded-lg p-1 hover:bg-surface-background"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-danger-50' : 'bg-warning-50'}`}>
              <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-danger-600' : 'text-warning-600'}`} />
            </div>
            
            <h3 className="text-xl font-extrabold text-text-primary mb-2">
              {title}
            </h3>
            
            {itemTitle && (
              <p className="font-bold text-text-primary bg-surface-background px-4 py-2 rounded-lg text-sm mb-3 border border-border w-full truncate">
                {itemTitle}
              </p>
            )}
            
            <p className="text-sm text-text-secondary font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 shrink-0 flex flex-col sm:flex-row gap-3 border-t border-border/50">
          <Button 
            variant="outline" 
            className="w-full sm:flex-1" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant="primary" 
            className={`w-full sm:flex-1 ${isDestructive ? '!bg-danger-600 hover:!bg-danger-700 !ring-danger-600' : ''}`}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
