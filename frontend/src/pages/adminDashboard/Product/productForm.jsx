/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/api";
import { FiPackage, FiX, FiUpload, FiImage, FiTrash2 } from "react-icons/fi";

export default function ProductForm({ formData = {}, isEditing, onSubmit, onDelete, onClose }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [form, setForm] = useState({
    category_id: "",
    product_name: "",
    product_description: "",
    image: null
  });
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/category");
        setCategories(data);
      } catch (err) {
        console.error("Cannot fetch categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Load product data when editing
  useEffect(() => {
    if (isEditing && formData?.id) {
      setForm({
        category_id: formData.category_id || "",
        product_name: formData.product_name || "",
        product_description: formData.product_description || "",
        image: formData.image || null
      });
      
      if (formData.variants) {
        setVariants(formData.variants);
      }
      
      if (formData.image) {
        setImagePreview(`http://localhost:8080/uploads/${formData.image}`);
      }
    }
  }, [isEditing, formData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files?.length > 0) {
      setForm({ ...form, image: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else if (name === "category_id") {
      setForm({ ...form, [name]: parseInt(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_id || !form.product_name) {
      alert("Category and Product Name are required");
      return;
    }

    const data = new FormData();
    data.append("category_id", form.category_id);
    data.append("product_name", form.product_name);

    if (form.product_description?.trim()) {
      data.append("product_description", form.product_description.trim());
    }

    if (form.image instanceof File) {
      data.append("image", form.image);
    }

    try {
      setLoading(true);
      if (isEditing && formData?.id) {
        await api.put(`/product/${formData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product updated successfully");
      } else {
        await api.post("/product/add", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product added successfully");
      }
      
      onClose();
      if (onSubmit) {
        onSubmit(data);
      }
    } catch (err) {
      console.error("Error saving product:", err.response?.data || err.message);
      alert(`Error ${isEditing ? 'updating' : 'adding'} product: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    
    try {
      setLoading(true);
      await api.delete(`/product/${formData.id}`);
      alert("Product deleted successfully");
      onClose();
      if (onDelete) {
        onDelete(formData.id);
      }
    } catch (err) {
      console.error("Cannot delete product:", err);
      alert("Error deleting product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl relative my-8 border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-lg p-4 lg:p-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="bg-[#073dbe] p-2.5 rounded-lg">
                <FiPackage className="text-white text-lg" />
              </div>
              {isEditing ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              {isEditing ? "Update product information" : "Create a new menu item"}
            </p>
          </div>
          <button
            className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-all"
            onClick={onClose}
            disabled={loading}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
            {/* Category & Product Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer"
                  required
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Product Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={form.product_name}
                  onChange={handleChange}
                  placeholder="e.g., Caramel Macchiato"
                  className="p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="product_description"
                value={form.product_description}
                onChange={handleChange}
                placeholder="Enter product description..."
                className="p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Image Upload */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">
                Product Image
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-[#073dbe] transition-all">
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  onChange={handleChange} 
                  className="hidden"
                  id="image-upload"
                  disabled={loading}
                />
                <label htmlFor="image-upload" className={`${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-40 w-40 object-cover rounded-lg border border-slate-200"
                      />
                      <div className="flex items-center gap-2 text-[#073dbe] font-medium text-sm">
                        <FiUpload size={16} />
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <div className="bg-slate-100 p-4 rounded-lg">
                        <FiImage size={28} />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-700 text-sm">Click to upload image</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Variants Display */}
            {isEditing && variants?.length > 0 && (
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Variants ({variants.length})
                </label>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2 max-h-60 overflow-y-auto">
                  {variants.map((v) => (
                    <div key={v.id} className="bg-white rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">{v.name}</span>
                          <div className="text-xs text-slate-500 mt-1">
                            Stock: <span className={`font-semibold ${Number(v.stock) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              {v.stock}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-[#073dbe]">₱{Number(v.price).toFixed(2)}</span>
                      </div>
                      {v.ingredients?.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-600 font-medium mb-1">Ingredients:</p>
                          <div className="flex flex-wrap gap-1">
                            {v.ingredients.map((i) => (
                              <span key={i.id} className="text-xs bg-blue-50 text-[#073dbe] px-2 py-1 rounded border border-blue-200">
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

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white py-2.5 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditing ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>{isEditing ? "Update Product" : "Add Product"}</>
                )}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white py-2.5 px-6 rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #073dbe;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #052d99;
        }
      `}</style>
    </div>
  );
}
