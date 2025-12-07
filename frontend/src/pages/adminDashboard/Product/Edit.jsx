/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/api";
import {
  FiPackage,
  FiX,
  FiUpload,
  FiImage,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";

export default function Edit() {
  const isEditing = true;
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    product_name: "",
    product_description: "",
    category_id: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // Load product data when editing
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/product/${id}`);
        
        setForm({
          product_name: data.product_name || "",
          product_description: data.product_description || "",
          category_id: data.category_id || "",
          image: data.image || null,
        });

        if (data.image) {
          setImagePreview(`http://localhost:8080/uploads/${data.image}`);
        }

        // Load variants with ingredients
        if (data.variants && data.variants.length > 0) {
          const formattedVariants = data.variants.map(v => ({
            id: v.id,
            variant_name: v.name || v.variant_name || "",
            price: v.price || "",
            ingredients: v.ingredients?.map(i => ({
              ingredient_id: i.ingredient_id || i.id,
              amount: i.amount || i.pivot?.amount || 0
            })) || []
          }));
          setVariants(formattedVariants);
        } else {
          setVariants([{ variant_name: "", price: "", ingredients: [] }]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Cannot load product:", err);
        alert("Error loading product");
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

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
  const handleIngredientChange = (
    variantIndex,
    ingredientId,
    amount,
    checked
  ) => {
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

  const removeVariant = async (index, e) => {
    e.preventDefault();
    const variant = variants[index];
    
    if (variants.length === 1) {
      alert("At least one variant is required");
      return;
    }
    
    if (variant.id) {
      if (confirm("Delete this variant?")) {
        try {
          await api.delete(`/variant/${variant.id}`);
          setVariants(variants.filter((_, i) => i !== index));
          alert("Variant deleted successfully");
        } catch (err) {
          console.error("Error deleting variant:", err);
          alert("Error deleting variant");
        }
      }
    } else {
      setVariants(variants.filter((_, i) => i !== index));
    }
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
      setSubmitting(true);
      const data = new FormData();
      data.append("product_name", form.product_name);
      data.append("product_description", form.product_description || "");
      data.append("category_id", form.category_id);
      if (form.image instanceof File) data.append("image", form.image);
      data.append("variants", JSON.stringify(variants));

      await api.put(`/product/${id}`, data);
      alert("Product updated successfully");
      navigate("/dashboard/product");
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiPackage className="text-white text-xl" />
                </div>
                Edit Product
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Update product details and variants
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/product")}
              className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Information Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Product Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
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
                  disabled={submitting}
                />
              </div>

              {/* Category */}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              {/* Image Upload */}
              <div className="flex flex-col md:col-span-2">
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
                    disabled={submitting}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`${
                      submitting ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
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
                          <p className="font-medium text-slate-700 text-sm">
                            Click to upload image
                          </p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Product Variants
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="bg-[#073dbe] hover:bg-[#052d99] text-white px-3 py-2 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                disabled={submitting}
              >
                <FiPlus size={16} />
                Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                >
                  {/* Variant Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                      <span className="bg-[#073dbe] text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      Variant {index + 1}
                      {variant.variant_name && (
                        <span className="text-slate-500 font-normal">
                          ({variant.variant_name})
                        </span>
                      )}
                    </h3>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => removeVariant(index, e)}
                        className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                        disabled={submitting}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Variant Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-2">
                        Variant Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Small, Medium, Large"
                        value={variant.variant_name}
                        onChange={(e) =>
                          handleVariantChange(index, "variant_name", e.target.value)
                        }
                        className="p-2.5 border border-slate-300 rounded-lg bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-slate-700 mb-2">
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
                        className="p-2.5 border border-slate-300 rounded-lg bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      Select Ingredients
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                      {ingredients.map((ing) => {
                        const selected = variant.ingredients?.find(
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
                                    index,
                                    ing.id,
                                    selected?.amount || 0,
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
                                        index,
                                        ing.id,
                                        Number(e.target.value),
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
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white py-3 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FiCheckCircle size={18} />
                  Update Product
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/product")}
              className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
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