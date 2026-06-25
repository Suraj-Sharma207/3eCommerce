import React, { useEffect, useState, useMemo } from 'react';
import useAddressStore from '../../store/addressStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { COUNTRIES } from '../../utils/constants';

const AddressBook = () => {
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, isLoading, error: backendError } = useAddressStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [initialAddress, setInitialAddress] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState('');

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
    if (window.confirm('Are you sure you want to delete this address?')) {
      const success = await deleteAddress(id);
      if (success) {
        setGlobalMessage('Address deleted successfully.');
        await fetchAddresses();
        setTimeout(() => setGlobalMessage(''), 3000);
      }
    }
  };

  const validateField = (name, value, allData) => {
    let err = null;
    const val = value || '';
    switch(name) {
      case 'recipientName':
        if (!val.trim()) err = 'Full Name is required';
        else if (val.length < 2) err = 'Minimum 2 characters';
        else if (val.length > 100) err = 'Maximum 100 characters';
        else if (!/^[A-Za-z\s'\-]+$/.test(val)) err = 'Only letters, spaces, hyphens, and apostrophes allowed';
        break;
      case 'phoneNumber':
        if (!val.trim()) err = 'Phone Number is required';
        else if (!/^[+\-\s0-9]{7,15}$/.test(val)) err = 'Enter a valid phone number (7-15 digits)';
        break;
      case 'street':
        if (!val.trim()) err = 'Address Line 1 is required';
        else if (val.length < 5) err = 'Minimum 5 characters';
        else if (val.length > 200) err = 'Maximum 200 characters';
        break;
      case 'city':
        if (!val.trim()) err = 'City is required';
        else if (val.length < 2) err = 'Minimum 2 characters';
        else if (val.length > 80) err = 'Maximum 80 characters';
        else if (!/^[A-Za-z\s]+$/.test(val)) err = 'Only letters and spaces allowed';
        break;
      case 'state':
        if (!val.trim()) err = 'State is required';
        else if (val.length < 2) err = 'Minimum 2 characters';
        else if (val.length > 80) err = 'Maximum 80 characters';
        else if (!/^[A-Za-z\s]+$/.test(val)) err = 'Only letters and spaces allowed';
        break;
      case 'country':
        if (!val.trim()) err = 'Country is required';
        break;
      case 'zipCode':
        if (!val.trim()) err = 'Postal Code is required';
        else if (val.length > 20) err = 'Maximum 20 characters';
        else if (allData.country === 'India' && !/^\d{6}$/.test(val)) err = 'India requires a valid 6-digit PIN code';
        break;
      case 'addressLine2':
        if (val && val.length > 200) err = 'Maximum 200 characters';
        break;
      case 'landmark':
        if (val && val.length > 100) err = 'Maximum 100 characters';
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
    if (name === 'phoneNumber') sanitizedValue = value.replace(/[^\d+\-\s]/g, '');
    if (name === 'city' || name === 'state') sanitizedValue = value.replace(/[^A-Za-z\s]/g, '');
    if (name === 'recipientName') sanitizedValue = value.replace(/[^A-Za-z\s'\-]/g, '');
    if (name === 'zipCode' && currentAddress.country === 'India') sanitizedValue = value.replace(/[^\d]/g, '').slice(0, 6);

    setCurrentAddress(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : sanitizedValue
      };
      
      // Real time validation
      const err = validateField(name, type === 'checkbox' ? checked : sanitizedValue, next);
      setFormErrors(prevErrs => ({
        ...prevErrs,
        [name]: err
      }));
      
      // If country changed, re-validate zipcode
      if (name === 'country') {
        const zipErr = validateField('zipCode', next.zipCode, next);
        setFormErrors(prevErrs => ({ ...prevErrs, zipCode: zipErr }));
      }
      
      return next;
    });
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
    return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <PageContainer className="py-8 lg:py-12 max-w-5xl space-y-8">
      {globalMessage && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl font-medium border border-green-200">
          <CheckCircle2 className="w-5 h-5" />
          {globalMessage}
        </div>
      )}
      
      {backendError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl font-medium border border-red-200">
          <AlertCircle className="w-5 h-5" />
          {backendError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-medium text-neutral-900">Address Book</h1>
          <p className="text-neutral-500 mt-2">Manage your shipping and billing addresses.</p>
        </div>
        {!isEditing && (
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add New Address
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="text-xl font-medium text-neutral-900">
              {currentAddress.id ? 'Edit Address' : 'Add New Address'}
            </h2>
          </div>
          <div className="p-6 sm:p-8 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Full Name" name="recipientName" 
                  value={currentAddress.recipientName} onChange={handleChange} 
                  {...getFieldStatus('recipientName')} required 
                />
                <Input 
                  label="Phone Number" name="phoneNumber" 
                  value={currentAddress.phoneNumber} onChange={handleChange} 
                  {...getFieldStatus('phoneNumber')} required placeholder="+1 234 567 8900" 
                />
                
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-text-primary">Label</label>
                  <select name="label" value={currentAddress.label} onChange={handleChange} className="w-full px-4 py-3 bg-surface border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm">
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <Input 
                  label="Address Line 1" name="street" 
                  value={currentAddress.street} onChange={handleChange} 
                  {...getFieldStatus('street')} required placeholder="Street address, P.O. box, etc." 
                />
                <Input 
                  label="Address Line 2 (Optional)" name="addressLine2" 
                  value={currentAddress.addressLine2} onChange={handleChange} 
                  {...getFieldStatus('addressLine2')} placeholder="Apartment, suite, unit, etc." 
                />
                <Input 
                  label="Landmark (Optional)" name="landmark" 
                  value={currentAddress.landmark} onChange={handleChange} 
                  {...getFieldStatus('landmark')} placeholder="Near..." 
                />
                
                <Input 
                  label="City" name="city" 
                  value={currentAddress.city} onChange={handleChange} 
                  {...getFieldStatus('city')} required 
                />
                <Input 
                  label="State/Province" name="state" 
                  value={currentAddress.state} onChange={handleChange} 
                  {...getFieldStatus('state')} required 
                />
                
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-text-primary">Country</label>
                  <select name="country" value={currentAddress.country} onChange={handleChange} className="w-full px-4 py-3 bg-surface border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm">
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <Input 
                  label="Postal Code" name="zipCode" 
                  value={currentAddress.zipCode} onChange={handleChange} 
                  {...getFieldStatus('zipCode')} required 
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 mt-6 p-6 bg-neutral-50 rounded-xl border border-neutral-100">
                <label className="flex items-center gap-3 text-sm font-medium text-neutral-900 cursor-pointer">
                  <input type="checkbox" name="isDefaultShipping" checked={currentAddress.isDefaultShipping} onChange={handleChange} className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
                  Set as Default Shipping Address
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-neutral-900 cursor-pointer">
                  <input type="checkbox" name="isDefaultBilling" checked={currentAddress.isDefaultBilling} onChange={handleChange} className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
                  Set as Default Billing Address
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" disabled={!isFormValid || !isDirty} isLoading={isLoading} className="min-w-[140px]">
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {addresses.length > 0 ? (
            addresses.map(address => (
              <div key={address.id} className={`bg-white rounded-2xl border p-6 sm:p-8 relative group hover:shadow-md transition-shadow ${address.isDefaultShipping ? 'border-primary-200' : 'border-neutral-200'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      {address.label}
                    </span>
                    {address.isDefaultShipping && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">Default Shipping</span>}
                    {address.isDefaultBilling && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">Default Billing</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(address)} className="p-2 text-neutral-500 hover:text-primary-600 bg-neutral-50 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(address.id)} className="p-2 text-neutral-500 hover:text-red-600 bg-neutral-50 hover:bg-red-50 rounded-lg transition-colors" disabled={isLoading}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg text-neutral-900 mb-2">{address.recipientName}</h3>
                <div className="text-neutral-600 text-sm space-y-1.5">
                  <p>{address.street}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  {address.landmark && <p className="italic text-neutral-500">Landmark: {address.landmark}</p>}
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                  <p className="pt-4 text-neutral-800 flex items-center gap-2 font-medium">
                    Phone: <span className="text-neutral-600 font-normal">{address.phoneNumber}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-neutral-300">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-medium text-neutral-900 mb-2">No addresses saved</h3>
              <p className="text-neutral-500 mb-8 max-w-sm">Add a shipping address to make your checkout experience faster and easier.</p>
              <Button onClick={handleAddNew} className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add New Address
              </Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default AddressBook;
