import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Package, ChevronRight } from 'lucide-react';

const OrderCard = ({ order }) => {
  // Placeholder order data if none provided
  const data = order || {
    id: 'ORD-847291',
    date: 'Oct 24, 2026',
    totalAmount: 344.99,
    status: 'SHIPPED',
    itemCount: 3,
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'SHIPPED': return 'primary';
      case 'PROCESSING': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Card className="p-5 hover:shadow-soft transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="text-base font-bold text-secondary-900">{data.id}</h4>
              <Badge variant={getStatusBadgeVariant(data.status)}>{data.status}</Badge>
            </div>
            <p className="text-sm text-secondary-500">
              Placed on {data.date} • {data.itemCount} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-secondary-500 font-medium mb-1 uppercase tracking-wider">Total Amount</p>
            <p className="text-lg font-bold text-secondary-900">${data.totalAmount.toFixed(2)}</p>
          </div>
          <Button variant="ghost" className="!p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;
