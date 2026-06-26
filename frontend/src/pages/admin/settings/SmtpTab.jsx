import React, { useEffect, useState } from 'react';
import useSettingsStore from '../../../store/settingsStore';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';
import { Save, X, Edit2, CheckCircle } from 'lucide-react';

const SmtpTab = () => {
  const { domains, fetchDomainSettings, updateDomainSettings, testSmtpConnection, isTestingSmtp } = useSettingsStore();
  const { data, isLoading, isSaving } = domains.smtp;
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    fetchDomainSettings('smtp');
  }, [fetchDomainSettings]);

  useEffect(() => {
    setFormData(data || {});
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setTestSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await updateDomainSettings('smtp', formData);
    if (success) {
      toast.success('SMTP settings updated.');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData(data || {});
    setIsEditing(false);
    setIsChangingPassword(false);
    setTestSuccess(false);
  };

  const handleTest = async () => {
    const res = await testSmtpConnection(formData);
    if (res.success) {
      toast.success('SMTP connection verified successfully.');
      setTestSuccess(true);
    } else {
      toast.error(res.message);
      setTestSuccess(false);
    }
  };

  if (isLoading && !Object.keys(data).length) return <div className="p-8 text-center text-text-muted">Loading SMTP settings...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary mb-1">SMTP Configuration</h3>
          <p className="text-sm text-text-muted">Configure outgoing email server for transactional emails.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input label="SMTP Host" name="host" value={formData.host || ''} onChange={handleChange} disabled={!isEditing} placeholder="smtp.gmail.com" />
        <Input label="SMTP Port" name="port" type="number" value={formData.port || ''} onChange={handleChange} disabled={!isEditing} placeholder="587" />
        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer mt-2">
            <input
              type="checkbox" name="secure"
              checked={formData.secure || false} onChange={handleChange}
              disabled={!isEditing}
              className="w-5 h-5 text-brand-600 rounded border-border focus:ring-brand-600 disabled:opacity-50"
            />
            <div className="font-semibold text-text-primary text-sm">Use Secure Connection (SSL/TLS).</div>
          </label>
        </div>
        <Input label="From Email" name="fromEmail" type="email" value={formData.fromEmail || ''} onChange={handleChange} disabled={!isEditing} placeholder="noreply@yourstore.com" />
        <Input label="SMTP Username" name="user" value={formData.user || ''} onChange={handleChange} disabled={!isEditing} placeholder="user@example.com" />

        <div className="sm:col-span-1">
          <label className="block text-sm font-semibold text-text-primary mb-1">SMTP Password</label>
          {data.passwordConfigured && !isChangingPassword ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 w-fit px-3 py-1 rounded border border-green-200">
                <CheckCircle className="w-4 h-4" /> SMTP Password Configured.
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-bg-input px-3 py-2 rounded border border-border text-text-primary flex-1 font-mono">
                  ••••••••••••••
                </div>
                {isEditing && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                    Change Password
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={data.passwordConfigured ? "Leave blank to keep existing password." : "Enter SMTP Password."}
              />
              {isEditing && data.passwordConfigured && isChangingPassword && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsChangingPassword(false)} className="w-fit">
                  Cancel Password Change
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border mt-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" onClick={handleTest} isLoading={isTestingSmtp} disabled={!formData.host || !formData.user}>
            {isTestingSmtp ? 'Testing SMTP Connection...' : 'Send Test Email'}
          </Button>
          {testSuccess && <span className="text-green-600 flex items-center text-sm font-bold"><CheckCircle className="w-4 h-4 mr-1" /> Connection verified</span>}
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

export default SmtpTab;

// trigger rebuild