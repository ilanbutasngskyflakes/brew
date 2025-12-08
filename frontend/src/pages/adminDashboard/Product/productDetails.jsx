/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import Modal from "../../../components/modals";
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiSearch, FiEdit } from "react-icons/fi";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [variantForm, setVariantForm] = useState({ 
    name: "", 
    price: "", 
    ingredients: [] 
  });
  const [editVariantId, setEditVariantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    loadProduct();
    loadIngredients();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadProduct();
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const loadProduct = async () => {
    try {
      if (loading) setLoading(true);
      const { data } = await api.get(`/product/${id}?_t=${Date.now()}`);
      setProduct(data.product || data);
      setVariants(data.variants || []);
    } catch (err) {
      showModal("error", "Error", "Failed to load product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const { data } = await api.get("/ingredients");
      setIngredients(data || []);
    } catch (err) {
      showModal("error", "Error", "Failed to load ingredients.");
    }
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngredientChange = (ingredientId, amount, checked) => {
    setVariantForm((prev) => {
      const ingredients = prev.ingredients || [];
      const existingIndex = ingredients.findIndex(i => i.ingredient_id === ingredientId);

      if (checked) {
        if (existingIndex === -1) {
          return {
            ...prev,
            ingredients: [...ingredients, { ingredient_id: ingredientId, amount: amount || "" }]
          };
        } else {
          const updated = [...ingredients];
          updated[existingIndex].amount = amount || "";
          return { ...prev, ingredients: updated };
        }
      } else {
        if (existingIndex !== -1) {
          const updated = ingredients.filter((_, i) => i !== existingIndex);
          return { ...prev, ingredients: updated };
        }
        return prev;
      }
    });
  };

  const getFilteredIngredients = () => {
    if (!searchQuery.trim()) return ingredients;
    return ingredients.filter((ing) =>
      ing.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const submitVariant = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editVariantId) {
        await api.put(`/variant/${editVariantId}`, { 
          name: variantForm.name,
          price: variantForm.price,
          ingredients: variantForm.ingredients 
        });
        setEditVariantId(null);
        showModal("success", "Success", "Variant updated successfully!");
      } else {
        await api.post("/variant/add", { 
          product_id: id, 
          name: variantForm.name,
          price: variantForm.price,
          ingredients: variantForm.ingredients 
        });
        showModal("success", "Success", "Variant added successfully!");
      }
      setVariantForm({ name: "", price: "", ingredients: [] });
      setSearchQuery("");
      await loadProduct();
    } catch (err) {
      showModal("error", "Error", "Failed to save variant. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const editVariant = (v) => {
    setEditVariantId(v.id);
    setVariantForm({ 
      name: v.name, 
      price: v.price,
      ingredients: v.ingredients?.map(i => ({
        ingredient_id: i.ingredient_id || i.id,
        amount: i.amount || i.pivot?.amount || ""
      })) || []
    });
  };

  const deleteVariant = async (vId, vName) => {
    showModal(
      "confirm",
      "Delete Variant",
      `Are you sure you want to delete "${vName}"? This action cannot be undone.`,
      async () => {
        try {
          await api.delete(`/variant/${vId}`);
          showModal("success", "Success", "Variant deleted successfully!");
          await loadProduct();
        } catch (err) {
          showModal("error", "Error", "Failed to delete variant. Please try again.");
        }
      },
      "Delete",
      true
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-600">Product not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-[#073dbe] hover:underline font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
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

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#073dbe] hover:text-[#052d99] font-medium transition-colors"
        >
          <FiArrowLeft size={18} />
          Back
        </button>

        {/* Product Info Card */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {product.image ? (
              <img
                src={`http://localhost:8080/uploads/${product.image}`}
                alt={product.product_name}
                className="w-full sm:w-48 h-48 object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-full sm:w-48 h-48 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                <span className="text-slate-400 text-sm">No image</span>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{product.product_name}</h2>
                  <p className="text-slate-600 text-sm mt-2">
                    {product.product_description || "No description available"}
                  </p>
                </div>
                {/* Edit Product Button */}
                <button
                  onClick={() => navigate(`/dashboard/product/edit/${id}`)}
                  className="bg-[#073dbe] hover:bg-[#052d99] text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                >
                  <FiEdit size={16} />
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Manage Variants</h3>
            <span className="text-xs text-slate-500">
              Stock updates every 10s
            </span>
          </div>

          {/* Variant List */}
          {variants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No variants yet. Add one below!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((v) => {
                const stock = v.stock !== undefined ? Number(v.stock) : 0;
                return (
                  <div
                    key={v.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{v.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-[#073dbe] font-semibold">
                            ₱{Number(v.price).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500">
                            Stock: <span className={`font-semibold ${stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              {stock}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => editVariant(v)}
                          className="bg-[#073dbe] hover:bg-[#052d99] text-white px-3 py-1.5 rounded-lg transition-all text-sm font-medium flex items-center gap-1"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVariant(v.id, v.name)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all text-sm font-medium flex items-center gap-1"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Ingredients Display */}
                    {v.ingredients?.length > 0 && (
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-600 font-medium mb-2">Ingredients:</p>
                        <div className="flex flex-wrap gap-2">
                          {v.ingredients.map((i) => (
                            <span key={i.id} className="text-xs bg-blue-50 text-[#073dbe] px-2.5 py-1 rounded-lg border border-blue-200">
                              {i.name} ({i.amount}{i.unit})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add / Update Variant Form */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              {editVariantId ? "Edit Variant" : "Add New Variant"}
            </h4>
            <form onSubmit={submitVariant} className="space-y-4">
              {/* Variant Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  name="name"
                  value={variantForm.name}
                  onChange={handleVariantChange}
                  placeholder="Variant name (e.g., 12 oz)"
                  className="p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  required
                  disabled={submitting}
                />
                <input
                  name="price"
                  type="number"
                  value={variantForm.price}
                  onChange={handleVariantChange}
                  placeholder="Price"
                  step="0.01"
                  min="0"
                  className="p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Ingredients Section */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-slate-700">
                    Select Ingredients
                  </h5>
                  {/* Search Bar */}
                  <div className="relative w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search ingredients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                  {getFilteredIngredients().length > 0 ? (
                    getFilteredIngredients().map((ing) => {
                      const selected = variantForm.ingredients?.find(
                        (i) => i.ingredient_id === ing.id
                      );
                      return (
                        <div
                          key={ing.id}
                          className={`border rounded-lg p-3 transition-all ${
                            selected
                              ? "border-[#073dbe] bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.id,
                                  selected?.amount || "",
                                  e.target.checked
                                )
                              }
                              className="mt-0.5 w-4 h-4 text-[#073dbe] rounded focus:ring-2 focus:ring-blue-200"
                              disabled={submitting}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 text-sm">
                                {ing.ingredient_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                Available: {ing.quantity} {ing.unit}
                              </div>
                              {selected && (
                                <input
                                  type="number"
                                  placeholder={`Amount (${ing.unit})`}
                                  value={selected.amount}
                                  onChange={(e) =>
                                    handleIngredientChange(
                                      ing.id,
                                      e.target.value,
                                      true
                                    )
                                  }
                                  onWheel={(e) => e.target.blur()}
                                  step="0.01"
                                  min="0"
                                  className="w-full mt-2 p-2 border border-[#073dbe] rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                  disabled={submitting}
                                />
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-slate-500">
                      <p className="text-sm">No ingredients found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#073dbe] hover:bg-[#052d99] text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editVariantId ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    {editVariantId ? "Update Variant" : "Add Variant"}
                  </>
                )}
              </button>

              {editVariantId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditVariantId(null);
                    setVariantForm({ name: "", price: "", ingredients: [] });
                    setSearchQuery("");
                  }}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 rounded-lg transition-all"
                  disabled={submitting}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
