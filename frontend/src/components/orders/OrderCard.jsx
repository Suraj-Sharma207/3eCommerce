import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Package, ChevronRight } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

const OrderCard = ({ order }) => {
  if (!order) return null;

  const getStatusBadgeVariant = (status) => {
    return status?.toLowerCase() || 'neutral';
  };

  return (
    <Card className="p-5 hover:shadow-soft transition-all duration-300 font-normal">
      <div className="flex flex-wrap items-center justify-between gap-4 font-normal">
        <div className="flex items-center gap-4 font-normal">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-normal">
            <Package className="w-6 h-6 font-normal" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 font-normal">
              <h4 className="text-base text-secondary-900 font-normal">{order.id}</h4>
              <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
            </div>
            <p className="text-sm text-text-secondary font-normal">
              Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-normal">
          <div className="text-right font-normal">
            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider font-normal">Total Amount</p>
            <p className="text-lg text-secondary-900 font-normal">{formatPrice(order.totalAmount)}</p>
          </div>
          <Button variant="ghost" className="!p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-full font-normal">
            <ChevronRight className="w-5 h-5 font-normal" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;
