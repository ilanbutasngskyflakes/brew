import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ name: "", quantity: "", price: "", status: "active" });
  const [editVariantId, setEditVariantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/product/${id}`);
      setProduct(data.product);
      setVariants(data.variants || []);
    } catch (err) {
      console.error("Cannot load product:", err);
      alert("Error loading product");
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitVariant = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editVariantId) {
        await api.put(`/variants/${editVariantId}`, { ...variantForm });
        setEditVariantId(null);
        alert("Variant updated successfully");
      } else {
        await api.post("/variants/add", { product_id: id, ...variantForm });
        alert("Variant added successfully");
      }
      setVariantForm({ name: "", quantity: 0, price: 0, status: "active" });
      await loadProduct();
    } catch (err) {
      console.error("Error saving variant:", err);
      alert("Error saving variant");
    } finally {
      setSubmitting(false);
    }
  };

  const editVariant = (v) => {
    setEditVariantId(v.id);
    setVariantForm({ name: v.name, quantity: v.quantity, price: v.price, status: v.status });
  };

  const deleteVariant = async (vId) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await api.delete(`/variants/${vId}`);
      alert("Variant deleted successfully");
      await loadProduct();
    } catch (err) {
      console.error("Cannot delete variant:", err);
      alert("Cannot delete variant");
    }
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
            <img
              src={`http://localhost:8080/uploads/${product.image}`}
              alt={product.product_name}
              className="w-full sm:w-48 h-48 object-cover rounded-lg border border-slate-200"
            />
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">{product.product_name}</h2>
              <p className="text-slate-600 text-sm">{product.product_description}</p>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Variants</h3>

          {/* Variant List */}
          {variants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No variants yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-all bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{v.name}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      ₱{v.price} • Qty: {v.quantity} • Status: {v.status}
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
                      onClick={() => deleteVariant(v.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all text-sm font-medium flex items-center gap-1"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Update Variant Form */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              {editVariantId ? "Edit Variant" : "Add New Variant"}
            </h4>
            <form onSubmit={submitVariant} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <input
                name="quantity"
                type="number"
                value={variantForm.quantity}
                onChange={handleVariantChange}
                placeholder="Quantity"
                min="0"
                className="p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                required
                disabled={submitting}
              />
              <select
                name="status"
                value={variantForm.status}
                onChange={handleVariantChange}
                className="p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer text-sm"
                disabled={submitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                type="submit"
                className="sm:col-span-2 bg-[#073dbe] hover:bg-[#052d99] text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
