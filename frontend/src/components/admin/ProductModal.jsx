import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Lock, Upload, Star, Trash2, GripVertical, ImageOff, CheckCircle, AlertCircle, Loader2, Crop as CropIcon } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PRODUCT_CATEGORIES } from '../../constants/productCategories';
import { validateProductInput } from '../../utils/productValidation';
import { sanitizeNumeric, sanitizeDecimal } from '../../utils/validators';
import useProductStore from '../../store/productStore';

// ── Image Manager Sub-component ──────────────────────────────────────────────

const ImageManager = ({ product }) => {
  // Read images directly from the live store so they stay fresh after every mutation
  const storeImages = useProductStore(
    (state) => state.products.find(p => p.id === product?.id)?.images ?? product?.images ?? []
  );
  const { uploadProductImages, deleteProductImage, setPrimaryImage, reorderImages } = useProductStore();

  // Local reorder-only state — reorder is purely visual until API confirms
  const [orderedImages, setOrderedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null | number
  const [uploadError, setUploadError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const fileInputRef = useRef(null);

  // Cropper state
  const [cropFiles, setCropFiles] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  const [croppedBlobs, setCroppedBlobs] = useState([]);
  const imgRef = useRef(null);

  useEffect(() => {
    if (cropFiles.length > 0 && currentCropIndex < cropFiles.length) {
      const file = cropFiles[currentCropIndex];
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      setCrop(null); // Reset crop for new image
      return () => URL.revokeObjectURL(url);
    }
  }, [cropFiles, currentCropIndex]);

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), // 1:1 aspect ratio
      width, height
    );
    setCrop(initialCrop);
  };

  const handleFinalizeCrop = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) return;
    
    // Generate cropped blob
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width, canvas.height
    );
    
    const file = cropFiles[currentCropIndex];
    const blob = await new Promise(resolve => canvas.toBlob(resolve, file.type, 1));
    const newFile = new File([blob], file.name, { type: file.type });
    
    const nextBlobs = [...croppedBlobs, newFile];
    
    if (currentCropIndex + 1 < cropFiles.length) {
      setCroppedBlobs(nextBlobs);
      setCurrentCropIndex(prev => prev + 1);
    } else {
      // Finished cropping all files, now upload them
      setCropFiles([]);
      setImgSrc('');
      
      setUploadProgress(0);
      const result = await uploadProductImages(product.id, nextBlobs, setUploadProgress);
      setUploadProgress(null);
      if (result.success) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(result.message || 'Upload failed');
      }
    }
  };

  // Keep ordered list in sync with store whenever store images change
  useEffect(() => {
    setOrderedImages([...storeImages].sort((a, b) => a.displayOrder - b.displayOrder));
  }, [storeImages]);

  // Use orderedImages as the working list
  const images = orderedImages;

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_MB = 5;

  const validateFiles = async (files) => {
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        return `"${f.name}" has unsupported type. Allowed: JPG, PNG, WEBP`;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        return `"${f.name}" exceeds ${MAX_MB}MB limit`;
      }
      
      // Dimension validation
      const errorMsg = await new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(f);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (img.width < 1200 || img.height < 1200) {
            resolve(`"${f.name}" is ${img.width}x${img.height}. Minimum 1200x1200px required.`);
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(`"${f.name}" is not a valid image file.`);
        };
        img.src = objectUrl;
      });

      if (errorMsg) return errorMsg;
    }
    return null;
  };

  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    // Set loading state for validation
    setUploadProgress(0); 
    const validationError = await validateFiles(Array.from(files));
    if (validationError) {
      setUploadError(validationError);
      setUploadProgress(null);
      return;
    }

    setUploadProgress(null);
    setUploadError(null);
    setUploadSuccess(false);
    
    // Begin crop flow
    setCroppedBlobs([]);
    setCropFiles(Array.from(files));
    setCurrentCropIndex(0);
  }, [product.id, uploadProductImages]);

  const handleFileInputChange = (e) => {
    handleUpload(e.target.files);
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const handleDelete = async (imageId) => {
    // images.length is always fresh from the store via storeImages
    if (images.length <= 1) {
      setDeleteError('Cannot delete the only remaining image. A product must have at least one image.');
      return;
    }
    // Prevent duplicate in-flight requests
    if (deletingIds.has(imageId)) return;

    setDeleteError(null);
    setDeletingIds(prev => new Set([...prev, imageId]));
    const result = await deleteProductImage(product.id, imageId);
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(imageId);
      return next;
    });
    if (!result.success) {
      // Show the exact backend error message
      setDeleteError(result.message || 'Failed to delete image. Please try again.');
    }
  };

  const handleSetPrimary = async (imageId) => {
    setSettingPrimaryId(imageId);
    await setPrimaryImage(product.id, imageId);
    setSettingPrimaryId(null);
  };

  // ── Drag-and-drop reordering ────────────────────────────────────────────────
  const handleDragStart = (id) => setDraggedId(id);
  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop2 = async (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const current = [...images];
    const fromIdx = current.findIndex(i => i.id === draggedId);
    const toIdx = current.findIndex(i => i.id === targetId);
    const reordered = [...current];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setOrderedImages(reordered);
    setDraggedId(null);
    setDragOverId(null);
    await reorderImages(product.id, reordered.map(i => i.id));
  };

  const primaryImage = images.find(i => i.isPrimary) ?? images[0];

  return (
    <div className="space-y-4">
      {/* Primary image preview */}
      {primaryImage && (
        <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-surface-background border border-border flex items-center justify-center">
          <img
            src={primaryImage.url}
            alt="Primary"
            className="w-full h-full object-contain object-center"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            <Star className="w-3 h-3 fill-current" />
            Primary Image
          </div>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(img.id)}
              onDragOver={(e) => handleDragOver(e, img.id)}
              onDrop={(e) => handleDrop2(e, img.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-grab active:cursor-grabbing
                ${img.isPrimary ? 'border-brand-600' : 'border-border'}
                ${dragOverId === img.id ? 'border-brand-400 scale-[1.04] shadow-lg' : ''}
                ${draggedId === img.id ? 'opacity-40' : 'opacity-100'}
              `}
            >
              <div className="aspect-square bg-surface-background flex items-center justify-center">
                {img.url ? (
                  <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover object-center" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-6 h-6 text-text-muted" />
                  </div>
                )}
              </div>

              {/* Drag handle indicator */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-80 transition-opacity">
                <GripVertical className="w-4 h-4 text-white drop-shadow" />
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1 right-1 bg-brand-600 rounded-full p-0.5 shadow">
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
              )}

              {/* Hover actions overlay */}
              <div className="absolute inset-0 bg-secondary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 pb-2">
                {!img.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={!!settingPrimaryId}
                    className="p-1.5 bg-white/20 hover:bg-brand-600 rounded-lg text-white transition-colors text-xs font-medium"
                    title="Set as primary"
                  >
                    {settingPrimaryId === img.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Star className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={images.length <= 1 || deletingIds.has(img.id)}
                  className="p-1.5 bg-white/20 hover:bg-danger-600 rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={images.length <= 1 ? 'Cannot delete the only image' : 'Delete image'}
                >
                  {deletingIds.has(img.id)
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-brand-600 bg-brand-50'
            : 'border-border hover:border-brand-400 hover:bg-brand-50/40'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileInputChange}
          onClick={(e) => e.stopPropagation()}
        />

        {uploadProgress !== null ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-brand-600">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-border-light rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {isDragging ? 'Drop images here' : 'Drop images or click to upload'}
              </p>
              <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP · Max 5MB per file · Up to 10 images</p>
            </div>
          </div>
        )}
      </div>

      {/* Status messages */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 text-sm text-success-600 bg-success-50 px-4 py-2.5 rounded-xl border border-success-200">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Images uploaded successfully!
        </div>
      )}
      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-danger-600 bg-danger-50 px-4 py-2.5 rounded-xl border border-danger-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}
      {deleteError && (
        <div className="flex items-center gap-2 text-sm text-danger-600 bg-danger-50 px-4 py-2.5 rounded-xl border border-danger-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {deleteError}
        </div>
      )}

      <p className="text-xs text-text-muted">
        Drag thumbnails to reorder. Star icon = primary image shown on storefront.
      </p>

      {/* Cropper Modal Overlay */}
      {cropFiles.length > 0 && imgSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-screen">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Crop Image</h3>
                <p className="text-sm text-text-muted">
                  Image {currentCropIndex + 1} of {cropFiles.length} ({cropFiles[currentCropIndex].name})
                </p>
              </div>
              <button 
                onClick={() => { setCropFiles([]); setImgSrc(''); }}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 bg-surface-background overflow-auto flex flex-col items-center justify-center min-h-[300px]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                className="max-h-[60vh]"
              >
                <img 
                  ref={imgRef}
                  src={imgSrc} 
                  alt="Crop preview" 
                  onLoad={onImageLoad}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </ReactCrop>
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between bg-surface-background">
              <p className="text-xs text-text-muted">Drag to adjust the 1:1 square crop area.</p>
              <Button onClick={handleFinalizeCrop}>
                {currentCropIndex + 1 < cropFiles.length ? 'Crop & Next' : 'Crop & Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main ProductModal Component ───────────────────────────────────────────────

const ProductModal = ({ isOpen, onClose, product, onSave, isLoading }) => {
  const isEditing = !!product;
  const [activeTab, setActiveTab] = useState('details');

  const defaultState = {
    name: '',
    brand: '',
    category: PRODUCT_CATEGORIES[0],
    price: '',
    discountPercentage: '',
    stock: '',
    description: '',
    featured: false,
    active: true,
    trending: false,
    bestSeller: false,
    newArrival: false,
    recommended: false,
  };

  const [formData, setFormData] = useState(defaultState);
  const [initialFormData, setInitialFormData] = useState(defaultState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (product) {
        const data = {
          name: product.name || '',
          sku: product.sku || '',
          brand: product.brand || '',
          category: product.category || PRODUCT_CATEGORIES[0],
          price: product.price ? String(product.price) : '',
          discountPercentage: product.discountPercentage ? String(product.discountPercentage) : '',
          stock: product.stock !== undefined ? String(product.stock) : '',
          description: product.description || '',
          featured: product.featured || false,
          active: product.active ?? true,
          trending: product.trending || false,
          bestSeller: product.bestSeller || false,
          newArrival: product.newArrival || false,
          recommended: product.recommended || false,
        };
        setFormData(data);
        setInitialFormData(data);
        setErrors({});
        setTouched({});
        setActiveTab('details');
      } else {
        setFormData(defaultState);
        setInitialFormData(defaultState);
        setErrors({});
        setTouched({});
        setActiveTab('details');
      }
    }
  }, [product?.id, isOpen]);

  // Real-time validation
  useEffect(() => {
    if (isOpen) {
      const { errors: newErrors } = validateProductInput(formData);
      setErrors(newErrors);
    }
  }, [formData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'price') {
      finalValue = sanitizeDecimal(value);
    } else if (name === 'stock') {
      finalValue = sanitizeNumeric(value);
    } else if (name === 'discountPercentage') {
      const numericVal = sanitizeNumeric(value);
      if (numericVal !== '') {
        const intVal = parseInt(numericVal, 10);
        finalValue = intVal > 90 ? '90' : numericVal;
      } else {
        finalValue = '';
      }
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const isDirty = useMemo(() => {
    if (!isEditing) return true;
    for (const key of Object.keys(formData)) {
      if (String(formData[key]).trim() !== String(initialFormData[key]).trim()) return true;
    }
    return false;
  }, [formData, initialFormData, isEditing]);

  const isValid = Object.keys(errors).length === 0;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(`product-${firstErrorField}`);
      if (el) el.focus();
      return;
    }

    if (!isDirty && isEditing) {
      onClose();
      return;
    }

    const { sku, ...rest } = formData;
    const payload = {
      ...rest,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      discountPercentage: formData.discountPercentage !== '' ? parseInt(formData.discountPercentage, 10) : 0,
    };

    onSave(payload);
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    ...(isEditing ? [{ id: 'images', label: 'Images' }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-background">
          <h2 id="modal-title" className="text-xl font-extrabold text-text-primary">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            className="text-text-muted hover:text-text-primary transition-colors focus:outline-none rounded-lg p-1 hover:bg-border-light disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs — only shown when editing (images tab only available post-creation) */}
        {tabs.length > 1 && (
          <div className="flex border-b border-border bg-surface-background px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px
                  ${activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Details Tab */}
          {activeTab === 'details' && (
            <form id="product-form" onSubmit={handleSubmit} className="space-y-4">

              <div className={`grid grid-cols-1 ${isEditing ? 'sm:grid-cols-2' : ''} gap-4`}>
                <Input
                  label="Product Name"
                  id="product-name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Modern Sofa"
                  error={touched.name ? errors.name : undefined}
                  aria-invalid={touched.name && !!errors.name}
                />
                {isEditing && (
                  <div className="flex flex-col gap-1.5 relative group">
                    <label className="text-sm font-semibold text-text-primary">SKU</label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={formData.sku || ''}
                        className="w-full h-[48px] px-4 pl-11 rounded-[12px] text-base border border-border bg-surface-background text-text-muted cursor-not-allowed"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    </div>
                    <div className="absolute top-full left-0 mt-2 w-max max-w-xs bg-secondary-900 text-white text-xs rounded py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      System-generated SKU. This identifier cannot be modified.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-primary" htmlFor="product-category">
                    Category
                    <span className="text-danger-600 ml-0.5">*</span>
                  </label>
                  <select
                    id="product-category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`
                      w-full h-[48px] px-4 rounded-[12px] text-base transition-all duration-200
                      border border-border bg-surface text-text-primary
                      focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600
                      ${touched.category && errors.category ? 'border-danger-600 focus:ring-danger-600 focus:border-danger-600' : ''}
                    `}
                    aria-invalid={touched.category && !!errors.category}
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {touched.category && errors.category && (
                    <span className="text-xs text-danger-600 mt-1">{errors.category}</span>
                  )}
                </div>
                <Input
                  label="Brand"
                  id="product-brand"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. FurnitureCo"
                  error={touched.brand ? errors.brand : undefined}
                  aria-invalid={touched.brand && !!errors.brand}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Price (₹)"
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  error={touched.price ? errors.price : undefined}
                  aria-invalid={touched.price && !!errors.price}
                />
                <Input
                  label="Discount (%)"
                  id="product-discountPercentage"
                  name="discountPercentage"
                  type="number"
                  min="0"
                  max="90"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0"
                  error={touched.discountPercentage ? errors.discountPercentage : undefined}
                  aria-invalid={touched.discountPercentage && !!errors.discountPercentage}
                />
                <Input
                  label="Stock Quantity"
                  id="product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0"
                  error={touched.stock ? errors.stock : undefined}
                  aria-invalid={touched.stock && !!errors.stock}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="product-description">
                  Description
                  <span className="text-danger-600 ml-0.5">*</span>
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={4}
                  className={`
                    w-full px-4 py-3 rounded-[12px] border bg-surface text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 text-base resize-none
                    ${touched.description && errors.description ? 'border-danger-600 focus:ring-danger-600 focus:border-danger-600' : 'border-border'}
                  `}
                  placeholder="Product description..."
                  aria-invalid={touched.description && !!errors.description}
                />
                {touched.description && errors.description && (
                  <span className="text-xs text-danger-600 block mt-1">{errors.description}</span>
                )}
              </div>

              {/* Info callout: Images managed in Images tab */}
              {!isEditing && (
                <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
                  <Upload className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-700 font-medium">
                    After creating this product, you can upload images from the <strong>Images</strong> tab in the edit modal.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 rounded border-border focus:ring-brand-600"
                  />
                  <span className="text-sm font-medium text-text-primary">Active</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 rounded border-border focus:ring-brand-600"
                  />
                  <span className="text-sm font-medium text-text-primary">Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="trending"
                    checked={formData.trending}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 rounded border-border focus:ring-brand-600"
                  />
                  <span className="text-sm font-medium text-text-primary">Trending Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="bestSeller"
                    checked={formData.bestSeller}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 rounded border-border focus:ring-brand-600"
                  />
                  <span className="text-sm font-medium text-text-primary">Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="newArrival"
                    checked={formData.newArrival}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 rounded border-border focus:ring-brand-600"
                  />
                  <span className="text-sm font-medium text-text-primary">New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="recommended"
                    checked={formData.recommended}
                    onChange={handleChange}
                    className="w-4 h-4 text-brand-600 rounded border-border focus:ring-brand-600"
                  />
                  <span className="text-sm font-medium text-text-primary">Recommended</span>
                </label>
              </div>

            </form>
          )}

          {/* Images Tab — only available when editing */}
          {activeTab === 'images' && isEditing && (
            <ImageManager product={product} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-background flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {activeTab === 'images' ? 'Close' : 'Cancel'}
          </Button>

          {activeTab === 'details' && (
            <Button
              type="submit"
              form="product-form"
              isLoading={isLoading}
              disabled={isLoading || !isValid || (isEditing && !isDirty)}
            >
              {isLoading
                ? (isEditing ? 'Saving Changes...' : 'Creating Product...')
                : (isEditing ? 'Save Changes' : 'Create Product')
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
