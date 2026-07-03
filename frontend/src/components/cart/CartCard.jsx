import React from 'react';
import { Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import { formatPrice } from '../../utils/currency';
import ImageFallback from '../ui/ImageFallback';
import QuantityStepper from '../ecommerce/QuantityStepper';
import { getOptimizedUrl } from '../../utils/cloudinary';

const CartCard = ({ item }) => {
  if (!item || !item.product) return null;

  return (
    <Card className="flex flex-col sm:flex-row items-center gap-4 p-4 font-normal">
      <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-border-light rounded-lg overflow-hidden font-normal">
        <ImageFallback 
          src={getOptimizedUrl(item.product.thumbnail, 'thumbnail')} 
          alt={item.product.name} 
          className="w-full h-full object-cover font-normal"
        />
      </div>
      
      <div className="flex-1 min-w-0 font-normal">
        <h4 className="text-base text-secondary-900 truncate font-normal">{item.product.name}</h4>
        <p className="text-sm text-text-secondary mt-1 font-normal">{formatPrice(item.product.finalPrice || item.product.price)}</p>
      </div>

      <div className="flex items-center gap-4 font-normal">
        <QuantityStepper 
          quantity={item.quantity} 
          setQuantity={() => {}} 
          max={item.product.stock || 99}
          className="w-full sm:w-32"
        />
        <div className="text-right min-w-[80px] font-normal">
          <p className="text-base text-secondary-900 font-normal">{formatPrice((item.product.finalPrice || item.product.price) * item.quantity)}</p>
        </div>
        <button className="p-2 text-danger-600/70 hover:text-danger-600 transition-colors bg-danger-50/50 hover:bg-danger-50 rounded-lg font-normal">
          <Trash2 className="w-5 h-5 font-normal" />
        </button>
      </div>
    </Card>
  );
};

export default CartCard;
