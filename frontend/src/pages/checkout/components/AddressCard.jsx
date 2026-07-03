import React from 'react';
import { MapPin } from 'lucide-react';

const AddressCard = ({ address }) => {
  if (!address) return null;

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6 font-normal">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3 font-normal">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center font-normal">
          <MapPin className="w-4 h-4 text-brand-600 font-normal" />
        </div>
        <h3 className="font-bold text-text-brand-700 text-sm">Delivery Address</h3>
      </div>
      
      <div className="text-sm text-text-secondary space-y-1 mt-2 font-normal">
        <p className="text-text-brand-700 mb-1 font-normal">{address.recipientName}</p>
        <p>{address.street}</p>
        <p>{address.city}, {address.state}</p>
        <p>{address.country} {address.zipCode}</p>
        {address.phone && (
          <p className="pt-2 mt-2 border-t border-gray-50 flex items-center gap-2 font-normal">
            <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Phone:</span>
            <span className="font-normal">{address.phone}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
