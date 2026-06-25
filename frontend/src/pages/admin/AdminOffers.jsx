import React, { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Calendar, Percent } from 'lucide-react';
import usePromotionStore from '../../store/promotionStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const AdminOffers = () => {
  const { promotions, isLoading, fetchPromotions, createPromotion, updatePromotion, deletePromotion } = usePromotionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    name: '',
    description: '',
    type: 'PERCENTAGE_DISCOUNT',
    status: 'DRAFT',
    priority: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    applyTo: 'STORE',
    discountValue: 0,
    categories: '',
    brands: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingId(promo.id);
      setFormData({
        ...promo,
        startDate: promo.startDate.split('T')[0],
        endDate: promo.endDate.split('T')[0],
        categories: promo.categories?.map(c => c.category).join(', ') || '',
        brands: promo.brands?.map(b => b.brand).join(', ') || ''
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      categories: formData.categories ? formData.categories.split(',').map(c => c.trim()) : [],
      brands: formData.brands ? formData.brands.split(',').map(b => b.trim()) : []
    };

    const success = editingId 
      ? await updatePromotion(editingId, payload)
      : await createPromotion(payload);
      
    if (success) {
      toast.success(`Campaign ${editingId ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const success = await deletePromotion(id);
      if (success) toast.success('Campaign deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-brand-600 flex items-center gap-2">
          <Tag className="w-6 h-6" /> Offers & Promotions
        </h1>
        <Button onClick={() => handleOpenModal()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">Loading campaigns...</div>
        ) : promotions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Tag className="w-12 h-12 text-text-muted mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-text-primary">No Active Campaigns</h3>
            <p className="text-text-muted mt-2">Create a new promotion to boost your sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-background text-text-muted text-xs uppercase font-bold tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-surface-background transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{promo.name}</div>
                      <div className="text-xs text-text-muted">{promo.type} • {promo.applyTo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        promo.status === 'ENABLED' ? 'bg-green-100 text-green-800' :
                        promo.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {promo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{promo.priority}</td>
                    <td className="px-6 py-4 font-bold text-brand-600">
                      {promo.type === 'PERCENTAGE_DISCOUNT' ? `${promo.discountValue}%` : `Flat ${promo.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                      <div>{new Date(promo.startDate).toLocaleDateString()}</div>
                      <div className="text-xs text-text-muted">to {new Date(promo.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(promo)} className="p-2 text-text-muted hover:text-brand-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="p-2 text-text-muted hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Campaign' : 'Create Campaign'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Campaign Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-primary">Status</label>
              <select className="w-full px-4 py-3 rounded-[12px] border border-border" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="DRAFT">Draft</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-primary">Type</label>
              <select className="w-full px-4 py-3 rounded-[12px] border border-border" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                <option value="FLAT_DISCOUNT">Flat Discount</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} required />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-primary">Apply To</label>
              <select className="w-full px-4 py-3 rounded-[12px] border border-border" value={formData.applyTo} onChange={(e) => setFormData({...formData, applyTo: e.target.value})}>
                <option value="STORE">Entire Store</option>
                <option value="CATEGORY">Specific Categories</option>
                <option value="BRAND">Specific Brands</option>
              </select>
            </div>
            <Input label="Priority (Higher = applied first)" type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} />

            <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
            <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required />
            
            {formData.applyTo === 'CATEGORY' && (
              <div className="col-span-2">
                <Input label="Categories (Comma separated)" value={formData.categories} onChange={(e) => setFormData({...formData, categories: e.target.value})} placeholder="Living Room, Bedroom" />
              </div>
            )}
            {formData.applyTo === 'BRAND' && (
              <div className="col-span-2">
                <Input label="Brands (Comma separated)" value={formData.brands} onChange={(e) => setFormData({...formData, brands: e.target.value})} placeholder="FurnitureCo, LuxeDesign" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Save Campaign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminOffers;
