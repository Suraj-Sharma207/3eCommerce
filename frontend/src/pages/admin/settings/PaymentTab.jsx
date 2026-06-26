import React, { useEffect, useState } from 'react';
import useSettingsStore from '../../../store/settingsStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';
import { Save, X, Edit2 } from 'lucide-react';

const PaymentTab = () => {
  const { domains, fetchDomainSettings, updateDomainSettings } = useSettingsStore();
  const { data, isLoading, isSaving } = domains.payment;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDomainSettings('payment');
  }, [fetchDomainSettings]);

  useEffect(() => {
    setFormData(data || {});
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await updateDomainSettings('payment', formData);
    if (success) {
      toast.success('Payment settings updated.');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(data || {});
    setIsEditing(false);
  };

  if (isLoading && !Object.keys(data).length) return <div className="p-8 text-center text-text-muted">Loading payment settings...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary mb-1">Payment Gateways</h3>
          <p className="text-sm text-text-muted">Enable or disable payment providers and configure API keys.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Stripe */}
        <div className={`p-4 border rounded-xl transition-colors ${formData.stripeEnabled ? 'border-brand-600 bg-brand-50/10' : 'border-border'}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input 
              type="checkbox" name="stripeEnabled" 
              checked={formData.stripeEnabled || false} onChange={handleChange} 
              disabled={!isEditing}
              className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50" 
            />
            <div>
              <div className="font-bold text-text-primary">Stripe</div>
              <div className="text-xs text-text-muted">Accept credit cards and digital wallets globally.</div>
            </div>
          </label>
          {formData.stripeEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input label="Public Key" name="stripePublicKey" value={formData.stripePublicKey || ''} onChange={handleChange} disabled={!isEditing} />
              <Input label="Secret Key" name="stripeSecretKey" type="password" value={formData.stripeSecretKey || ''} onChange={handleChange} disabled={!isEditing} placeholder="••••••••" />
            </div>
          )}
        </div>

        {/* Razorpay */}
        <div className={`p-4 border rounded-xl transition-colors ${formData.razorpayEnabled ? 'border-brand-600 bg-brand-50/10' : 'border-border'}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input 
              type="checkbox" name="razorpayEnabled" 
              checked={formData.razorpayEnabled || false} onChange={handleChange} 
              disabled={!isEditing}
              className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50" 
            />
            <div>
              <div className="font-bold text-text-primary">Razorpay</div>
              <div className="text-xs text-text-muted">Ideal for Indian businesses and UPI payments.</div>
            </div>
          </label>
          {formData.razorpayEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input label="Key ID" name="razorpayKeyId" value={formData.razorpayKeyId || ''} onChange={handleChange} disabled={!isEditing} />
              <Input label="Key Secret" name="razorpayKeySecret" type="password" value={formData.razorpayKeySecret || ''} onChange={handleChange} disabled={!isEditing} placeholder="••••••••" />
            </div>
          )}
        </div>

        {/* COD */}
        <div className={`p-4 border rounded-xl transition-colors ${formData.codEnabled ? 'border-brand-600 bg-brand-50/10' : 'border-border'}`}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" name="codEnabled" 
              checked={formData.codEnabled || false} onChange={handleChange} 
              disabled={!isEditing}
              className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50" 
            />
            <div>
              <div className="font-bold text-text-primary">Cash on Delivery (COD)</div>
              <div className="text-xs text-text-muted">Allow customers to pay upon receiving their order.</div>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-border mt-6">
        <h3 className="text-lg font-extrabold text-text-primary mb-1">Tax Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
          <Input label="GST (%)" name="gst" type="number" value={formData.gst || ''} onChange={handleChange} disabled={!isEditing} placeholder="e.g. 18" />
          <Input label="VAT (%)" name="vat" type="number" value={formData.vat || ''} onChange={handleChange} disabled={!isEditing} placeholder="e.g. 20" />
        </div>
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

export default PaymentTab;
