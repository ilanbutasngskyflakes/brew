import { useState, useEffect } from 'react';
import { ShopContext } from './createShopContext';

export function ShopProvider({ children }) {
  const [shopId, setShopId] = useState(() => {
    // Get shopId from localStorage on first load
    const stored = localStorage.getItem('selectedShop');
    return stored ? parseInt(stored) : null;
  });

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch shop info when shopId changes
  useEffect(() => {
    if (shopId) {
      fetchShopInfo(shopId);
    }
  }, [shopId]);

  const fetchShopInfo = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/shop/${id}`);
      if (response.ok) {
        const data = await response.json();
        setShop(data);
      } else {
        console.error('Failed to fetch shop:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch shop info:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectShop = (id) => {
    setShopId(id);
    localStorage.setItem('selectedShop', id);
  };

  const clearShop = () => {
    setShopId(null);
    setShop(null);
    localStorage.removeItem('selectedShop');
  };

  return (
    <ShopContext.Provider value={{ shopId, shop, selectShop, clearShop, loading }}>
      {children}
    </ShopContext.Provider>
  );
}
