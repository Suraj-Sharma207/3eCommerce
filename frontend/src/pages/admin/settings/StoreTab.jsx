import React, { useEffect, useState } from "react";
import useSettingsStore from "../../../store/settingsStore";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import PhoneInput from "../../../components/ui/PhoneInput";
import toast from "react-hot-toast";
import { Save, X, Edit2 } from "lucide-react";
import SkeletonLoader from "../../../components/ui/SkeletonLoader";

const StoreTab = () => {
  const { domains, fetchDomainSettings, updateDomainSettings } =
    useSettingsStore();
  const { data, isLoading, isSaving } = domains.store;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDomainSettings("store");
  }, [fetchDomainSettings]);

  useEffect(() => {
    setFormData(data || {});
  }, [data]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await updateDomainSettings("store", formData);
    if (success) {
      toast.success("Store settings updated.");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(data || {});
    setIsEditing(false);
  };

  if (isLoading && !Object.keys(data).length)
    return (
      <div className="p-8 text-center text-text-muted font-medium">
        Loading store settings...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-text-primary mb-1 font-bold">
            Store Identity
          </h3>
          <p className="text-sm text-text-muted font-medium">
            Manage your store's public information.
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Store Name"
          name="storeName"
          value={formData.storeName || ""}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="e.g. LuxeHome"
        />
        <Input
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={formData.contactEmail || ""}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="support@example.com"
        />
        <PhoneInput
          label="Contact Phone"
          name="contactPhone"
          value={formData.contactPhone || ""}
          onChange={handleChange}
          disabled={!isEditing}
        />
        <div className="space-y-1.5">
          <label className="text-sm text-text-primary">Currency</label>
          <select
            name="currency"
            value={formData.currency || "USD"}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-background disabled:text-text-muted font-medium"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6 sticky bottom-0 bg-white py-4 z-10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
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

export default StoreTab;
