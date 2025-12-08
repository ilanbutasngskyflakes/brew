/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import Modal from "../../../components/modals";
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

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false
  });

  const showModal = (type, title, message, onConfirm = null, confirmText = "OK", showCancel = false) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/product?_t=${Date.now()}`);
      setProducts(data.products || []);
    } catch (err) {
      showModal("error", "Error", "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/category");
      setCategories(data || []);
    } catch (err) {
      showModal("error", "Error", "Failed to load categories.");
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();

    // Auto-refresh every 30 seconds for real-time quantity updates
    const interval = setInterval(() => {
      loadProducts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id, productName) => {
    showModal(
      "confirm",
      "Delete Product",
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      async () => {
        try {
          await api.delete(`/product/${id}`);
          showModal("success", "Success", "Product deleted successfully!");
          await loadProducts();
        } catch (err) {
          showModal("error", "Error", "Failed to delete product. Please try again.");
        }
      },
      "Delete",
      true
    );
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
      4: 'bg-orange-600',
      5: 'bg-pink-600',
    };
    return colors[categoryId] || 'bg-slate-600';
  };

  const productsByCategory = () => {
    if (selectedCategory === "all") {
      return categories.map(category => ({
        category,
        products: filteredProducts.filter(p => p.category_id === category.id)
      }));
    } else {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modal */}
        <Modal
          isOpen={modal.isOpen}
          onClose={closeModal}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onConfirm={modal.onConfirm}
          confirmText={modal.confirmText}
          showCancel={modal.showCancel}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiPackage className="text-white text-xl" />
                </div>
                Product Management
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Manage your menu items and variants ({products.length} total)
              </p>
            </div>
            <Link
              to="/dashboard/product/new"
              className="w-full lg:w-auto bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
            >
              <FiPlus size={18} />
              Add Product
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Filter by Category</h3>
            <span className="text-xs text-slate-600">
              <span className="font-semibold text-[#073dbe]">{filteredProducts.length}</span> products
            </span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 text-sm font-medium ${
                selectedCategory === "all"
                  ? "bg-[#073dbe] border-[#073dbe] text-white"
                  : "bg-white border-slate-200 hover:border-[#073dbe] text-slate-700"
              }`}
            >
              <span>All</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === "all" ? "bg-white/20" : "bg-blue-100 text-[#073dbe]"
              }`}>
                {products.length}
              </span>
            </button>

            {categories.map((category) => {
              const count = products.filter(p => p.category_id === category.id).length;
              const lowquantity = products.filter(p => 
                p.category_id === category.id && 
                p.variants?.some(v => Number(v.quantity) < 10)
              ).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap flex items-center gap-2 shrink-0 text-sm font-medium ${
                    selectedCategory === category.id.toString()
                      ? `${getCategoryColor(category.id)} border-transparent text-white`
                      : "bg-white border-slate-200 hover:border-[#073dbe] text-slate-700"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id.toString() 
                      ? "bg-white/20" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {count}
                  </span>
                  {lowquantity > 0 && (
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
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Products Found</h3>
            <p className="text-slate-600 text-sm mb-6">
              {searchQuery 
                ? "Try adjusting your search" 
                : "Start by adding your first product"}
            </p>
            <Link
              to="/dashboard/product/new"
              className="inline-flex items-center gap-2 bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium text-sm"
            >
              <FiPlus size={16} />
              Add Product
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedProducts.map(({ category, products: categoryProducts }) => (
              <div key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${getCategoryColor(category.id)} w-1 h-6 rounded-full`}></div>
                  <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
                  <span className="text-sm text-slate-500">({categoryProducts.length})</span>
                </div>

                {categoryProducts.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FiPackage className="text-slate-400 text-xl" />
                    </div>
                    <p className="text-slate-500 text-sm">No products in this category yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((p) => {
                      const hasLowquantity = p.variants?.some(v => Number(v.quantity) < 10);
                      const totalquantity = p.variants?.reduce((sum, v) => sum + Number(v.quantity), 0) || 0;
                      
                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all overflow-hidden flex flex-col"
                        >
                          <div className="relative h-44 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {p.image ? (
                              <img
                                src={`http://localhost:8080/uploads/${p.image}`}
                                alt={p.product_name}
                                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="text-slate-400 text-center p-4">
                                <FiImage className="text-3xl mx-auto mb-2" />
                                <span className="text-xs">No image</span>
                              </div>
                            )}
                            
                            <div className="absolute top-2 right-2">
                              <span className={`${getCategoryColor(p.category_id)} text-white text-xs font-medium px-2.5 py-1 rounded-full`}>
                                {getCategoryName(p.category_id)}
                              </span>
                            </div>

                            {hasLowquantity && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <FiAlertCircle size={12} />
                                  Low quantity
                                </span>
                              </div>
                            )}

                            <div className="absolute bottom-2 left-2">
                              <span className="bg-white text-slate-800 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200">
                                quantity: {totalquantity}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <h2 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">
                              {p.product_name}
                            </h2>
                            
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2 flex-1">
                              {p.product_description || "No description available"}
                            </p>

                            {p.variants?.length > 0 && (
                              <div className="mb-4 space-y-2">
                                <h3 className="font-semibold text-xs text-slate-700 flex items-center gap-2">
                                  <span className="w-1 h-3 bg-[#073dbe] rounded"></span>
                                  Variants ({p.variants.length})
                                </h3>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                                  {p.variants.map((v) => (
                                    <div key={v.id} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <span className="font-medium text-slate-900 text-sm">{v.name}</span>
                                          <div className="text-xs text-slate-500 mt-1">
                                            quantity: <span className={`font-semibold ${Number(v.quantity) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                              {v.quantity}
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[#073dbe] font-bold text-sm">₱{Number(v.price).toFixed(2)}</span>
                                      </div>
                                    
                                      {v.ingredients?.length > 0 && (
                                        <div className="pt-2 border-t border-slate-200">
                                          <p className="text-xs text-slate-600 mb-1 font-medium">Ingredients:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {v.ingredients.map((i) => (
                                              <span key={i.id} className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
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

                            <div className="flex gap-2 mt-auto pt-3 border-t border-slate-200">
                              <button
                                onClick={() => navigate(`/dashboard/product/edit/${p.id}`)}
                                className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 text-sm"
                              >
                                <FiEdit size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.product_name)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 text-sm"
                              >
                                <FiTrash2 size={14} />
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
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
