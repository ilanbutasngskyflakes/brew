/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import Modal from "../../../components/modals";
import {
  FiPackage,
  FiUpload,
  FiX,
  FiPlus,
  FiTrash2,
  FiImage,
  FiAlertCircle,
} from "react-icons/fi";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [form, setForm] = useState({
    product_name: "",
    product_description: "",
    category_id: "",
    image: null,
  });

  const [variants, setVariants] = useState([
    { variant_name: "", price: "", ingredients: [] },
  ]);

  const [imagePreview, setImagePreview] = useState(null);

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false,
  });

  const showModal = (
    type,
    title,
    message,
    onConfirm = null,
    confirmText = "OK",
    showCancel = false
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel,
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load categories
        const { data: catData } = await api.get("/category");
        setCategories(catData || []);

        // Load ingredients
        const { data: ingData } = await api.get("/ingredients");
        setIngredients(ingData || []);

        // Load product
        const { data } = await api.get(`/product/${id}?_t=${Date.now()}`);

        const productData = data.product || data;
        setForm({
          product_name: productData.product_name || "",
          product_description: productData.product_description || "",
          category_id: productData.category_id || "",
          image: productData.image || null,
        });

        if (productData.image) {
          setImagePreview(`http://localhost:8080/uploads/${productData.image}`);
        }

        // Load variants
        const variantsToLoad = data.variants || [];
        if (variantsToLoad.length > 0) {
          const formattedVariants = variantsToLoad.map((v) => ({
            id: v.id,
            variant_name: v.name || "",
            price: v.price || "",
            ingredients:
              v.ingredients?.map((i) => ({
                ingredient_id: i.ingredient_id || i.id,
                amount: i.amount || "",
              })) || [],
          }));
          setVariants(formattedVariants);
        }

        setLoading(false);
      } catch (err) {
        showModal(
          "error",
          "Error",
          "Failed to load product data. Please try again."
        );
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const addVariant = () => {
    setVariants([...variants, { variant_name: "", price: "", ingredients: [] }]);
  };

  const removeVariant = (index) => {
    const variant = variants[index];
    if (variant.id) {
      showModal(
        "confirm",
        "Delete Variant",
        `Are you sure you want to delete "${variant.variant_name}"?`,
        () => {
          setVariants(variants.filter((_, i) => i !== index));
        },
        "Delete",
        true
      );
    } else {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleIngredientToggle = (variantIndex, ingredientId) => {
    const updated = [...variants];
    const ingredients = updated[variantIndex].ingredients || [];
    const exists = ingredients.find((i) => i.ingredient_id === ingredientId);

    if (exists) {
      updated[variantIndex].ingredients = ingredients.filter(
        (i) => i.ingredient_id !== ingredientId
      );
    } else {
      updated[variantIndex].ingredients = [
        ...ingredients,
        { ingredient_id: ingredientId, amount: "" },
      ];
    }
    setVariants(updated);
  };

  const handleIngredientAmountChange = (variantIndex, ingredientId, amount) => {
    const updated = [...variants];
    const ing = updated[variantIndex].ingredients.find(
      (i) => i.ingredient_id === ingredientId
    );
    if (ing) {
      ing.amount = amount;
      setVariants(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_id || !form.product_name) {
      showModal(
        "warning",
        "Missing Fields",
        "Category and Product Name are required."
      );
      return;
    }

    if (variants.some((v) => !v.variant_name || !v.price)) {
      showModal(
        "warning",
        "Missing Fields",
        "All variants must have a name and price."
      );
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append("product_name", form.product_name);
      data.append("product_description", form.product_description || "");
      data.append("category_id", form.category_id);

      // Only append image if user uploaded a new one
      if (form.image instanceof File) {
        data.append("image", form.image);
      }

      data.append("variants", JSON.stringify(variants));

      await api.put(`/product/${id}`, data);

      showModal("success", "Success", "Product updated successfully!", () => {
        navigate("/dashboard/product");
      });
    } catch (err) {
      showModal("error", "Error", "Failed to update product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto">
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-[#073dbe] p-2.5 rounded-lg">
              <FiPackage className="text-white text-xl" />
            </div>
            Edit Product
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Update product information, variants, and ingredients
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Information Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#073dbe] rounded"></span>
              Product Information
            </h2>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={form.product_name}
                  onChange={handleFormChange}
                  placeholder="Enter product name"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="product_description"
                  value={form.product_description}
                  onChange={handleFormChange}
                  placeholder="Enter product description"
                  rows="3"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                  disabled={submitting}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                  required
                  disabled={submitting}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

             <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-[#073dbe] transition-all">
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFormChange}
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

          {/* Variants Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#073dbe] rounded"></span>
                Product Variants
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="bg-[#073dbe] hover:bg-[#052d99] text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                disabled={submitting}
              >
                <FiPlus size={16} />
                Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, vIndex) => (
                <div
                  key={vIndex}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                >
                  {/* Variant Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Variant {vIndex + 1}
                    </h3>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(vIndex)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        disabled={submitting}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>

                  {/* Variant Name & Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Variant Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.variant_name}
                        onChange={(e) =>
                          handleVariantChange(vIndex, "variant_name", e.target.value)
                        }
                        placeholder="e.g., 12 oz, Large"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) =>
                          handleVariantChange(vIndex, "price", e.target.value)
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      Ingredients
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
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
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={() =>
                                  handleIngredientToggle(vIndex, ing.id)
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
                                      handleIngredientAmountChange(
                                        vIndex,
                                        ing.id,
                                        e.target.value
                                      )
                                    }
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/product")}
              className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50 text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating Product...
                </>
              ) : (
                "Update Product"
              )}
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