import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';
import { User, LogOut } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <div className="h-[60vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <PageContainer className="py-8 lg:py-12 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">My Profile</h1>
        <Button variant="outline" onClick={handleLogout} className="group">
          <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
            <p className="text-sm text-text-secondary mb-4">{user.email}</p>
            <span className="bg-secondary-100 text-secondary-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {user.role}
            </span>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-text-primary mb-6 pb-4 border-b border-secondary-100">Personal Information</h3>
            
            <form className="space-y-6" onSubmit={e => e.preventDefault()}>
              <Input 
                label="Full Name" 
                defaultValue={user.name} 
              />
              <Input 
                label="Email Address" 
                type="email" 
                defaultValue={user.email} 
                disabled 
              />
              
              <h3 className="text-lg font-bold text-text-primary mt-8 mb-6 pb-4 border-b border-secondary-100">Change Password</h3>
              
              <Input 
                label="Current Password" 
                type="password" 
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="New Password" 
                  type="password" 
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                />
              </div>

              <div className="pt-6 flex justify-end">
                <Button type="submit" size="lg" className="px-8 shadow-md">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default ProfilePage;
