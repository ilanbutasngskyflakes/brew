/* eslint-disable react-hooks/immutability */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/api";
import { 
  FiShoppingCart, 
  FiPackage, 
  FiTrendingUp, 
  FiUsers,
  FiAlertCircle,
  FiActivity,
  FiArrowRight
} from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalIngredients: 0,
    lowStockIngredients: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      console.log("Fetching dashboard data...");
      
      // Fetch orders
      let orders = [];
      try {
        const ordersRes = await api.get("/order");
        console.log("Orders API Response:", ordersRes.data);
        
        if (Array.isArray(ordersRes.data)) {
          orders = ordersRes.data;
        } else if (ordersRes.data?.orders) {
          orders = ordersRes.data.orders;
        } else if (ordersRes.data?.data) {
          orders = ordersRes.data.data;
        }
        console.log("Processed Orders:", orders.length);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }

      // Fetch products
      let products = [];
      try {
        const productsRes = await api.get("/product");
        console.log("Products API Response:", productsRes.data);
        
        if (Array.isArray(productsRes.data)) {
          products = productsRes.data;
        } else if (productsRes.data?.products) {
          products = productsRes.data.products;
        } else if (productsRes.data?.data) {
          products = productsRes.data.data;
        }
        console.log("Processed Products:", products.length);
      } catch (err) {
        console.error("Error fetching products:", err);
      }

      // Fetch ingredients - Try /ingredients (plural)
      let ingredients = [];
      try {
        const ingredientsRes = await api.get("/ingredients");
        console.log("Ingredients API Response:", ingredientsRes.data);
        console.log("Ingredients Response Type:", typeof ingredientsRes.data);
        console.log("Is Array?:", Array.isArray(ingredientsRes.data));
        
        // Try different data structures
        if (Array.isArray(ingredientsRes.data)) {
          ingredients = ingredientsRes.data;
        } else if (ingredientsRes.data?.ingredients && Array.isArray(ingredientsRes.data.ingredients)) {
          ingredients = ingredientsRes.data.ingredients;
        } else if (ingredientsRes.data?.data && Array.isArray(ingredientsRes.data.data)) {
          ingredients = ingredientsRes.data.data;
        } else if (ingredientsRes.data?.ingredient && Array.isArray(ingredientsRes.data.ingredient)) {
          ingredients = ingredientsRes.data.ingredient;
        } else if (typeof ingredientsRes.data === 'object' && ingredientsRes.data !== null) {
          // If it's an object, try to extract array values
          const values = Object.values(ingredientsRes.data);
          const arrayValue = values.find(v => Array.isArray(v));
          if (arrayValue) {
            ingredients = arrayValue;
          }
        }
        
        console.log("Processed Ingredients:", ingredients);
        console.log("Ingredients Length:", ingredients.length);
      } catch (err) {
        console.error("Error fetching ingredients:", err);
        console.error("Error details:", err.response?.data);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });

      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

      const lowStockProducts = products.filter(product => 
        product.variants?.some(variant => Number(variant.stock) < 10)
      ).length;

      // Check different possible quantity field names
      const lowStockIngredients = ingredients.filter(ingredient => {
        const qty = Number(ingredient.quantity || ingredient.stock || ingredient.amount || 0);
        console.log(`Ingredient: ${ingredient.name || ingredient.ingredient_name}, Qty: ${qty}`);
        return qty < 100;
      }).length;

      console.log("Final Stats:", {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalProducts: products.length,
        totalIngredients: ingredients.length,
        lowStockProducts,
        lowStockIngredients
      });

      setStats({
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue,
        todayRevenue,
        totalProducts: products.length,
        lowStockProducts,
        totalIngredients: ingredients.length,
        lowStockIngredients
      });
      
      if (!silent) setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message);
      if (!silent) setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₱${Number(amount).toFixed(2)}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md w-full">
          <FiAlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Error Loading Data</h2>
          <p className="text-sm text-slate-600 text-center mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className="w-full bg-[#073dbe] hover:bg-[#052d99] text-white px-4 py-2 rounded-lg transition-all font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {getGreeting()}, {user.first_name}
              </h1>
              <p className="text-sm text-slate-600 mt-1">Here's what's happening with your cafe today</p>
            </div>
            <button
              onClick={() => navigate("/cashier")}
              className="w-full sm:w-auto bg-[#073dbe] hover:bg-[#052d99] text-white px-4 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
            >
              <FiShoppingCart size={16} />
              <span>Go to Cashier</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Today's Orders */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-[#073dbe] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <FiShoppingCart className="text-[#073dbe]" size={20} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Today
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.todayOrders}</div>
            <div className="text-sm text-slate-600 font-medium mb-2">Orders Today</div>
            <div className="text-xs text-slate-500">Total: {stats.totalOrders}</div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-[#073dbe] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-2.5 rounded-lg">
                <span className="text-green-600 font-bold text-xl">₱</span>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Today
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{formatCurrency(stats.todayRevenue)}</div>
            <div className="text-sm text-slate-600 font-medium mb-2">Revenue Today</div>
            <div className="text-xs text-slate-500">Total: {formatCurrency(stats.totalRevenue)}</div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-[#073dbe] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 p-2.5 rounded-lg">
                <FiPackage className="text-purple-600" size={20} />
              </div>
              {stats.lowStockProducts > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {stats.lowStockProducts} Low
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalProducts}</div>
            <div className="text-sm text-slate-600 font-medium mb-2">Products</div>
            {stats.lowStockProducts > 0 ? (
              <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                <FiAlertCircle size={12} />
                {stats.lowStockProducts} low stock
              </div>
            ) : (
              <div className="text-xs text-slate-500">Stock levels good</div>
            )}
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-[#073dbe] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-50 p-2.5 rounded-lg">
                <FiActivity className="text-orange-600" size={20} />
              </div>
              {stats.lowStockIngredients > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {stats.lowStockIngredients} Low
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalIngredients}</div>
            <div className="text-sm text-slate-600 font-medium mb-2">Ingredients</div>
            {stats.lowStockIngredients > 0 ? (
              <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                <FiAlertCircle size={12} />
                {stats.lowStockIngredients} need restock
              </div>
            ) : (
              <div className="text-xs text-slate-500">Stock levels good</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-[#073dbe]" size={18} />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => navigate("/dashboard/product")}
              className="text-left p-3 bg-slate-50 hover:bg-blue-50 hover:border-[#073dbe] rounded-lg transition-all border border-slate-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#073dbe] p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <FiPackage className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Products</div>
                    <div className="text-xs text-slate-600">Manage inventory</div>
                  </div>
                </div>
                <FiArrowRight className="text-slate-400 group-hover:text-[#073dbe] transition-colors" size={16} />
              </div>
            </button>

            <button
              onClick={() => navigate("/dashboard/ingredients")}
              className="text-left p-3 bg-slate-50 hover:bg-blue-50 hover:border-[#073dbe] rounded-lg transition-all border border-slate-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <FiActivity className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Ingredients</div>
                    <div className="text-xs text-slate-600">Track stock</div>
                  </div>
                </div>
                <FiArrowRight className="text-slate-400 group-hover:text-[#073dbe] transition-colors" size={16} />
              </div>
            </button>

            <button
              onClick={() => navigate("/dashboard/reports")}
              className="text-left p-3 bg-slate-50 hover:bg-blue-50 hover:border-[#073dbe] rounded-lg transition-all border border-slate-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <FiTrendingUp className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Reports</div>
                    <div className="text-xs text-slate-600">View analytics</div>
                  </div>
                </div>
                <FiArrowRight className="text-slate-400 group-hover:text-[#073dbe] transition-colors" size={16} />
              </div>
            </button>

            <button
              onClick={() => navigate("/dashboard/settings")}
              className="text-left p-3 bg-slate-50 hover:bg-blue-50 hover:border-[#073dbe] rounded-lg transition-all border border-slate-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <FiUsers className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Settings</div>
                    <div className="text-xs text-slate-600">User management</div>
                  </div>
                </div>
                <FiArrowRight className="text-slate-400 group-hover:text-[#073dbe] transition-colors" size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {(stats.lowStockProducts > 0 || stats.lowStockIngredients > 0) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-bold text-red-800 mb-2">Low Stock Alerts</h4>
                <div className="space-y-1 text-sm text-red-700">
                  {stats.lowStockProducts > 0 && (
                    <p>{stats.lowStockProducts} product(s) running low on stock</p>
                  )}
                  {stats.lowStockIngredients > 0 && (
                    <p>{stats.lowStockIngredients} ingredient(s) need restocking</p>
                  )}
                </div>
                <button
                  onClick={() => navigate("/dashboard/ingredients")}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Inventory
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
