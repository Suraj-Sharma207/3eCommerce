import React, { useEffect, useState } from'react';
import useSettingsStore from'../../../store/settingsStore';
import Button from'../../../components/ui/Button';
import toast from'react-hot-toast';
import { Save, X, Edit2 } from'lucide-react';
import SkeletonLoader from'../../../components/ui/SkeletonLoader';

const NotificationsTab = () => {
 const { domains, fetchDomainSettings, updateDomainSettings } = useSettingsStore();
 const { data, isLoading, isSaving } = domains.notifications;
 const [isEditing, setIsEditing] = useState(false);
 const [formData, setFormData] = useState({});

 useEffect(() => {
 fetchDomainSettings('notifications');
 }, [fetchDomainSettings]);

 useEffect(() => {
 setFormData(data || {});
 }, [data]);

 const handleChange = (e) => {
 const { name, value, type, checked } = e.target;
 setFormData({ ...formData, [name]: type ==='checkbox' ? checked : value });
 };

 const handleSave = async (e) => {
 e.preventDefault();
 const success = await updateDomainSettings('notifications', formData);
 if (success) {
 toast.success('Notification settings updated.');
 setIsEditing(false);
 }
 };

 const handleCancel = () => {
 setFormData(data || {});
 setIsEditing(false);
 };

 if (isLoading && !Object.keys(data).length) return <div className="p-8 text-center text-text-muted font-medium">Loading notification settings...</div>;

 return (
 <div className="space-y-6 animate-in fade-in duration-300">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg text-text-primary mb-1 font-bold">System Notifications</h3>
 <p className="text-sm text-text-muted font-medium">Choose which notifications your store automatically sends.</p>
 </div>
 {!isEditing && (
 <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
 <Edit2 className="w-4 h-4 mr-2" /> Edit
 </Button>
 )}
 </div>

 <div className="space-y-4">
 <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.emailNotifications !== false && isEditing ?'border-brand-600 bg-brand-50/10' :'border-border'} ${!isEditing &&'opacity-70 cursor-not-allowed'}`}>
 <input 
 type="checkbox" name="emailNotifications" 
 checked={formData.emailNotifications ?? true} onChange={handleChange} 
 disabled={!isEditing}
 className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50" 
 />
 <div>
 <div className="text-text-primary">Customer Email Notifications</div>
 <div className="text-xs text-text-muted font-medium">Send order confirmations and shipping updates via email.</div>
 </div>
 </label>
 
 <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.smsNotifications && isEditing ?'border-brand-600 bg-brand-50/10' :'border-border'} ${!isEditing &&'opacity-70 cursor-not-allowed'}`}>
 <input 
 type="checkbox" name="smsNotifications" 
 checked={formData.smsNotifications || false} onChange={handleChange} 
 disabled={!isEditing}
 className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50" 
 />
 <div>
 <div className="text-text-primary">Customer SMS Notifications</div>
 <div className="text-xs text-text-muted font-medium">Send order updates via SMS (Requires Twilio config).</div>
 </div>
 </label>
 
 <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.adminAlerts !== false && isEditing ?'border-brand-600 bg-brand-50/10' :'border-border'} ${!isEditing &&'opacity-70 cursor-not-allowed'}`}>
 <input 
 type="checkbox" name="adminAlerts" 
 checked={formData.adminAlerts ?? true} onChange={handleChange} 
 disabled={!isEditing}
 className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50" 
 />
 <div>
 <div className="text-text-primary">Admin Alerts</div>
 <div className="text-xs text-text-muted font-medium">Notify admins about low stock and new orders.</div>
 </div>
 </label>
 </div>

 {isEditing && (
 <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6 sticky bottom-0 bg-white py-4 z-10">
 <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
 <X className="w-4 h-4 mr-2" /> Cancel
 </Button>
 <Button type="button" onClick={handleSave} isLoading={isSaving}>
 <Save className="w-4 h-4 mr-2" /> Save Changes
 </Button>
 </div>
 )}
 </div>
 );
};

export default NotificationsTab;
