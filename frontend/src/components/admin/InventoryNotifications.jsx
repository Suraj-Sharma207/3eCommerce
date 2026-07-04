import React, { useEffect } from'react';
import { useNavigate } from'react-router-dom';
import useAdminStore from'../../store/adminStore';
import { Bell, AlertCircle, Package, Archive, PlusCircle } from'lucide-react';
import SkeletonLoader from'../ui/SkeletonLoader';

const InventoryNotifications = () => {
 const navigate = useNavigate();
 const { inventoryAlerts, inventoryAlertsError, fetchInventoryAlerts } = useAdminStore();

 useEffect(() => {
 fetchInventoryAlerts();
 
 // Optional: Could set up an interval for live updates, e.g., every 60s
 // const interval = setInterval(fetchInventoryAlerts, 60000);
 // return () => clearInterval(interval);
 }, [fetchInventoryAlerts]);

 if (inventoryAlertsError && !inventoryAlerts) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-center">
 <AlertCircle className="w-8 h-8 text-danger-500 mb-3" />
 <h3 className="text-sm font-bold text-text-primary mb-1">Unable to load Inventory Alerts</h3>
 <p className="text-xs text-text-muted mb-4 font-medium">{inventoryAlertsError}</p>
 <button 
 onClick={() => fetchInventoryAlerts()}
 className="px-4 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors"
 >
 Retry
 </button>
 </div>
 );
 }

 if (!inventoryAlerts) {
 return (
 <div className="flex-1 flex flex-col space-y-4 mt-2">
 <SkeletonLoader className="h-6 w-1/2 mb-2" />
 {[1, 2, 3, 4, 5].map(i => <SkeletonLoader key={i} className="w-full h-12 rounded-lg" />)}
 </div>
 );
 }

 const { outOfStock, lowStock, recentlyRestocked, recentlyAdded } = inventoryAlerts;
 const totalAlerts = outOfStock.length + lowStock.length;

 const navigateToProduct = (product, edit = false) => {
 // Navigate to products module with pre-filled search
 navigate(`/admin/products?search=${encodeURIComponent(product.name)}${edit ?'&edit=true' :''}`);
 };

 return (
 <div className="flex flex-col h-full max-h-[400px]">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-bold text-text-brand-600 flex items-center gap-2">
 <Bell className="w-5 h-5" />
 Inventory Notifications
 </h3>
 {totalAlerts > 0 && (
 <span className="px-2 py-1 rounded-full bg-danger-100 text-danger-700 text-xs">
 {totalAlerts} Alert{totalAlerts !== 1 ?'s' :''}
 </span>
 )}
 </div>

 <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
 {outOfStock.map((p) => (
 <NotificationCard 
 key={`oos-${p.id}`}
 icon={AlertCircle}
 iconColor="text-danger-500"
 bgColor="bg-danger-50"
 borderColor="border-danger-100"
 title={p.name}
 subtitle="Out of Stock"
 meta={`Updated ${formatTimeAgo(p.updatedAt)}`}
 onClick={() => navigateToProduct(p, true)}
 />
 ))}

 {lowStock.map((p) => (
 <NotificationCard 
 key={`low-${p.id}`}
 icon={Archive}
 iconColor="text-warning-500"
 bgColor="bg-warning-50"
 borderColor="border-warning-100"
 title={p.name}
 subtitle={`Only ${p.stock} left`}
 onClick={() => navigateToProduct(p, true)}
 />
 ))}

 {recentlyRestocked.map((p) => (
 <NotificationCard 
 key={`restock-${p.id}`}
 icon={Package}
 iconColor="text-success-500"
 bgColor="bg-success-50"
 borderColor="border-success-100"
 title={p.name}
 subtitle="Restocked"
 meta={`Stock: ${p.stock}`}
 onClick={() => navigateToProduct(p)}
 />
 ))}

 {recentlyAdded.map((p) => (
 <NotificationCard 
 key={`new-${p.id}`}
 icon={PlusCircle}
 iconColor="text-brand-500"
 bgColor="bg-brand-50"
 borderColor="border-brand-100"
 title={p.name}
 subtitle="Added Today"
 meta={`Stock: ${p.stock}`}
 onClick={() => navigateToProduct(p)}
 />
 ))}

 {(outOfStock.length + lowStock.length + recentlyRestocked.length + recentlyAdded.length === 0) && (
 <div className="flex flex-col items-center justify-center p-8 text-center h-full">
 <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
 <Package className="w-6 h-6 text-secondary-400" />
 </div>
 <p className="text-sm text-text-brand-600">All caught up!</p>
 <p className="text-xs text-text-muted mt-1 font-medium">Your inventory is well stocked and healthy.</p>
 </div>
 )}
 </div>
 </div>
 );
};

const NotificationCard = ({ icon: Icon, iconColor, bgColor, borderColor, title, subtitle, meta, onClick }) => (
 <div 
 onClick={onClick}
 className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${bgColor} ${borderColor} flex gap-3 items-start group`}
 >
 <div className={`mt-0.5 ${iconColor}`}>
 <Icon className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm text-text-primary truncate group-hover:text-brand-600 transition-colors">
 {title}
 </p>
 <div className="flex items-center justify-between mt-1">
 <span className={`text-xs font-bold ${iconColor}`}>{subtitle}</span>
 {meta && <span className="text-[10px] font-medium text-text-muted">{meta}</span>}
 </div>
 </div>
 </div>
);

// Simple time ago formatter
const formatTimeAgo = (dateString) => {
 const date = new Date(dateString);
 const now = new Date();
 const diffInSeconds = Math.floor((now - date) / 1000);
 
 if (diffInSeconds < 60) return'Just now';
 if (diffInSeconds < 3600) return`${Math.floor(diffInSeconds / 60)}m ago`;
 if (diffInSeconds < 86400) return`${Math.floor(diffInSeconds / 3600)}h ago`;
 return`${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default InventoryNotifications;
