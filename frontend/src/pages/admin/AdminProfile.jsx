import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Globe, Smartphone, LogOut, CheckCircle } from 'lucide-react';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ImageFallback from '../../components/ui/ImageFallback';
import toast from 'react-hot-toast';

const AdminProfile = () => {
  const { profile, isLoading, updateProfile, changePassword } = useUserStore();
  const { logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);

  // Personal Info Form
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    language: 'en',
  });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      setPersonalData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatarUrl || '',
        language: profile.language || 'en',
      });
    }
  }, [profile]);

  const handlePersonalChange = (e) => {
    setPersonalData({ ...personalData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await updateProfile({
      name: personalData.name,
      phone: personalData.phone,
      avatarUrl: personalData.avatarUrl,
      language: personalData.language
    });
    
    if (success) {
      toast.success('Profile updated successfully');
    }
    setIsSaving(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (success) {
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setIsSaving(false);
  };

  const handleLogoutAll = () => {
    toast.success('Logged out of all other devices successfully');
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };

  const strength = calculatePasswordStrength(passwordData.newPassword);

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: <User className="w-4 h-4 mr-2" /> },
    { id: 'security', label: 'Security & Password', icon: <Lock className="w-4 h-4 mr-2" /> },
    { id: 'preferences', label: 'Preferences', icon: <Globe className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-brand-600 flex items-center gap-2">
          <User className="w-6 h-6" />
          Admin Profile
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-border p-4 space-y-1 shrink-0">
          <div className="flex flex-col items-center p-4 border-b border-border mb-4">
            <ImageFallback src={profile?.avatarUrl} alt={profile?.name} className="w-20 h-20 rounded-full object-cover border border-border mb-3" />
            <div className="font-bold text-text-primary text-center">{profile?.name}</div>
            <div className="text-xs text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded uppercase tracking-wider mt-1">Administrator</div>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab.id 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-text-secondary hover:bg-border-light hover:text-text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          
          {/* PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Personal Information</h3>
                  <p className="text-sm text-text-muted">Update your profile photo and personal details.</p>
                </div>
              </div>
              
              <form id="personal-form" onSubmit={handlePersonalSubmit} className="max-w-xl space-y-5">
                <div className="flex items-center gap-4 mb-2">
                  <ImageFallback src={personalData.avatarUrl} className="w-16 h-16 rounded-full border border-border object-cover" />
                  <Input 
                    name="avatarUrl" 
                    value={personalData.avatarUrl} 
                    onChange={handlePersonalChange} 
                    placeholder="Avatar image URL"
                    className="flex-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <Input label="Full Name" name="name" required value={personalData.name} onChange={handlePersonalChange} />
                  <Input label="Email Address" name="email" type="email" value={personalData.email} disabled className="bg-surface-background opacity-70" />
                  <Input label="Phone Number" name="phone" value={personalData.phone} onChange={handlePersonalChange} placeholder="+1 (555) 000-0000" />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4 mr-2" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <div className="border-b border-border pb-4 mb-6">
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Change Password</h3>
                  <p className="text-sm text-text-muted">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                
                <form id="password-form" onSubmit={handlePasswordSubmit} className="max-w-xl space-y-5">
                  <Input 
                    label="Current Password" 
                    name="currentPassword" 
                    type="password" 
                    required 
                    value={passwordData.currentPassword} 
                    onChange={handlePasswordChange} 
                  />
                  
                  <div>
                    <Input 
                      label="New Password" 
                      name="newPassword" 
                      type="password" 
                      required 
                      value={passwordData.newPassword} 
                      onChange={handlePasswordChange} 
                    />
                    {passwordData.newPassword && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div 
                            key={level} 
                            className={`h-1.5 flex-1 rounded-full ${
                              strength >= level 
                                ? strength < 3 ? 'bg-danger-500' : strength < 5 ? 'bg-warning-500' : 'bg-success-500'
                                : 'bg-border-light'
                            }`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Input 
                    label="Confirm New Password" 
                    name="confirmPassword" 
                    type="password" 
                    required 
                    value={passwordData.confirmPassword} 
                    onChange={handlePasswordChange} 
                  />
                  
                  <div className="pt-2 flex justify-end">
                    <Button type="submit" isLoading={isSaving} icon={<Lock className="w-4 h-4 mr-2" />}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>

              <div className="pt-8 border-t border-border">
                <h3 className="text-lg font-extrabold text-text-primary mb-1">Active Sessions</h3>
                <p className="text-sm text-text-muted mb-4">You're currently logged in on the following devices.</p>
                
                <div className="bg-surface-background rounded-xl border border-border p-4 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-100 text-brand-600 p-2 rounded-lg"><Globe className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold text-text-primary flex items-center gap-2">Chrome on Windows <span className="text-[10px] uppercase font-bold bg-success-100 text-success-700 px-1.5 rounded">Current</span></div>
                      <div className="text-xs text-text-muted">192.168.1.1 • Active now</div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-background rounded-xl border border-border p-4 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-secondary-100 text-text-secondary p-2 rounded-lg"><Smartphone className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold text-text-primary">Safari on iPhone</div>
                      <div className="text-xs text-text-muted">192.168.1.5 • Last active 2 hours ago</div>
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={handleLogoutAll} icon={<LogOut className="w-4 h-4 mr-2" />}>
                  Log out of all other devices
                </Button>
              </div>
            </div>
          )}

          {/* PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-border pb-4 mb-6">
                <h3 className="text-lg font-extrabold text-text-primary mb-1">System Preferences</h3>
                <p className="text-sm text-text-muted">Manage your dashboard display settings.</p>
              </div>
              
              <div className="max-w-xl space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-primary">Interface Language</label>
                  <select 
                    name="language" 
                    value={personalData.language} 
                    onChange={handlePersonalChange}
                    className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600"
                  >
                    <option value="en">English (US)</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                
                <div className="p-4 border border-border rounded-xl bg-surface-background flex items-start gap-3">
                  <div className="text-brand-600 mt-0.5"><CheckCircle className="w-5 h-5" /></div>
                  <div>
                    <div className="font-bold text-text-primary text-sm">Light Mode Active</div>
                    <div className="text-xs text-text-muted mt-0.5">The enterprise dashboard currently only supports Light mode. Dark mode will be available in a future update.</div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-border mt-8">
                  <Button onClick={handlePersonalSubmit} isLoading={isSaving} icon={<Save className="w-4 h-4 mr-2" />}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
