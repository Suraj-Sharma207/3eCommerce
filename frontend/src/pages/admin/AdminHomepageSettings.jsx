import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Reorder } from 'framer-motion';
import { GripVertical, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ProductCard from '../../components/products/ProductCard';
import SectionHeader from '../../components/layout/SectionHeader';
import PageContainer from '../../components/layout/PageContainer';

const AdminHomepageSettings = () => {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const [fRes, tRes, nRes, sRes, bRes] = await Promise.all([
        api.get('/home/featured?limit=12'),
        api.get('/home/trending?limit=8'),
        api.get('/home/new-arrivals?limit=8'),
        api.get('/home/special-offers?limit=8'),
        api.get('/home/best-sellers?limit=8')
      ]);
      setFeatured(fRes.data);
      setTrending(tRes.data);
      setNewArrivals(nRes.data);
      setSpecialOffers(sRes.data);
      setBestSellers(bRes.data);
    } catch (error) {
      toast.error('Failed to load homepage sections');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSaveFeaturedOrder = async () => {
    setSaving(true);
    try {
      const payload = featured.map((p, index) => ({ id: p.id, homepageOrder: index }));
      await api.put('/home/featured/order', { products: payload });
      toast.success('Featured order saved successfully');
    } catch (error) {
      toast.error('Failed to save order');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-text-brand-600" /></div>;

  return (
    <div className="p-8 space-y-12 h-full overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-brand-600 mb-2">Homepage Sections</h1>
        <p className="text-text-primary-light">Manage and preview homepage content dynamically</p>
      </div>

      {/* Featured Collection Management */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Featured Collection (Drag & Drop)</h2>
          <Button onClick={handleSaveFeaturedOrder} isLoading={saving} className="flex items-center gap-2">
            <Save size={16} /> Save Order
          </Button>
        </div>
        <p className="text-sm text-text-primary-light mb-4">Reorder products to control how they appear on the homepage.</p>
        
        <Reorder.Group axis="y" values={featured} onReorder={setFeatured} className="space-y-3">
          {featured.map((product) => (
            <Reorder.Item key={product.id} value={product} className="flex items-center p-4 bg-surface-background rounded-xl border border-border-light cursor-grab active:cursor-grabbing">
              <GripVertical className="text-text-primary-light mr-4" />
              <img src={product.thumbnail || product.images?.[0]?.url} alt={product.name} className="w-12 h-12 rounded object-cover mr-4 bg-gray-100" />
              <div className="flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-text-primary-light">{product.brand}</p>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {featured.length === 0 && <p className="text-sm text-text-primary-light text-center py-4">No featured products found.</p>}
      </div>

      {/* Analytics Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-4">Best Sellers Analytics (Auto)</h2>
          <div className="space-y-4">
            {bestSellers.map((product, i) => (
              <div key={product.id} className="flex justify-between items-center pb-2 border-b border-border-light last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-text-brand-600 w-4">{i + 1}</span>
                  <p className="text-sm font-medium">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{product.totalSold} sold</p>
                  <p className="text-xs text-text-primary-light">Rev: ${(product.totalRevenue || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && <p className="text-sm text-text-primary-light">No best sellers yet.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-4">Trending Score (Auto)</h2>
          <div className="space-y-4">
            {trending.map((product, i) => (
              <div key={product.id} className="flex justify-between items-center pb-2 border-b border-border-light last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-text-brand-600 w-4">{i + 1}</span>
                  <p className="text-sm font-medium">{product.name}</p>
                </div>
                <div className="text-right text-sm text-text-primary-light">
                  <p>Views: {product.totalViews}</p>
                  <p>Wish: {product.wishlistCount} | Cart: {product.cartCount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Homepage Preview */}
      <div className="mt-12 bg-white rounded-2xl border border-border overflow-hidden">
        <div className="bg-slate-800 text-white p-4 text-center font-bold">
          Live Homepage Preview
        </div>
        <div className="p-8 bg-background-default">
          <PageContainer>
            {/* Render featured as it would appear */}
            <section className="mb-16">
              <SectionHeader 
                title="Featured Collection" 
                subtitle="Curated products selected just for you"
                align="center"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-12">
                {featured.slice(0, 8).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
            
            <section className="mb-16">
              <SectionHeader 
                title="Special Offers" 
                subtitle="Don't miss these amazing deals"
                align="center"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-12">
                {specialOffers.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </PageContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminHomepageSettings;
