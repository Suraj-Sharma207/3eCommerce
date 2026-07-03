import React, { useState, useRef } from 'react';
import { Upload, X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const AvatarUploader = ({ 
  currentAvatarUrl, 
  name, 
  onUpload, 
  disabled = false,
  size = 'md' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const sizes = {
    sm: 'w-[40px] h-[40px] sm:w-[48px] sm:h-[48px]',
    md: 'w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]',
    lg: 'w-[80px] h-[80px] md:w-[100px] md:h-[100px] lg:w-[120px] lg:h-[120px]'
  };

  const getInitials = (n) => n?.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5 MB.');
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
    if (!file || !validateFile(file)) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleCancel = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!previewFile) return;
    setIsUploading(true);
    try {
      await onUpload(previewFile);
      handleCancel(); // clear preview state on success since parent updates currentAvatarUrl
      toast.success('Profile photo updated successfully.');
    } catch (error) {
      toast.error(error.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4 w-full font-normal">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleChange}
        className="hidden font-normal"
        disabled={disabled || isUploading}
      />
      
      <div 
        className={`relative group shrink-0 ${sizes[size]} rounded-full overflow-hidden border-2 shadow-sm cursor-pointer transition-all duration-200 ${dragActive ? 'scale-105 border-brand-500 ring-4 ring-brand-100' : 'border-border hover:border-brand-300 hover:shadow-md'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
      >
        {displayUrl ? (
          <img 
            src={displayUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover aspect-square font-normal" 
          />
        ) : (
          <div className="w-full h-full bg-brand-50 text-brand-600 flex items-center justify-center text-3xl font-normal">
            {getInitials(name)}
          </div>
        )}

        {!disabled && !isUploading && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white transition-opacity duration-200 ${previewFile ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
            <Camera className="w-6 h-6 mb-1 font-normal" />
            <span className="text-[10px] uppercase tracking-wider font-normal">Change Photo</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm font-normal">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin font-normal" />
          </div>
        )}
      </div>

      {previewFile && (
        <div className="w-full max-w-[320px] bg-white border border-border rounded-xl p-4 flex flex-col items-center shadow-sm animate-in zoom-in-95 duration-200 font-normal">
          <div className="flex items-center gap-2 text-text-primary mb-1 font-normal">
            <AlertCircle className="w-4 h-4 text-amber-500 font-normal" />
            Unsaved changes
          </div>
          <p className="text-xs text-text-secondary text-center mb-4 font-normal">Your new profile photo is ready to be saved.</p>
          <div className="flex gap-3 w-full font-normal">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isUploading} className="flex-1 text-sm py-2 font-normal">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} isLoading={isUploading} className="flex-1 text-sm py-2 font-normal">
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;
