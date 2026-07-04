import React from'react';
import useAuthStore from'../../store/authStore';
import useConfirmStore from'../../store/confirmStore';
import Button from'../../components/ui/Button';

const SettingsPage = () => {
 const { logout } = useAuthStore();
 const { confirm } = useConfirmStore();

 const handleLogout = async () => {
 const isConfirmed = await confirm({
 title:'Confirm Logout',
 description:'Are you sure you want to log out of your account?',
 confirmText:'Log Out',
 cancelText:'Cancel'
 });
 if (isConfirmed) {
 logout();
 }
 };

 return (
 <div className="space-y-8">
 <div>
 <h1 className="text-3xl text-text-primary font-bold">Account Settings</h1>
 <p className="text-text-muted mt-2 font-medium">Manage your account preferences and global settings.</p>
 </div>

 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">
 <h2 className="text-xl text-text-primary mb-6 font-bold">Device Management</h2>
 <div className="flex items-center justify-between p-4 bg-surface-background rounded-xl">
 <div>
 <p className="text-text-primary">Current Session</p>
 <p className="text-sm text-text-muted font-medium">Windows • Chrome • Active Now</p>
 </div>
 <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
 Log Out Current Device
 </Button>
 </div>
 </div>

 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">
 <h2 className="text-xl text-red-600 mb-6 font-bold">Danger Zone</h2>
 <p className="text-text-muted mb-4 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
 <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
 Delete Account
 </Button>
 </div>
 </div>
 );
};

export default SettingsPage;
