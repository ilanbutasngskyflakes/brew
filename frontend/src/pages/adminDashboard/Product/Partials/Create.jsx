import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/api";
import {
  FiPackage,
  FiX,
  FiUpload,
  FiImage,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";

export default function Create({ formData = {}, isEditing }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    product_name: "",
    product_description: "",
    category_id: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([
    { variant_name: "", price: "", ingredients: [] },
  ]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load categories and ingredients
  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await api.get("/category");
        setCategories(catRes.data);

        const ingRes = await api.get("/ingredients");
        setIngredients(ingRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // Update form data if editing
  useEffect(() => {
    if (formData.product_name) setForm({ ...formData });
    if (formData.variants) setVariants(formData.variants);
    if (formData.image) {
      setImagePreview(`http://localhost:8080/uploads/${formData.image}`);
    }
  }, [formData]);

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.length > 0) {
      setForm({ ...form, image: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Variant inputs
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Ingredient for variant
  const handleIngredientChange = (variantIndex, ingredientId, amount, checked) => {
    const updated = [...variants];
    if (!updated[variantIndex].ingredients)
      updated[variantIndex].ingredients = [];

    const existingIndex = updated[variantIndex].ingredients.findIndex(
      (i) => i.ingredient_id === ingredientId
    );

    if (checked) {
      if (existingIndex === -1) {
        updated[variantIndex].ingredients.push({
          ingredient_id: ingredientId,
          amount,
        });
      } else {
        updated[variantIndex].ingredients[existingIndex].amount = amount;
      }
    } else {
      if (existingIndex !== -1) {
        updated[variantIndex].ingredients.splice(existingIndex, 1);
      }
    }

    setVariants(updated);
  };

  const addVariant = (e) => {
    e.preventDefault();
    setVariants([
      ...variants,
      { variant_name: "", price: 0, ingredients: [] },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) {
      alert("At least one variant is required");
      return;
    }
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_id || !form.product_name) {
      alert("Category and Product Name are required");
      return;
    }

    if (variants.some((v) => !v.variant_name || !v.price)) {
      alert("All variants must have a name and price");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("product_name", form.product_name);
      data.append("product_description", form.product_description || "");
      data.append("category_id", form.category_id);
      if (form.image instanceof File) data.append("image", form.image);
      data.append("variants", JSON.stringify(variants));

      await api.post("/product/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product added successfully! ✅");
      navigate("/dashboard/product");
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                  <FiPackage className="text-white text-2xl" />
                </div>
                {isEditing ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-gray-600 mt-2 ml-1">
                {isEditing
                  ? "Update product details and variants"
                  : "Add a new product with variants to your menu"}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/product")}
              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border-2 border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-600 rounded"></span>
              Product Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
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

              {/* Category */}
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
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Product Description
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
              <div className="flex flex-col md:col-span-2">
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
                  <label
                    htmlFor="image-upload"
                    className={`${
                      loading ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
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
                          <p className="font-semibold text-gray-700">
                            Click to upload image
                          </p>
                          <p className="text-sm">PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded"></span>
                Product Variants
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold flex items-center gap-2 text-sm"
                disabled={loading}
              >
                <FiPlus size={16} />
                Add Variant
              </button>
            </div>

            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 hover:border-indigo-300 transition-all"
                >
                  {/* Variant Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      Variant {index + 1}
                    </h3>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                        disabled={loading}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Variant Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-700 mb-2">
                        Variant Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Small, Medium, Large"
                        value={variant.variant_name}
                        onChange={(e) =>
                          handleVariantChange(index, "variant_name", e.target.value)
                        }
                        className="p-3 border-2 border-gray-300 rounded-lg bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-gray-700 mb-2">
                        Price <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={variant.price}
                        onChange={(e) =>
                          handleVariantChange(index, "price", Number(e.target.value))
                        }
                        onWheel={(e) => e.target.blur()}
                        step="0.01"
                        min="0"
                        className="p-3 border-2 border-gray-300 rounded-lg bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                        required
                        disabled={loading}
                      />
                    </div>

                    
                  </div>

                  {/* Ingredients Section */}
                  <div className="border-t-2 border-gray-200 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FiCheckCircle className="text-indigo-600" />
                      Select Ingredients
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {ingredients.map((ing) => {
                        const selected = variant.ingredients?.find(
                          (i) => i.ingredient_id === ing.id
                        );
                        return (
                          <div
                            key={ing.id}
                            className={`border-2 rounded-lg p-3 transition-all ${
                              selected
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={(e) =>
                                  handleIngredientChange(
                                    index,
                                    ing.id,
                                    selected?.amount || 0,
                                    e.target.checked
                                  )
                                }
                                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                disabled={loading}
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800 text-sm">
                                  {ing.ingredient_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Available: {ing.quantity} {ing.unit}
                                </div>
                                {selected && (
                                  <input
                                    type="number"
                                    placeholder={`Amount (${ing.unit})`}
                                    value={selected.amount}
                                    onChange={(e) =>
                                      handleIngredientChange(
                                        index,
                                        ing.id,
                                        Number(e.target.value),
                                        true
                                      )
                                    }
                                    onWheel={(e) => e.target.blur()}
                                    step="0.01"
                                    min="0"
                                    className="w-full mt-2 p-2 border-2 border-indigo-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    disabled={loading}
                                  />
                                )}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <FiCheckCircle size={20} />
                  {isEditing ? "Update Product" : "Create Product"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/product")}
              className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold text-lg disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
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
          background: #4f46e5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4338ca;
        }
      `}</style>
    </div>
  );
}
