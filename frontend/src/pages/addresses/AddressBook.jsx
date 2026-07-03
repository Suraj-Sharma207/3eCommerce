import React, { useEffect, useState, useMemo } from 'react';
import useAddressStore from '../../store/addressStore';
import useConfirmStore from '../../store/confirmStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PhoneInput from '../../components/ui/PhoneInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, AlertCircle, Navigation } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { COUNTRIES } from '../../utils/constants';
import { validateName, validatePhone, validateRequired, sanitizeNumeric } from '../../utils/validators';
import { normalizeAddress } from '../../utils/addressMapper';
import toast from 'react-hot-toast';

const AddressBook = () => {
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, isLoading, error: backendError } = useAddressStore();
  const { confirm } = useConfirmStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [initialAddress, setInitialAddress] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddNew = () => {
    const emptyAddress = {
      recipientName: '', phoneNumber: '', label: 'Home',
      street: '', addressLine2: '', landmark: '', 
      city: '', state: '', zipCode: '', country: 'India',
      isDefaultShipping: false, isDefaultBilling: false
    };
    setCurrentAddress(emptyAddress);
    setInitialAddress(emptyAddress);
    setFormErrors({});
    setIsEditing(true);
  };

  const handleEdit = (address) => {
    const editData = {
      ...address,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || ''
    };
    setCurrentAddress(editData);
    setInitialAddress(editData);
    setFormErrors({});
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Address',
      description: 'Are you sure you want to delete this address? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete'
    });
    if (isConfirmed) {
      const success = await deleteAddress(id);
      if (success) {
        setGlobalMessage('Address deleted successfully.');
        await fetchAddresses();
        setTimeout(() => setGlobalMessage(''), 3000);
      }
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Unable to determine your location. Try again.');
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Network error');
          
          const data = await response.json();
          if (!data || (!data.address && !data.address_components && !data.context)) {
            throw new Error('Location found but address could not be determined.');
          }

          const normalized = normalizeAddress(data);

          if (import.meta.env.DEV) {
            const missingFields = Object.keys(normalized).filter(k => !normalized[k]);
            console.log('Raw reverse geocoding response:', data);
            console.log('Normalized address object:', normalized);
            console.log('Missing fields:', missingFields);
          }

          const newAddressData = {
            street: normalized.street || currentAddress.street || '',
            city: normalized.city || currentAddress.city || '',
            state: normalized.state || currentAddress.state || '',
            zipCode: normalized.zipCode || currentAddress.zipCode || '',
            country: normalized.country || currentAddress.country || 'India',
            addressLine2: normalized.addressLine2 || currentAddress.addressLine2 || '',
            landmark: normalized.landmark || currentAddress.landmark || ''
          };

          const willOverwrite = Object.keys(newAddressData).some(key => {
            return currentAddress[key] && currentAddress[key] !== newAddressData[key] && newAddressData[key] !== currentAddress[key];
          });

          if (willOverwrite) {
            const isConfirmed = await confirm({
              title: 'Replace Address',
              description: 'Replace the current address with your detected location?',
              confirmText: 'Replace',
              cancelText: 'Cancel'
            });
            if (!isConfirmed) {
              setIsDetectingLocation(false);
              return;
            }
          }

          setCurrentAddress(prev => {
            const next = { ...prev, ...newAddressData };
            const newErrors = { ...formErrors };
            
            // Validate all mapped fields normally
            Object.keys(newAddressData).forEach(k => {
              newErrors[k] = validateField(k, next[k], next);
            });

            // Phase 7: Explicit validation for missing required fields from auto-fill
            const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
            requiredFields.forEach(field => {
              if (!next[field] || next[field].trim() === '') {
                newErrors[field] = "Couldn't determine this field automatically. Please enter it manually.";
              }
            });

            setFormErrors(newErrors);
            return next;
          });
          
          toast.success('Location Detected');
          setIsDetectingLocation(false);

        } catch (err) {
          setIsDetectingLocation(false);
          toast.error(err.message === 'Network error' ? 'Unable to fetch address. Please check your internet connection.' : 'Location found but address could not be determined.');
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow location access.');
        } else {
          toast.error('Unable to determine your location. Try again.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };


  const validateField = (name, value, allData) => {
    let err = '';
    const val = value || '';
    switch(name) {
      case 'recipientName':
        err = validateName(val, 'Full Name');
        break;
      case 'phoneNumber':
        err = validatePhone(val);
        break;
      case 'street':
        if (!val.trim()) {
          err = 'Address Line 1 is required.';
        } else if (val.trim().length < 5) {
          err = 'Address Line 1 must be at least 5 characters.';
        } else if (val.trim().length > 200) {
          err = 'Address Line 1 cannot exceed 200 characters.';
        }
        break;
      case 'city':
        if (!val.trim()) {
          err = 'City is required.';
        } else if (val.trim().length < 2 || val.trim().length > 80) {
          err = 'City must be between 2 and 80 characters.';
        } else if (!/^[A-Za-z\s]+$/.test(val.trim())) {
          err = 'City must contain only letters.';
        }
        break;
      case 'state':
        if (!val.trim()) {
          err = 'State is required.';
        } else if (val.trim().length < 2 || val.trim().length > 80) {
          err = 'State must be between 2 and 80 characters.';
        } else if (!/^[A-Za-z\s]+$/.test(val.trim())) {
          err = 'State must contain only letters.';
        }
        break;
      case 'country':
        err = validateRequired(val, 'Country');
        break;
      case 'zipCode':
        if (!val.trim()) {
          err = 'Postal Code is required.';
        } else if (val.trim().length > 20) {
          err = 'Postal Code cannot exceed 20 characters.';
        } else if (allData.country === 'India' && !/^\d{6}$/.test(val.trim())) {
          err = 'India requires a valid 6-digit PIN code.';
        }
        break;
      case 'addressLine2':
        if (val.trim() && val.trim().length > 200) {
          err = 'Address Line 2 cannot exceed 200 characters.';
        }
        break;
      case 'landmark':
        if (val.trim() && val.trim().length > 100) {
          err = 'Landmark cannot exceed 100 characters.';
        }
        break;
      default:
        break;
    }
    return err;
  };

  const isFormValid = useMemo(() => {
    if (!currentAddress) return false;
    const requiredFields = ['recipientName', 'phoneNumber', 'street', 'city', 'state', 'country', 'zipCode'];
    for (const field of requiredFields) {
      if (validateField(field, currentAddress[field], currentAddress)) return false;
    }
    if (validateField('addressLine2', currentAddress.addressLine2, currentAddress)) return false;
    if (validateField('landmark', currentAddress.landmark, currentAddress)) return false;
    return true;
  }, [currentAddress]);

  const isDirty = useMemo(() => {
    if (!currentAddress || !initialAddress) return false;
    return JSON.stringify(currentAddress) !== JSON.stringify(initialAddress);
  }, [currentAddress, initialAddress]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid || !isDirty) return;

    // Full validation check
    const newErrors = {};
    Object.keys(currentAddress).forEach(key => {
      const err = validateField(key, currentAddress[key], currentAddress);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    const dataToSave = {
      ...currentAddress,
      recipientName: currentAddress.recipientName.trim().replace(/\s+/g, ' '),
      phoneNumber: currentAddress.phoneNumber.trim(),
      street: currentAddress.street.trim(),
      addressLine2: currentAddress.addressLine2.trim() || null,
      landmark: currentAddress.landmark.trim() || null,
      city: currentAddress.city.trim().replace(/\s+/g, ' '),
      state: currentAddress.state.trim().replace(/\s+/g, ' '),
      zipCode: currentAddress.zipCode.trim(),
      country: currentAddress.country.trim(),
    };

    let success;
    if (currentAddress.id) {
      success = await updateAddress(currentAddress.id, dataToSave);
      if (success) setGlobalMessage('Address updated successfully.');
    } else {
      success = await addAddress(dataToSave);
      if (success) setGlobalMessage('Address saved successfully.');
    }

    if (success) {
      setIsEditing(false);
      setCurrentAddress(null);
      await fetchAddresses();
      setTimeout(() => setGlobalMessage(''), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let sanitizedValue = value;
    if (name === 'phoneNumber') {
      // PhoneInput handles E.164 formatting
      sanitizedValue = value;
    } else if (name === 'city' || name === 'state') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
    } else if (name === 'recipientName') {
      sanitizedValue = value.replace(/[^A-Za-z\s'\-]/g, '');
    } else if (name === 'zipCode') {
      if (currentAddress.country === 'India') {
        sanitizedValue = sanitizeNumeric(value).slice(0, 6);
      } else {
        sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
      }
    }

    setCurrentAddress(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : sanitizedValue
      };
      
      // Clear error on change
      setFormErrors(prevErrs => ({
        ...prevErrs,
        [name]: ''
      }));
      
      // If country changed, re-validate zipcode
      if (name === 'country') {
        const zipErr = validateField('zipCode', next.zipCode, next);
        setFormErrors(prevErrs => ({ ...prevErrs, zipCode: zipErr }));
      }
      
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    // Real time validation on blur
    const err = validateField(name, type === 'checkbox' ? checked : value, currentAddress);
    setFormErrors(prevErrs => ({
      ...prevErrs,
      [name]: err
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentAddress(null);
    setFormErrors({});
  };

  const getFieldStatus = (name) => {
    if (!currentAddress) return { error: null, isValid: false };
    const err = formErrors[name];
    const val = currentAddress[name];
    // Only show valid state if there's actually a value and no error
    const isValid = !err && val !== undefined && val !== null && String(val).trim().length > 0;
    return { error: err, isValid };
  };

  if (isLoading && addresses.length === 0 && !isEditing) {
    return <div className="p-12 flex justify-center font-normal"><LoadingSpinner /></div>;
  }

  return (
    <PageContainer className="py-8 lg:py-12 max-w-5xl space-y-8 font-normal">
      {globalMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 font-normal">
          <CheckCircle2 className="w-5 h-5 font-normal" />
          {globalMessage}
        </div>
      )}
      
      {backendError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-normal">
          <AlertCircle className="w-5 h-5 font-normal" />
          {backendError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-normal">
        <div>
          <h1 className="text-3xl text-text-primary font-bold">Address Book</h1>
          <p className="text-text-muted mt-2 font-medium">Manage your shipping and billing addresses.</p>
        </div>
        {!isEditing && (
          <Button onClick={handleAddNew} className="flex items-center gap-2 font-normal">
            <Plus className="w-4 h-4 font-normal" /> Add New Address
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden font-normal">
          <div className="p-6 sm:p-8 border-b border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-normal">
            <h2 className="text-xl text-text-primary font-bold">
              {currentAddress.id ? 'Edit Address' : 'Add New Address'}
            </h2>
            {!currentAddress.id && (
              <button 
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-2 px-4 py-2 border-2 border-brand-600 text-brand-700 rounded-full hover:bg-brand-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-normal"
                aria-label="Use Current Location"
              >
                {isDetectingLocation ? (
                  <>
                    <LoadingSpinner size="sm" className="w-4 h-4 font-normal" />
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 font-normal" />
                    Use Current Location
                  </>
                )}
              </button>
            )}
          </div>
          <div className="p-6 sm:p-8 relative font-normal">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center font-normal">
                <LoadingSpinner size="lg" />
              </div>
            )}
            
            <form onSubmit={handleSave} className="space-y-6 font-normal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-normal">
                <Input 
                  label="Full Name" name="recipientName" 
                  value={currentAddress.recipientName} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('recipientName')} required 
                />
                <PhoneInput 
                  label="Phone Number" name="phoneNumber" 
                  value={currentAddress.phoneNumber} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('phoneNumber')} required 
                />
                
                <div className="space-y-1 font-normal">
                  <label className="block text-sm text-text-brand-600 font-normal">Label</label>
                  <select name="label" value={currentAddress.label} onChange={handleChange} className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-600 outline-none transition-all shadow-sm font-normal">
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <Input 
                  label="Address Line 1" name="street" 
                  value={currentAddress.street} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('street')} required placeholder="Street address, P.O. box, etc." 
                />
                <Input 
                  label="Address Line 2 (Optional)" name="addressLine2" 
                  value={currentAddress.addressLine2} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('addressLine2')} placeholder="Apartment, suite, unit, etc." 
                />
                <Input 
                  label="Landmark (Optional)" name="landmark" 
                  value={currentAddress.landmark} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('landmark')} placeholder="Near..." 
                />
                
                <Input 
                  label="City" name="city" 
                  value={currentAddress.city} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('city')} required 
                />
                <Input 
                  label="State/Province" name="state" 
                  value={currentAddress.state} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('state')} required 
                />
                
                <div className="space-y-1 font-normal">
                  <label className="block text-sm text-text-brand-600 font-normal">Country</label>
                  <select name="country" value={currentAddress.country} onChange={handleChange} className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-600 outline-none transition-all shadow-sm font-normal">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <Input 
                  label="Postal Code" name="zipCode" 
                  value={currentAddress.zipCode} onChange={handleChange} onBlur={handleBlur}
                  {...getFieldStatus('zipCode')} required 
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 mt-6 p-6 bg-surface-background rounded-xl border border-border-light font-normal">
                <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer font-normal">
                  <input type="checkbox" name="isDefaultShipping" checked={currentAddress.isDefaultShipping} onChange={handleChange} className="w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-600 cursor-pointer font-normal" />
                  Set as Default Shipping Address
                </label>
                <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer font-normal">
                  <input type="checkbox" name="isDefaultBilling" checked={currentAddress.isDefaultBilling} onChange={handleChange} className="w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-600 cursor-pointer font-normal" />
                  Set as Default Billing Address
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-border-light font-normal">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" disabled={!isFormValid || !isDirty} isLoading={isLoading} className="min-w-[140px] font-normal">
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-normal">
          {addresses.length > 0 ? (
            addresses.map(address => (
              <div key={address.id} className={`bg-white rounded-2xl border p-6 sm:p-8 relative group hover:shadow-md transition-shadow ${address.isDefaultShipping ? 'border-brand-200' : 'border-border'}`}>
                <div className="flex justify-between items-start mb-6 font-normal">
                  <div className="flex flex-wrap items-center gap-2 font-normal">
                    <span className="bg-border-light text-text-secondary px-3 py-1 rounded-full text-xs uppercase tracking-wider font-normal">
                      {address.label}
                    </span>
                    {address.isDefaultShipping && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs border border-green-200 font-normal">Default Shipping</span>}
                    {address.isDefaultBilling && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs border border-blue-200 font-normal">Default Billing</span>}
                  </div>
                  <div className="flex gap-2 font-normal">
                    <button onClick={() => handleEdit(address)} className="p-2 text-text-muted hover:text-brand-600 bg-surface-background hover:bg-brand-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 font-normal" />
                    </button>
                    <button onClick={() => handleDelete(address.id)} className="p-2 text-text-muted hover:text-red-600 bg-surface-background hover:bg-red-50 rounded-lg transition-colors" disabled={isLoading}>
                      <Trash2 className="w-4 h-4 font-normal" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg text-text-primary mb-2 font-bold">{address.recipientName}</h3>
                <div className="text-text-secondary text-sm space-y-1.5 font-normal">
                  <p>{address.street}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  {address.landmark && <p className="italic text-text-muted font-medium">Landmark: {address.landmark}</p>}
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                  <p className="pt-4 text-text-primary flex items-center gap-2 font-normal">
                    Phone: <span className="text-text-secondary font-normal">{address.phoneNumber}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-neutral-300 font-normal">
              <div className="w-20 h-20 bg-surface-background rounded-full flex items-center justify-center mb-6 font-normal">
                <MapPin className="w-10 h-10 text-text-muted font-medium" />
              </div>
              <h3 className="text-xl text-text-primary mb-2 font-bold">No addresses saved</h3>
              <p className="text-text-muted mb-8 max-w-sm font-medium">Add a shipping address to make your checkout experience faster and easier.</p>
              <Button onClick={handleAddNew} className="flex items-center gap-2 font-normal">
                <Plus className="w-5 h-5 font-normal" /> Add New Address
              </Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default AddressBook;
