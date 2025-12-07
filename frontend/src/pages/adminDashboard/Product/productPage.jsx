import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { 
  FiPackage, 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiAlertCircle,
  FiImage,
  FiSearch
} from "react-icons/fi";

export default function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/product");
      setProducts(data.products || []);
    } catch (err) {
      console.error("Cannot load products:", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/category");
      setCategories(data || []);
    } catch (err) {
      console.error("Cannot load categories:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("⚠️ Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await api.delete(`/product/${id}`);
      alert("Product deleted successfully! 🗑️");
      await loadProducts();
    } catch (err) {
      console.error("Cannot delete product:", err);
      alert("Failed to delete product");
    }
  };

  const filteredProducts = products
    .filter((p) => p.product_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const getCategoryColor = (categoryId) => {
    const colors = {
      1: 'bg-purple-600',
      2: 'bg-blue-600',
      3: 'bg-green-600',
      4: 'bg-yellow-600',
      5: 'bg-pink-600',
    };
    return colors[categoryId] || 'bg-gray-600';
  };

  // Group products by category - ALWAYS show all categories in order
  const productsByCategory = () => {
    if (selectedCategory === "all") {
      // Return ALL categories in order, even if empty
      return categories.map(category => ({
        category,
        products: filteredProducts.filter(p => p.category_id === category.id)
      }));
    } else {
      // Return only selected category
      const category = categories.find(c => c.id === Number(selectedCategory));
      if (!category) return [];
      return [{
        category,
        products: filteredProducts.filter(p => p.category_id === category.id)
      }];
    }
  };

  const groupedProducts = productsByCategory();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                  <FiPackage className="text-white text-2xl" />
                </div>
                Product Management
              </h1>
              <p className="text-gray-600 mt-2 ml-1">
                Manage your menu items and variants
              </p>
            </div>
            <Link
              to="/dashboard/product/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
            >
              <FiPlus className="text-xl" />
              Add New Product
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border-2 border-gray-100">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">Filter by Category</h3>
            <span className="text-xs text-gray-600">
              <span className="font-semibold text-indigo-600">{filteredProducts.length}</span> products
            </span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar-horizontal">
            {/* All Categories */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                selectedCategory === "all"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-white border-gray-200 hover:border-indigo-600 hover:shadow-sm text-gray-700"
              }`}
            >
              <span className="font-semibold">All</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === "all" ? "bg-white/20" : "bg-indigo-100 text-indigo-600"
              }`}>
                {products.length}
              </span>
            </button>

            {/* Category Tabs */}
            {categories.map((category) => {
              const count = products.filter(p => p.category_id === category.id).length;
              const lowStock = products.filter(p => 
                p.category_id === category.id && 
                p.variants?.some(v => Number(v.stock) < 10)
              ).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={`px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                    selectedCategory === category.id.toString()
                      ? `${getCategoryColor(category.id)} border-transparent text-white shadow-md`
                      : "bg-white border-gray-200 hover:border-indigo-600 hover:shadow-sm text-gray-700"
                  }`}
                >
                  <span className="font-semibold">{category.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id.toString() 
                      ? "bg-white/20" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {count}
                  </span>
                  {lowStock > 0 && (
                    <FiAlertCircle className={`${
                      selectedCategory === category.id.toString() ? "text-white" : "text-red-600"
                    }`} size={14} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grouped by Category */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? "Try adjusting your search" 
                : "Start by adding your first product"}
            </p>
            <Link
              to="/dashboard/product/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <FiPlus />
              Add Product
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedProducts.map(({ category, products: categoryProducts }) => (
              <div key={category.id}>
                {/* Category Header - Always show */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${getCategoryColor(category.id)} w-1 h-8 rounded-full`}></div>
                  <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
                  <span className="text-sm text-gray-500">({categoryProducts.length})</span>
                </div>

                {/* Products Grid or Empty State */}
                {categoryProducts.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center border-2 border-gray-100">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-gray-500 font-medium">No products in this category yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryProducts.map((p) => {
                      const hasLowStock = p.variants?.some(v => Number(v.stock) < 10);
                      const totalStock = p.variants?.reduce((sum, v) => sum + Number(v.stock), 0) || 0;
                      
                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 flex flex-col"
                        >
                          {/* Image */}
                          <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {p.image ? (
                              <img
                                src={`http://localhost:8080/uploads/${p.image}`}
                                alt={p.product_name}
                                className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="text-gray-400 text-center p-4">
                                <FiImage className="text-4xl mx-auto mb-2" />
                                <span className="text-sm">No image</span>
                              </div>
                            )}
                            
                            {/* Category Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`${getCategoryColor(p.category_id)} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg`}>
                                {getCategoryName(p.category_id)}
                              </span>
                            </div>

                            {/* Low Stock Alert */}
                            {hasLowStock && (
                              <div className="absolute top-3 left-3">
                                <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                  <FiAlertCircle size={12} />
                                  Low Stock
                                </span>
                              </div>
                            )}

                            {/* Total Stock */}
                            <div className="absolute bottom-3 left-3">
                              <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                                Stock: {totalStock}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col">
                            {/* Product Name */}
                            <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                              {p.product_name}
                            </h2>
                            
                            {/* Description */}
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                              {p.product_description || "No description available"}
                            </p>

                            {/* Variants */}
                            {p.variants?.length > 0 && (
                              <div className="mb-4 space-y-2">
                                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                                  <span className="w-1 h-4 bg-indigo-600 rounded"></span>
                                  Variants ({p.variants.length})
                                </h3>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                  {p.variants.map((v) => (
                                    <div key={v.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <span className="font-medium text-gray-800 text-sm">{v.name}</span>
                                          <div className="text-xs text-gray-500 mt-1">
                                            Stock: <span className={`font-semibold ${Number(v.stock) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                              {v.stock}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-indigo-600 font-bold">₱{Number(v.price).toFixed(2)}</span>
                                      </div>
                                    
                                      {/* Ingredients */}
                                      {v.ingredients?.length > 0 && (
                                        <div className="pt-2 border-t border-gray-200">
                                          <p className="text-xs text-gray-600 mb-1 font-medium">Ingredients:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {v.ingredients.map((i) => (
                                              <span key={i.id} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                                {i.name} ({i.amount}{i.unit})
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200">
                              <button
                                onClick={() => navigate(`/dashboard/product/edit/${p.id}`)}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                              >
                                <FiEdit size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                              >
                                <FiTrash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4F46E5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4338CA;
        }
        
        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 10px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
    </div>
  );
}
