import React from 'react';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';

const OrderTimeline = ({ currentStatus }) => {
  // Define steps
  const steps = [
    {
      id: 'placed',
      label: 'Order Placed',
      description: 'We have received your order',
      icon: Package,
    },
    {
      id: 'confirmed',
      label: 'Payment Confirmed',
      description: 'Your payment was successful',
      icon: CheckCircle2,
    },
    {
      id: 'preparing',
      label: 'Preparing Order',
      description: 'We are preparing your items',
      icon: Clock,
    },
    {
      id: 'shipped',
      label: 'Shipped',
      description: 'Your order is on the way',
      icon: Truck,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      description: 'Enjoy your new items!',
      icon: CheckCircle2,
    }
  ];

  // Determine current active step index based on standard statuses
  let activeIndex = 0;
  const s = currentStatus?.toUpperCase();
  if (s === 'CONFIRMED' || s === 'PROCESSING') activeIndex = 1;
  if (s === 'PREPARING') activeIndex = 2; // custom status
  if (s === 'SHIPPED') activeIndex = 3;
  if (s === 'DELIVERED') activeIndex = 4;

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200 mb-8 font-normal">
      <h2 className="text-xl font-bold text-text-brand-700 mb-6">Order Progress</h2>
      
      <div className="relative font-normal">
        {/* Vertical Line */}
        <div className="absolute top-4 bottom-4 left-[20px] w-0.5 bg-gray-100 font-normal"></div>

        <div className="space-y-6 font-normal">
          {steps.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative flex items-start group font-normal">
                {/* Icon Container */}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 bg-white
                  ${isCompleted ? 'border-success-500 text-success-500' : 'border-gray-200 text-gray-400'}
                  ${isCurrent ? 'ring-4 ring-success-50' : ''}
                `}>
                  <Icon className="w-4 h-4 font-normal" />
                </div>

                {/* Content */}
                <div className="ml-4 flex flex-col justify-center min-h-[40px] font-normal">
                  <p className={`text-sm font-bold transition-colors duration-300 ${isCompleted ? 'text-text-brand-700' : 'text-text-muted'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 font-medium">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
