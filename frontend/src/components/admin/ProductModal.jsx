import React, { useState, useEffect, useMemo } from 'react';
import { X, Lock } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PRODUCT_CATEGORIES } from '../../constants/productCategories';
import { validateProductInput } from '../../utils/productValidation';
import { sanitizeNumeric, sanitizeDecimal } from '../../utils/validators';

const ProductModal = ({ isOpen, onClose, product, onSave, isLoading }) => {
  const isEditing = !!product;
  
  const defaultState = {
    name: '',
    brand: '',
    category: PRODUCT_CATEGORIES[0],
    price: '',
    discountPercentage: '',
    stock: '',
    description: '',
    thumbnail: '',
    featured: false,
    active: true,
  };

  const [formData, setFormData] = useState(defaultState);
  const [initialFormData, setInitialFormData] = useState(defaultState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (product && isOpen) {
      const data = {
        name: product.name || '',
        sku: product.sku || '',
        brand: product.brand || '',
        category: product.category || PRODUCT_CATEGORIES[0],
        price: product.price ? String(product.price) : '',
        discountPercentage: product.discountPercentage ? String(product.discountPercentage) : '',
        stock: product.stock !== undefined ? String(product.stock) : '',
        description: product.description || '',
        thumbnail: product.thumbnail || '',
        featured: product.featured || false,
        active: product.active ?? true,
      };
      setFormData(data);
      setInitialFormData(data);
      setErrors({});
      setTouched({});
    } else if (isOpen) {
      setFormData(defaultState);
      setInitialFormData(defaultState);
      setErrors({});
      setTouched({});
    }
  }, [product, isOpen]);

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
        if (intVal > 90) {
          finalValue = '90';
        } else {
          finalValue = numericVal;
        }
      } else {
        finalValue = '';
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const isDirty = useMemo(() => {
    if (!isEditing) return true;
    // Compare stringified values to detect changes
    for (const key of Object.keys(formData)) {
      if (String(formData[key]).trim() !== String(initialFormData[key]).trim()) {
        return true;
      }
    }
    return false;
  }, [formData, initialFormData, isEditing]);

  const isValid = Object.keys(errors).length === 0;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all as touched on submit
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    if (!isValid) {
      // Focus first error
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(`product-${firstErrorField}`);
      if (el) el.focus();
      return;
    }

    if (!isDirty && isEditing) {
      onClose(); // No changes made, just close
      return;
    }
    
    // Transform form data to match backend schema:
    // - price and stock must be numbers (backend Zod schema requires this)
    // - strip `sku` (read-only, backend strips it but Zod middleware may reject unknown fields)
    const { sku, ...rest } = formData;
    const payload = {
      ...rest,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      discountPercentage: formData.discountPercentage !== '' ? parseInt(formData.discountPercentage, 10) : 0,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="modal-title">
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
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
                  {/* Tooltip */}
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
                label="Price ($)"
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

            <Input
              label="Thumbnail URL"
              id="product-thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com/image.jpg"
              error={touched.thumbnail ? errors.thumbnail : undefined}
              aria-invalid={touched.thumbnail && !!errors.thumbnail}
            />

            <div className="flex gap-6 pt-2">
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
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-background flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
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
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
