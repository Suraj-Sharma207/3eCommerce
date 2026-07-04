import React from'react';
import { Link } from'react-router-dom';

const MegaMenuColumn = ({ group, onClose }) => {
 return (
 <div className="flex flex-col">
 <Link 
 to={`/products?category=${group.slug}`} 
 onClick={onClose}
 className="text-text-brand-600 mb-4 hover:text-brand-600 transition-colors"
 >
 {group.category}
 </Link>
 <ul className="space-y-3">
 {group.items.map(item => (
 <li key={item}>
 <Link 
 to={`/products?category=${group.slug}`} 
 onClick={onClose}
 className="text-sm text-text-secondary hover:text-brand-600 transition-colors"
 >
 {item}
 </Link>
 </li>
 ))}
 </ul>
 </div>
 );
};

export default React.memo(MegaMenuColumn);
