import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import Button from '../../components/ui/Button';
import { validateName, validatePhone, validatePassword, validateConfirmPassword, isFormValid } from '../../utils/validators';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageContainer from '../../components/layout/PageContainer';
import AvatarUploader from '../../components/common/AvatarUploader';
import { User, Mail, Phone, Calendar, Edit2, Shield, CheckCircle2, AlertCircle, Save, X, MapPin, Package, Heart } from 'lucide-react';

const PasswordStrengthMeter = ({ password }) => {
  const getStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (pass.match(/[A-Z]/)) strength += 1;
    if (pass.match(/[a-z]/)) strength += 1;
    if (pass.match(/[0-9]/)) strength += 1;
    if (pass.match(/[^A-Za-z0-9]/)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  
  const getColor = (s) => {
    if (s <= 1) return 'bg-red-500';
    if (s <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLabel = (s) => {
    if (!password) return '';
    if (s <= 1) return 'Weak';
    if (s <= 3) return 'Fair';
    return 'Strong';
  };

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-1.5 w-full gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-full ${i <= strength ? getColor(strength) : 'bg-neutral-200'} transition-colors duration-300`} 
          />
        ))}
      </div>
      <p className="text-xs text-text-muted text-right h-4">{getLabel(strength)}</p>
    </div>
  );
};

const ProfilePage = () => {
  const { fetchProfile, fetchStats, updateProfile, changePassword, isLoading, error: backendError, stats } = useUserStore();
  const { user: profile } = useAuthStore();
  
  const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'edit' | 'security'
  
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passErrors, setPassErrors] = useState({});
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const [globalMessage, setGlobalMessage] = useState('');

  useEffect(() => {
    // Silent background refresh
    fetchProfile();
    fetchStats();
  }, []);

  useEffect(() => {
    if (profile) {
      const data = {
        name: profile.name,
        phone: profile.phone,
        birthday: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : undefined,
        gender: profile.gender,
        avatarUrl: profile.avatarUrl
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [profile]);

  const isProfileDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProfileDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProfileDirty]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    // We no longer sanitize phone numbers because PhoneInput provides an E.164 string (+123...)
    const parsedValue = value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    
    let errorMsg = '';
    if (name === 'name') errorMsg = validateName(parsedValue, 'Name');
    if (name === 'phone' && parsedValue) errorMsg = validatePhone(parsedValue);
    setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPassError('');

    let errorMsg = '';
    if (name === 'currentPassword' && !value) errorMsg = 'Required';
    if (name === 'newPassword') errorMsg = validatePassword(value);
    
    setPassErrors(prev => {
      const next = { ...prev, [name]: errorMsg };
      if (name === 'newPassword' || name === 'confirmPassword') {
        const confirmVal = name === 'confirmPassword' ? value : passwordData.confirmPassword;
        const newPassVal = name === 'newPassword' ? value : passwordData.newPassword;
        if (confirmVal) {
          next.confirmPassword = validateConfirmPassword(newPassVal, confirmVal);
        }
      }
      return next;
    });
  };

  const validateProfile = () => {
    const errs = {};
    
    const nameErr = validateName(formData.name, 'Name');
    if (nameErr) errs.name = nameErr;

    if (formData.phone) {
      const phoneErr = validatePhone(formData.phone);
      if (phoneErr) errs.phone = phoneErr;
    }
    
    if (formData.birthday) {
      const bday = new Date(formData.birthday);
      const today = new Date();
      if (bday > today) {
        errs.birthday = 'Birthday cannot be in the future.';
      } else {
        const minAgeDate = new Date();
        minAgeDate.setFullYear(today.getFullYear() - 13);
        if (bday > minAgeDate) {
          errs.birthday = 'You must be at least 13 years old.';
        }
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    
    setGlobalMessage('');
    // Trim strings
    const trimmedData = {
      ...formData,
      name: formData.name.trim()
    };
    
    const success = await updateProfile(trimmedData);
    if (success) {
      setInitialData(trimmedData);
      setCurrentView('overview');
      setGlobalMessage('Profile updated successfully.');
      setTimeout(() => setGlobalMessage(''), 3000);
    }
  };

  const cancelProfileEdit = () => {
    setFormData(initialData);
    setFormErrors({});
    setCurrentView('overview');
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    
    const strengthErr = validatePassword(passwordData.newPassword);
    if (strengthErr) {
      setPassError(strengthErr);
      return;
    }

    const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (success) {
      setGlobalMessage('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setCurrentView('overview');
      setTimeout(() => setGlobalMessage(''), 3000);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  
  const maxBirthday = new Date().toISOString().split('T')[0];
  
  const getMemberSince = () => {
    if (!profile?.createdAt) return 'Unknown';
    return new Date(profile.createdAt).getFullYear();
  };

  const [defaultAddress, setDefaultAddress] = useState(null);
  useEffect(() => {
    import('../../store/addressStore').then((module) => {
      const fetchAddresses = module.default.getState().fetchAddresses;
      fetchAddresses().then(() => {
        const addresses = module.default.getState().addresses;
        const defaultShipping = addresses.find(a => a.isDefaultShipping) || addresses[0];
        setDefaultAddress(defaultShipping);
      });
    });
  }, []);



  // If initial load finished but profile is still completely missing, show error screen
  if (!profile) {
    return (
      <PageContainer className="py-8 lg:py-12 max-w-5xl space-y-8">
        <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Could not load profile</h2>
          <p>{backendError || 'An unexpected error occurred while fetching your profile.'}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12 max-w-5xl space-y-8">
      
      {globalMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl font-medium border border-green-200">
          <CheckCircle2 className="w-5 h-5" />
          {globalMessage}
        </div>
      )}
      {backendError && profile && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-200">
          <AlertCircle className="w-5 h-5" />
          {backendError}
        </div>
      )}

      {currentView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden p-8">
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-shrink-0">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="w-32 h-32 rounded-full object-cover border border-border shadow-sm" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-4xl font-bold border border-brand-100 shadow-sm">
                      {getInitials(profile.name)}
                    </div>
                  )}
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-3xl font-semibold text-text-primary tracking-tight">{profile.name}</h3>
                    <p className="text-text-muted mt-1">Customer Account • Member since {getMemberSince()}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm pt-2">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <Mail className="w-4 h-4 text-text-muted" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-3 text-text-secondary">
                      <Phone className="w-4 h-4 text-text-muted" />
                      {profile.phone || 'No phone number'}
                    </div>
                    {profile?.birthday && (
                      <div className="flex items-center gap-3 text-text-secondary">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {new Date(profile.birthday).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {defaultAddress && (
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden mt-8">
                <div className="p-6 border-b border-border-light flex items-center justify-between">
                  <h2 className="text-xl font-medium text-text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-text-muted" /> Default Shipping Address
                  </h2>
                </div>
                <div className="p-6 text-sm text-text-secondary space-y-1">
                  <p className="font-medium text-text-primary text-base">{defaultAddress.recipientName}</p>
                  <p>{defaultAddress.street}</p>
                  {defaultAddress.addressLine2 && <p>{defaultAddress.addressLine2}</p>}
                  <p>{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}</p>
                  <p>{defaultAddress.country}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden mt-8">
              <div className="p-6 border-b border-border-light">
                <h2 className="text-xl font-medium text-text-primary">Quick Actions</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => setCurrentView('edit')}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-background text-text-secondary hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 hover:shadow-md hover:-translate-y-1 border border-transparent rounded-[20px] transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Edit Profile</span>
                </button>
                <Link 
                  to="/addresses"
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-background text-text-secondary hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 hover:shadow-md hover:-translate-y-1 border border-transparent rounded-[20px] transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Manage Addresses</span>
                </Link>
                <button 
                  onClick={() => setCurrentView('security')}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-surface-background text-text-secondary hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 hover:shadow-md hover:-translate-y-1 border border-transparent rounded-[20px] transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">Change Password</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border-light">
                <h2 className="text-lg font-medium text-text-primary">Recent Activity</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {stats ? `${stats.totalOrders} Total Orders` : 'Loading...'}
                    </p>
                    <Link to="/orders" className="text-xs text-brand-600 hover:text-brand-700 font-medium">View order history</Link>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {stats ? `${stats.wishlistCount} Wishlist Items` : 'Loading...'}
                    </p>
                    <Link to="/wishlist" className="text-xs text-brand-600 hover:text-brand-700 font-medium">View wishlist</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'edit' && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border-light flex items-center justify-between">
              <h2 className="text-2xl font-medium text-text-primary">Edit Profile</h2>
              <button onClick={cancelProfileEdit} className="p-2 text-text-muted hover:bg-border-light rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8">
              <form onSubmit={submitProfile} className="space-y-8">
                {isProfileDirty && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-xl font-medium border border-amber-200">
                    <AlertCircle className="w-5 h-5" />
                    You have unsaved changes.
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Profile Photo</h3>
                  <AvatarUploader 
                    currentAvatarUrl={profile.avatarUrl} 
                    name={profile.name} 
                    onUpload={async (file) => {
                      const store = useUserStore.getState();
                      await store.uploadAvatar(file, false);
                      await store.fetchProfile();
                      const updatedProfile = useUserStore.getState().profile;
                      setFormData(prev => ({ ...prev, avatarUrl: updatedProfile.avatarUrl }));
                      setInitialData(prev => ({ ...prev, avatarUrl: updatedProfile.avatarUrl }));
                      setCurrentView('overview');
                    }} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Full Name" 
                    name="name" 
                    value={formData.name || ''} 
                    onChange={handleProfileChange} 
                    error={formErrors.name}
                    required 
                  />
                  <Input 
                    label="Email Address" 
                    value={profile.email} 
                    disabled 
                    readOnly
                    className="bg-surface-background opacity-70 cursor-not-allowed"
                  />
                  <div className="sm:col-span-2">
                    <PhoneInput 
                      label="Phone Number" 
                      name="phone" 
                      value={formData.phone || ''} 
                      onChange={handleProfileChange} 
                      error={formErrors.phone}
                    />
                  </div>
                  <Input 
                    label="Birthday" 
                    type="date" 
                    name="birthday" 
                    value={formData.birthday || ''} 
                    onChange={handleProfileChange} 
                    max={maxBirthday}
                    error={formErrors.birthday}
                  />
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-text-brand-600">Gender</label>
                    <select 
                      name="gender" 
                      value={formData.gender || ''} 
                      onChange={handleProfileChange} 
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all shadow-sm"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 justify-end">
                  <Button type="button" variant="outline" onClick={cancelProfileEdit}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isProfileDirty || !isFormValid(formErrors, { name: formData.name })} 
                    aria-disabled={!isProfileDirty || !isFormValid(formErrors, { name: formData.name })}
                    isLoading={isLoading} 
                    className="min-w-[140px]"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {currentView === 'security' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-border-light flex items-center justify-center text-text-secondary">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-medium text-text-primary">Change Password</h2>
              </div>
              <button onClick={() => { setCurrentView('overview'); setPassError(''); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="p-2 text-text-muted hover:bg-border-light rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8">
              <form onSubmit={submitPassword} className="space-y-6">
                {passError && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200 mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                    <span>{passError}</span>
                  </div>
                )}
                
                <Input 
                  label="Current Password" 
                  type="password" 
                  name="currentPassword" 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordChange} 
                  required 
                  error={passErrors.currentPassword}
                  aria-invalid={!!passErrors.currentPassword}
                />
                
                <div className="space-y-1">
                  <Input 
                    label="New Password" 
                    type="password" 
                    name="newPassword" 
                    value={passwordData.newPassword} 
                    onChange={handlePasswordChange} 
                    required 
                    error={passErrors.newPassword}
                    aria-invalid={!!passErrors.newPassword}
                  />
                  <PasswordStrengthMeter password={passwordData.newPassword} />
                </div>

                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange} 
                  required 
                  error={passErrors.confirmPassword}
                  aria-invalid={!!passErrors.confirmPassword}
                />
                
                <div className="flex items-center gap-4 pt-6 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setCurrentView('overview'); setPassError(''); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isFormValid(passErrors, { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword })} 
                    aria-disabled={!isFormValid(passErrors, { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword })}
                    isLoading={isLoading} 
                    className="min-w-[160px]"
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
};

export default ProfilePage;
