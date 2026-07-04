import React from'react';
import { PackageX } from'lucide-react';

const EmptyState = ({ title ='No items found', description ='Try adjusting your search or filters.', icon: Icon = PackageX, action }) => {
 return (
 <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-border-light shadow-sm">
 <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4">
 <Icon className="w-8 h-8 text-secondary-400" />
 </div>
 <h3 className="text-lg font-bold text-secondary-900 mb-2">{title}</h3>
 <p className="text-text-secondary max-w-sm mb-6">{description}</p>
 {action && action}
 </div>
 );
};

export default EmptyState;
