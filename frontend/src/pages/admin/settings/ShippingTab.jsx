import React, { useEffect, useState } from 'react';
import useSettingsStore from '../../../store/settingsStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';
import { Save, X, Edit2 } from 'lucide-react';

const ShippingTab = () => {
  const { domains, fetchDomainSettings, updateDomainSettings } = useSettingsStore();
  const { data, isLoading, isSaving } = domains.shipping;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDomainSettings('shipping');
  }, [fetchDomainSettings]);

  useEffect(() => {
    setFormData(data || {});
  }, [data]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await updateDomainSettings('shipping', formData);
    if (success) {
      toast.success('Shipping settings updated');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(data || {});
    setIsEditing(false);
  };

  if (isLoading && !Object.keys(data).length) return <div className="p-8 text-center text-text-muted">Loading shipping settings...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary mb-1">Shipping Configuration</h3>
          <p className="text-sm text-text-muted">Set up global shipping rules.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Input 
          label="Free Shipping Threshold" name="freeShippingThreshold" type="number" 
          value={formData.freeShippingThreshold || ''} onChange={handleChange} 
          disabled={!isEditing}
          placeholder="e.g. 500" 
        />
        <Input 
          label="Standard Delivery Charge" name="deliveryCharge" type="number" 
          value={formData.deliveryCharge || ''} onChange={handleChange} 
          disabled={!isEditing}
          placeholder="e.g. 20" 
        />
        <Input 
          label="Est. Delivery (Days)" name="estimatedDeliveryDays" 
          value={formData.estimatedDeliveryDays || ''} onChange={handleChange} 
          disabled={!isEditing}
          placeholder="e.g. 3-5" 
        />
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

export default ShippingTab;
