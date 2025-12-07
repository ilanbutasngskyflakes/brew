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
        // Update existing product
        await api.put(`/product/${formData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product updated successfully! ✅");
      } else {
        // Create new product
        await api.post("/product/add", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product added successfully! ✅");
      }
      
      // Close modal and refresh
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
    if (!confirm("⚠️ Are you sure you want to delete this product? This action cannot be undone.")) return;
    
    try {
      setLoading(true);
      await api.delete(`/product/${formData.id}`);
      alert("Product deleted successfully! 🗑️");
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
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative my-8 border-2 border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 rounded-t-xl p-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                <FiPackage className="text-white text-xl" />
              </div>
              {isEditing ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-gray-600 text-sm mt-2 ml-1">
              {isEditing ? "Update product information" : "Create a new menu item"}
            </p>
          </div>
          <button
            className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-all"
            onClick={onClose}
            disabled={loading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Category & Product Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none cursor-pointer"
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
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Product Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={form.product_name}
                  onChange={handleChange}
                  placeholder="e.g., Caramel Macchiato"
                  className="p-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="product_description"
                value={form.product_description}
                onChange={handleChange}
                placeholder="Enter product description..."
                className="p-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Image Upload */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">
                Product Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition-all">
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
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-48 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                      />
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                        <FiUpload />
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="bg-gray-100 p-4 rounded-full">
                        <FiImage size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700">Click to upload image</p>
                        <p className="text-sm">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Variants Display */}
            {isEditing && variants?.length > 0 && (
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-indigo-600 rounded"></span>
                  Variants ({variants.length})
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                  {variants.map((v) => (
                    <div key={v.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-gray-800">{v.name}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            Stock: <span className={`font-semibold ${Number(v.stock) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                              {v.stock}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-indigo-600">₱{Number(v.price).toFixed(2)}</span>
                      </div>
                      {v.ingredients?.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium mb-1">Ingredients:</p>
                          <div className="flex flex-wrap gap-1">
                            {v.ingredients.map((i) => (
                              <span key={i.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">
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
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-100">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <FiTrash2 size={18} />
                  Delete Product
                </button>
              )}
            </div>
          </form>
        </div>
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
      `}</style>
    </div>
  );
}
