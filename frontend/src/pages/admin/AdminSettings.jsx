import React, { useEffect, useState } from 'react';
import { Settings, Save, Store, CreditCard, Mail, Shield, Bell } from 'lucide-react';
import useSettingsStore from '../../store/settingsStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const { settings, isLoading, isSaving, fetchSettings, updateSettings } = useSettingsStore();
  
  const [formData, setFormData] = useState({
    // Store
    storeName: '',
    contactEmail: '',
    contactPhone: '',
    currency: 'USD',
    timezone: 'UTC',
    // Shipping
    freeShippingThreshold: '',
    deliveryCharge: '',
    estimatedDeliveryDays: '',
    // Tax
    gst: '',
    vat: '',
    // Payment Methods
    razorpayEnabled: false,
    stripeEnabled: false,
    codEnabled: false,
    // SMTP
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    // Security
    sessionTimeout: '',
    jwtExpiry: '',
    twoFactorAuth: false,
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
  });

  const [activeTab, setActiveTab] = useState('store');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setFormData(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateSettings(formData);
    if (success) {
      toast.success('Settings saved successfully');
    }
  };

  const tabs = [
    { id: 'store', label: 'Store Configuration', icon: <Store className="w-4 h-4 mr-2" /> },
    { id: 'payment', label: 'Payment & Tax', icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { id: 'email', label: 'Email (SMTP)', icon: <Mail className="w-4 h-4 mr-2" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4 mr-2" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 mr-2" /> },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-text-brand-600 flex items-center gap-2">
          <Settings className="w-6 h-6" /> Settings
        </h1>
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex gap-8">
          <div className="w-64 space-y-2"><SkeletonLoader className="h-10 w-full" /><SkeletonLoader className="h-10 w-full" /></div>
          <div className="flex-1 space-y-4"><SkeletonLoader className="h-12 w-full" /><SkeletonLoader className="h-12 w-full" /><SkeletonLoader className="h-32 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-brand-600 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Settings
        </h1>
        <Button onClick={handleSubmit} isLoading={isSaving} className="shrink-0">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-border p-4 space-y-1 shrink-0">
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
          <form id="settings-form" onSubmit={handleSubmit} className="max-w-3xl space-y-8">
            
            {/* STORE SETTINGS */}
            {activeTab === 'store' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Store Identity</h3>
                  <p className="text-sm text-text-muted mb-4">Manage your store's public information.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label="Store Name" name="storeName" value={formData.storeName || ''} onChange={handleChange} placeholder="e.g. LuxeHome" />
                    <Input label="Contact Email" name="contactEmail" type="email" value={formData.contactEmail || ''} onChange={handleChange} placeholder="support@example.com" />
                    <Input label="Contact Phone" name="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} placeholder="+1 234 567 8900" />
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-text-primary">Currency</label>
                      <select name="currency" value={formData.currency || 'USD'} onChange={handleChange} className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Shipping Configuration</h3>
                  <p className="text-sm text-text-muted mb-4">Set up global shipping rules.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Input label="Free Shipping Threshold ($)" name="freeShippingThreshold" type="number" value={formData.freeShippingThreshold || ''} onChange={handleChange} placeholder="e.g. 500" />
                    <Input label="Standard Delivery Charge ($)" name="deliveryCharge" type="number" value={formData.deliveryCharge || ''} onChange={handleChange} placeholder="e.g. 20" />
                    <Input label="Est. Delivery (Days)" name="estimatedDeliveryDays" value={formData.estimatedDeliveryDays || ''} onChange={handleChange} placeholder="e.g. 3-5" />
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT & TAX */}
            {activeTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Payment Gateways</h3>
                  <p className="text-sm text-text-muted mb-4">Enable or disable payment providers during checkout.</p>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                      <input type="checkbox" name="stripeEnabled" checked={formData.stripeEnabled || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                      <div>
                        <div className="font-bold text-text-primary">Stripe</div>
                        <div className="text-xs text-text-muted">Accept credit cards and digital wallets globally.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                      <input type="checkbox" name="razorpayEnabled" checked={formData.razorpayEnabled || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                      <div>
                        <div className="font-bold text-text-primary">Razorpay</div>
                        <div className="text-xs text-text-muted">Ideal for Indian businesses and UPI payments.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                      <input type="checkbox" name="codEnabled" checked={formData.codEnabled || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                      <div>
                        <div className="font-bold text-text-primary">Cash on Delivery (COD)</div>
                        <div className="text-xs text-text-muted">Allow customers to pay upon receiving their order.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Tax Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                    <Input label="GST (%)" name="gst" type="number" value={formData.gst || ''} onChange={handleChange} placeholder="e.g. 18" />
                    <Input label="VAT (%)" name="vat" type="number" value={formData.vat || ''} onChange={handleChange} placeholder="e.g. 20" />
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL SMTP */}
            {activeTab === 'email' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">SMTP Configuration</h3>
                  <p className="text-sm text-text-muted mb-4">Configure outgoing email server for transactional emails.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label="SMTP Host" name="smtpHost" value={formData.smtpHost || ''} onChange={handleChange} placeholder="smtp.gmail.com" />
                    <Input label="SMTP Port" name="smtpPort" type="number" value={formData.smtpPort || ''} onChange={handleChange} placeholder="587" />
                    <Input label="SMTP Username" name="smtpUser" value={formData.smtpUser || ''} onChange={handleChange} placeholder="user@example.com" />
                    <Input label="SMTP Password" name="smtpPass" type="password" value={formData.smtpPass || ''} onChange={handleChange} placeholder="••••••••" />
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" type="button">Send Test Email</Button>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">Store Security</h3>
                  <p className="text-sm text-text-muted mb-4">Manage authentication and session policies.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-text-primary">Session Timeout</label>
                      <select name="sessionTimeout" value={formData.sessionTimeout || '24h'} onChange={handleChange} className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600">
                        <option value="1h">1 Hour</option>
                        <option value="24h">24 Hours</option>
                        <option value="7d">7 Days</option>
                        <option value="30d">30 Days</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-text-primary">JWT Expiry</label>
                      <select name="jwtExpiry" value={formData.jwtExpiry || '7d'} onChange={handleChange} className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600">
                        <option value="1h">1 Hour</option>
                        <option value="24h">24 Hours</option>
                        <option value="7d">7 Days</option>
                      </select>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                    <input type="checkbox" name="twoFactorAuth" checked={formData.twoFactorAuth || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                    <div>
                      <div className="font-bold text-text-primary">Enforce Two-Factor Authentication</div>
                      <div className="text-xs text-text-muted">Require admins to use 2FA when logging in.</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary mb-1">System Notifications</h3>
                  <p className="text-sm text-text-muted mb-4">Choose which notifications your store automatically sends.</p>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                      <input type="checkbox" name="emailNotifications" checked={formData.emailNotifications ?? true} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                      <div>
                        <div className="font-bold text-text-primary">Customer Email Notifications</div>
                        <div className="text-xs text-text-muted">Send order confirmations and shipping updates via email.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                      <input type="checkbox" name="smsNotifications" checked={formData.smsNotifications || false} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                      <div>
                        <div className="font-bold text-text-primary">Customer SMS Notifications</div>
                        <div className="text-xs text-text-muted">Send order updates via SMS (Requires Twilio config).</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-surface-background transition-colors">
                      <input type="checkbox" name="adminAlerts" checked={formData.adminAlerts ?? true} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600" />
                      <div>
                        <div className="font-bold text-text-primary">Admin Alerts</div>
                        <div className="text-xs text-text-muted">Notify admins about low stock and new orders.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
