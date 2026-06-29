import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Save, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useBrandingStore } from '../../../store/brandingStore';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const BrandingTab = () => {
  const { branding, loading, uploading, fetchBranding, updateBranding, uploadLogo, uploadEmailLogo } = useBrandingStore();
  const [platformName, setPlatformName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);
  const [selectedEmailFile, setSelectedEmailFile] = useState(null);
  const emailFileInputRef = useRef(null);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  useEffect(() => {
    if (branding) {
      setPlatformName(branding.platformName || '');
      setPreviewUrl(branding.logoUrl || null);
      setEmailPreviewUrl(branding.emailLogoUrl || null);
    }
  }, [branding]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo size must be less than 2 MB.');
      fileInputRef.current.value = '';
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only PNG and JPG images are allowed.');
      fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleEmailFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Email Logo size must be less than 2 MB.');
      emailFileInputRef.current.value = '';
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only PNG and JPG images are allowed.');
      emailFileInputRef.current.value = '';
      return;
    }

    setSelectedEmailFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEmailPreviewUrl(objectUrl);
  };

  const handleEmailUploadClick = () => {
    emailFileInputRef.current?.click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Update name if changed
      if (platformName !== branding.platformName) {
        await updateBranding({ platformName });
      }

      // Upload new logo if selected
      if (selectedFile) {
        await uploadLogo(selectedFile);
        setSelectedFile(null); // Reset after upload
      }

      // Upload new email logo if selected
      if (selectedEmailFile) {
        await uploadEmailLogo(selectedEmailFile);
        setSelectedEmailFile(null); // Reset after upload
      }

      toast.success('Branding settings saved successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update branding.');
    }
  };

  if (loading && !branding) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text-brand-700">Branding Settings</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your platform's name and global logo. These changes reflect instantly across the entire application.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="bg-surface-background p-6 rounded-xl border border-border space-y-6">
          <Input
            label="Platform Name"
            name="platformName"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            placeholder="e.g. LuxeHome"
            required
            helperText="This name will appear in emails, document titles, and fallback text."
          />

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-text-brand-600">Platform Logo</label>
            <div className="flex items-start space-x-6">
              <div 
                className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={handleUploadClick}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium">No logo</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUploadClick}
                  className="w-full flex justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Allowed formats: JPG, PNG</p>
                  <p>• Maximum size: 2 MB</p>
                  <p>• Recommended dimensions: 512x512 px</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-background p-6 rounded-xl border border-border space-y-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-text-brand-600">Email Logo</label>
              <p className="text-xs text-text-secondary mt-1">This logo will be used in transactional and marketing emails.</p>
            </div>
            <div className="flex items-start space-x-6">
              <div 
                className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={handleEmailUploadClick}
              >
                {emailPreviewUrl ? (
                  <img src={emailPreviewUrl} alt="Email Logo preview" className="max-w-full max-h-full object-contain p-2" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium">No logo</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  ref={emailFileInputRef}
                  onChange={handleEmailFileSelect}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEmailUploadClick}
                  className="w-full flex justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Email Image
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Allowed formats: JPG, PNG</p>
                  <p>• Maximum size: 2 MB</p>
                  <p>• Recommended dimensions: 600x180 px</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            isLoading={uploading} 
            disabled={uploading || (!selectedFile && !selectedEmailFile && platformName === branding?.platformName)}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BrandingTab;
