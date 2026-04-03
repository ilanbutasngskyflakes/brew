import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/createShopContext';
import api from '../api/api';

export default function ShopSelectionPage() {
  const navigate = useNavigate();
  const { selectShop } = useContext(ShopContext);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get('/shop');
        setShops(response.data || []);
      } catch (error) {
        console.error('Error fetching shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleSelectShop = (shopId) => {
    selectShop(shopId);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <p className="text-white text-xl">Loading shops...</p>
      </div>
    );
  }

  const colorMap = {
    1: 'from-blue-500 to-blue-600',
    2: 'from-amber-700 to-amber-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Choose Your Shop
          </h1>
          <p className="text-gray-400 text-lg">
            Select which shop you want to access
          </p>
        </div>

        {/* Shop Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => handleSelectShop(shop.id)}
              className={`
                group bg-gradient-to-br ${colorMap[shop.id] || 'from-gray-500 to-gray-600'} p-8 md:p-12 
                rounded-2xl transition-all duration-300 
                hover:shadow-2xl hover:scale-105 active:scale-95
                cursor-pointer border-2 border-transparent
                hover:border-white/20
              `}
            >
              {/* Logo */}
              <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="text-5xl md:text-7xl font-bold text-white text-center">
                  {shop.name?.split(' ').map(w => w[0]).join('')}
                </div>
              </div>

              {/* Text */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {shop.name}
              </h2>
              <p className="text-white/80 text-sm md:text-base">
                {shop.id === 1 ? 'Cafe & Bar' : 'Coffee Shop'}
              </p>

              {/* Arrow */}
              <div className="mt-6 inline-flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                <span className="text-sm font-semibold">Enter</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>POS System v1.0 • Multi-Shop Edition</p>
        </div>
      </div>
    </div>
  );
}
