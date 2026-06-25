import React from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';

const SettingsPage = () => {
  const { logout } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium text-neutral-900">Account Settings</h1>
        <p className="text-neutral-500 mt-2">Manage your account preferences and global settings.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <h2 className="text-xl font-medium text-neutral-900 mb-6">Device Management</h2>
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
          <div>
            <p className="font-medium text-neutral-900">Current Session</p>
            <p className="text-sm text-neutral-500">Windows • Chrome • Active Now</p>
          </div>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={logout}>
            Log Out Current Device
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <h2 className="text-xl font-medium text-red-600 mb-6">Danger Zone</h2>
        <p className="text-neutral-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
          Delete Account
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
