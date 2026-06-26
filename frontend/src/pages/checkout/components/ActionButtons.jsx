import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ orderId }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-500 w-full">
      {/* Primary: Track Order / View Orders */}
      <Button 
        as={Link} 
        to={`/orders`} 
        size="lg" 
        className="flex-1 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <Package className="w-4 h-4 mr-2" />
        View My Orders
      </Button>

      {/* Secondary: Continue Shopping */}
      <Button 
        as={Link} 
        to="/products" 
        variant="outline" 
        size="lg" 
        className="flex-1 group bg-white hover:bg-gray-50 transition-all duration-300"
      >
        <ShoppingBag className="w-4 h-4 mr-2 text-text-muted group-hover:text-text-brand-600 transition-colors" />
        Continue Shopping
      </Button>

      {/* Secondary/Ghost: Download Invoice (Mock/Placeholder for now) */}
      <Button 
        variant="ghost" 
        size="lg" 
        className="flex-1 bg-white border-transparent hover:bg-gray-100 transition-all duration-300 text-text-secondary"
        onClick={() => {
          // Placeholder for invoice download
          alert("Invoice generation will be available shortly.");
        }}
      >
        <Download className="w-4 h-4 mr-2" />
        Invoice
      </Button>
    </div>
  );
};

export default ActionButtons;
