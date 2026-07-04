import React from'react';
import { Link } from'react-router-dom';
import { ArrowRight } from'lucide-react';

const SectionHeader = ({ title, subtitle, actionLabel, actionLink, actionButton }) => {
 return (
 <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
 <div>
 <h2 className="text-3xl text-text-brand-600 tracking-tight mb-3 leading-none font-bold">
 {title}
 </h2>
 {subtitle && <p className="text-lg text-text-secondary">{subtitle}</p>}
 </div>
 
 {actionButton ? (
 <div className="hidden sm:block">
 {actionButton}
 </div>
 ) : actionLabel && actionLink ? (
 <Link 
 to={actionLink}
 className="inline-flex items-center text-sm text-brand-600 hover:text-brand-700 transition-colors group"
 >
 {actionLabel}
 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
 </Link>
 ) : null}
 </div>
 );
};

export default SectionHeader;
