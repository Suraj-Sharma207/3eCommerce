import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';

const AdminSaleBanner = () => {
  const [banners, setBanners] = useState([]);
  const [activeBanner, setActiveBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/sale-banner');
      if (response.data && response.data.success) {
        const list = response.data.data;
        setBanners(list);
        const active = list.find(b => b.isActive);
        setActiveBanner(active || null);
      }
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const validateAndSetFile = (file) => {
    if (!file) return;

    // Check size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP formats are allowed');
      return;
    }

    // Check resolution
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 1920 || img.height < 600) {
          toast.error('This image is too small. Recommended 2400×800.');
        } else {
          setSelectedFile(file);
          setPreviewUrl(e.target.result);
          toast.success('Image is valid for upload!');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await api.post('/admin/sale-banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Banner uploaded successfully');
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchBanners();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      const response = await api.put(`/admin/sale-banner/${id}`, { isActive: true });
      if (response.data && response.data.success) {
        toast.success('Banner activated successfully');
        fetchBanners();
      }
    } catch (error) {
      toast.error('Failed to activate banner');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await api.delete(`/admin/sale-banner/${id}`);
      if (response.data && response.data.success) {
        toast.success('Banner deleted successfully');
        fetchBanners();
      }
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <RefreshCw className="animate-spin text-brand-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary mb-4 uppercase tracking-wider">
          <Link to="/admin/dashboard" className="hover:text-brand-600 transition-colors">Dashboard</Link>
          <span className="text-text-muted text-[10px]">&gt;</span>
          <Link to="/admin/settings" className="hover:text-brand-600 transition-colors">Settings</Link>
          <span className="text-text-muted text-[10px]">&gt;</span>
          <span className="text-brand-600">Sale Banner</span>
        </div>
        <h1 className="text-2xl font-black text-text-brand-600 mb-1">Sale Banner Management</h1>
        <p className="text-sm text-text-secondary">Upload and manage the dynamic hero banner for the Sale Page</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-4">Upload New Banner</h2>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-brand-600 bg-brand-50' : 'border-border hover:border-brand-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <Upload className="mx-auto w-10 h-10 text-text-muted mb-2" />
                <p className="text-sm font-bold text-text-primary">Drag & drop your banner here</p>
                <p className="text-xs text-text-muted mt-1">Accepts JPG, PNG, WEBP (Max 5MB)</p>
                <p className="text-[10px] text-danger-500 font-medium mt-2">Min resolution: 1920 × 600</p>
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-text-secondary">Selected Preview:</p>
                  <div className="relative rounded-xl overflow-hidden border border-border aspect-[21/9]">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      isLoading={uploading} 
                      className="flex-1 font-bold bg-brand-600 text-white"
                    >
                      Upload & Activate
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="font-bold border border-border hover:bg-slate-50"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Existing Banners Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-4">All Uploaded Banners</h2>
            
            {banners.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No banners uploaded yet. The storefront is using the default fallback banner.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div 
                    key={banner.id} 
                    className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border transition-all ${
                      banner.isActive ? 'border-brand-600 bg-brand-50/30' : 'border-border'
                    }`}
                  >
                    <div className="w-full sm:w-48 aspect-[21/9] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-border-light">
                      <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-xs text-text-muted">Uploaded: {new Date(banner.createdAt).toLocaleDateString()}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        {banner.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active Banner
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleActivate(banner.id)}
                            className="text-xs font-bold text-text-secondary hover:text-brand-600 bg-white border border-border hover:border-brand-300 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(banner.id)}
                      className="p-2.5 text-text-muted hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-colors self-center"
                      title="Delete banner"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center gap-2 font-bold">
          <Eye className="w-5 h-5" /> Active Live Banner Preview (Storefront Render Ratio)
        </div>
        <div className="bg-surface-background p-4 sm:p-8">
          <div className="w-full h-[160px] sm:h-[260px] md:h-[320px] lg:h-[380px] overflow-hidden rounded-[24px] border border-border shadow-md">
            <img 
              src={activeBanner ? activeBanner.image : '/images/sale_banner.png'} 
              alt="Active Sale Banner" 
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />
          </div>
          {!activeBanner && (
            <p className="text-xs text-text-muted text-center mt-3 font-semibold">
              Currently using the fallback local banner image.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSaleBanner;
