import React from'react';
import { Link } from'react-router-dom';
import * as LucideIcons from'lucide-react';

const CategoryCard = ({ title, count, iconName ='Package', to }) => {
 const IconComponent = LucideIcons[iconName] || LucideIcons.Package;

 return (
 <Link to={to} className="group block">
 <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-brand-200">
 <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors duration-300 text-text-muted font-medium">
 <IconComponent className="w-8 h-8" />
 </div>
 <h3 className="text-lg text-text-primary group-hover:text-brand-600 transition-colors font-bold">{title}</h3>
 {count !== undefined && (
 <p className="text-sm text-text-muted mt-1 font-medium">{count} items</p>
 )}
 </div>
 </Link>
 );
};

export default CategoryCard;
