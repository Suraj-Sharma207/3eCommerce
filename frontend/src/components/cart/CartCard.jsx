import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Card from '../ui/Card';

const CartCard = ({ item }) => {
  // Placeholder item data if none provided
  const data = item || {
    name: 'Nordic Ceramic Vase',
    price: 45.00,
    quantity: 2,
    imageUrl: 'https://images.unsplash.com/photo-1613203009765-a8c4ce8c7f96?w=500&q=80',
  };

  return (
    <Card className="flex flex-col sm:flex-row items-center gap-4 p-4">
      <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-secondary-100 rounded-lg overflow-hidden">
        <img 
          src={data.imageUrl} 
          alt={data.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-semibold text-secondary-900 truncate">{data.name}</h4>
        <p className="text-sm text-secondary-500 mt-1">${data.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-secondary-200 rounded-lg p-1 bg-white">
          <button className="p-1 text-secondary-400 hover:text-primary-600 transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium text-secondary-900">
            {data.quantity}
          </span>
          <button className="p-1 text-secondary-400 hover:text-primary-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-base font-bold text-secondary-900">${(data.price * data.quantity).toFixed(2)}</p>
        </div>
        <button className="p-2 text-danger/70 hover:text-danger transition-colors bg-danger-light/50 hover:bg-danger-light rounded-lg">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

export default CartCard;
