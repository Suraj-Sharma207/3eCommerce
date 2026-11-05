import React, { useEffect, useState } from "react";
import useConfirmStore from "../../../store/confirmStore";
import api from "../../../services/api";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import { Save, X, Edit2, ShieldAlert } from "lucide-react";
import SkeletonLoader from "../../../components/ui/SkeletonLoader";

const SecurityTab = () => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const { confirm } = useConfirmStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/security/settings");
      setData(response.data.data);
      setFormData(response.data.data);
    } catch (error) {
      toast.error("Failed to load security settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === "checkbox" ? checked : value;
    if (type === "number") finalValue = parseInt(value, 10);
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put("/admin/security/settings", formData);
      toast.success("Security settings updated.");
      setData(formData);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save security settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(data || {});
    setIsEditing(false);
  };

  const handleForceLogout = async () => {
    const isConfirmed = await confirm({
      title: "Force Logout All Users",
      description:
        "Are you sure you want to invalidate all active sessions? Everyone will need to log in again.",
      variant: "danger",
      confirmText: "Force Logout",
    });
    if (isConfirmed) {
      try {
        await api.post("/admin/security/logout-all");
        toast.success("All active sessions have been invalidated.");
      } catch (error) {
        toast.error("Failed to force logout users.");
      }
    }
  };

  if (isLoading)
    return (
      <div className="p-8 space-y-6">
        <SkeletonLoader className="h-8 w-48 mb-4" />
        <SkeletonLoader className="h-12 w-full" />
        <SkeletonLoader className="h-12 w-full" />
        <SkeletonLoader className="h-12 w-full" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-text-primary mb-1 font-bold">
            Store Security
          </h3>
          <p className="text-sm text-text-muted font-medium">
            Manage authentication and session policies.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div className="space-y-1.5">
          <label className="text-sm text-text-primary">
            Session Timeout (Admin)
          </label>
          <select
            name="sessionTimeout"
            value={formData.sessionTimeout || "24h"}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-background disabled:text-text-muted font-medium"
          >
            <option value="15m">15 Minutes</option>
            <option value="30m">30 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="2h">2 Hours</option>
            <option value="6h">6 Hours</option>
            <option value="12h">12 Hours</option>
            <option value="24h">24 Hours</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-text-primary">JWT Expiry</label>
          <select
            name="jwtExpiry"
            value={formData.jwtExpiry || "15m"}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-background disabled:text-text-muted font-medium"
          >
            <option value="5m">5 Minutes</option>
            <option value="10m">10 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="30m">30 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="2h">2 Hours</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-text-primary">
            Refresh Token Expiry
          </label>
          <select
            name="refreshTokenExpiry"
            value={formData.refreshTokenExpiry || "30d"}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-background disabled:text-text-muted font-medium"
          >
            <option value="1d">1 Day</option>
            <option value="7d">7 Days</option>
            <option value="15d">15 Days</option>
            <option value="30d">30 Days</option>
            <option value="60d">60 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label
          className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.accountLockoutEnabled && isEditing ? "border-brand-600 bg-brand-50/10" : "border-border"} ${!isEditing && "opacity-70 cursor-not-allowed"}`}
        >
          <input
            type="checkbox"
            name="accountLockoutEnabled"
            checked={formData.accountLockoutEnabled || false}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50"
          />
          <div>
            <div className="text-text-primary">Enable Account Lockout</div>
            <div className="text-xs text-text-muted font-medium">
              Lock accounts after failed login attempts.
            </div>
          </div>
        </label>

        {formData.accountLockoutEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ml-8 p-4 bg-surface-background rounded-xl border border-border">
            <div className="space-y-1.5">
              <label className="text-sm text-text-primary">
                Failed Login Limit
              </label>
              <select
                name="failedLoginLimit"
                value={formData.failedLoginLimit || 5}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-background disabled:text-text-muted font-medium"
              >
                <option value="3">3 Attempts</option>
                <option value="5">5 Attempts</option>
                <option value="10">10 Attempts</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-text-primary">Lock Duration</label>
              <select
                name="lockDuration"
                value={formData.lockDuration || "15m"}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:bg-surface-background disabled:text-text-muted font-medium"
              >
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-border mt-8">
        <h3 className="text-sm font-bold text-error flex items-center mb-2">
          <ShieldAlert className="w-4 h-4 mr-1" /> Danger Zone
        </h3>
        <Button variant="danger" onClick={handleForceLogout}>
          Force Logout All Users
        </Button>
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

export default SecurityTab;
