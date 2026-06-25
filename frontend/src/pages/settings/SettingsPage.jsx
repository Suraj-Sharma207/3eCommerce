import React from 'react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';

const SettingsPage = () => {
  const { logout } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium text-text-primary">Account Settings</h1>
        <p className="text-text-muted mt-2">Manage your account preferences and global settings.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">
        <h2 className="text-xl font-medium text-text-primary mb-6">Device Management</h2>
        <div className="flex items-center justify-between p-4 bg-surface-background rounded-xl">
          <div>
            <p className="font-medium text-text-primary">Current Session</p>
            <p className="text-sm text-text-muted">Windows • Chrome • Active Now</p>
          </div>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={logout}>
            Log Out Current Device
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8">
        <h2 className="text-xl font-medium text-red-600 mb-6">Danger Zone</h2>
        <p className="text-text-muted mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
          Delete Account
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
