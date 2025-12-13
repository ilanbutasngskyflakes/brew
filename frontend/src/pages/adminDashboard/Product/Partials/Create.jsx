/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/api";
import Modal from "../../../../components/modals";
import {
  FiPackage,
  FiX,
  FiUpload,
  FiImage,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiSearch,
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
  const [searchQueries, setSearchQueries] = useState({});

  // Add Ingredient Modal State
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "g",
  });
  const [addingIngredient, setAddingIngredient] = useState(false);

  // Unit options
  const unitOptions = [
    { value: "g", label: "Grams (g)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "l", label: "Liters (l)" },
    { value: "pcs", label: "Pieces (pcs)" },
  ];

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

  // Convert units to base units (g for weight, ml for volume)
  const convertToBaseUnit = (quantity, unit) => {
    const value = parseFloat(quantity);
    if (isNaN(value)) return { quantity: 0, unit };

    switch (unit) {
      case "kg":
        return { quantity: value * 1000, unit: "g" };
      case "l":
        return { quantity: value * 1000, unit: "ml" };
      case "pcs":
        return { quantity: value * 60, unit: "g" }; // Assuming 1 pcs = 60g
      case "g":
      case "ml":
      default:
        return { quantity: value, unit };
    }
  };

  // Load categories and ingredients
  const loadIngredients = async () => {
    try {
      const ingRes = await api.get("/ingredients");
      setIngredients(ingRes.data);
    } catch (err) {
      showModal("error", "Error", "Failed to load ingredients.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await api.get("/category");
        setCategories(catRes.data);
        await loadIngredients();
      } catch (err) {
        showModal("error", "Error", "Failed to load data. Please refresh the page.");
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
          amount: amount || "",
        });
      } else {
        updated[variantIndex].ingredients[existingIndex].amount = amount || "";
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
      { variant_name: "", price: "", ingredients: [] },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) {
      showModal("warning", "Cannot Remove", "At least one variant is required.");
      return;
    }
    
    showModal(
      "confirm",
      "Remove Variant",
      `Are you sure you want to remove Variant ${index + 1}?`,
      () => {
        const updated = variants.filter((_, i) => i !== index);
        setVariants(updated);
        
        // Remove search query for this variant
        const newSearchQueries = { ...searchQueries };
        delete newSearchQueries[index];
        setSearchQueries(newSearchQueries);
      },
      "Remove",
      true
    );
  };

  // Handle search query change
  const handleSearchChange = (variantIndex, query) => {
    setSearchQueries({ ...searchQueries, [variantIndex]: query });
  };

  // Filter ingredients based on search query
  const getFilteredIngredients = (variantIndex) => {
    const query = searchQueries[variantIndex] || "";
    if (!query.trim()) return ingredients;
    
    return ingredients.filter((ing) =>
      ing.ingredient_name.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Add new ingredient
  const handleAddIngredient = async () => {
    if (!newIngredient.ingredient_name || !newIngredient.quantity || !newIngredient.unit) {
      showModal("warning", "Missing Fields", "All ingredient fields are required.");
      return;
    }

    try {
      setAddingIngredient(true);
      
      // Convert to base unit before sending
      const converted = convertToBaseUnit(newIngredient.quantity, newIngredient.unit);
      
      await api.post("/ingredients/add", {
        ingredient_name: newIngredient.ingredient_name,
        quantity: converted.quantity,
        unit: converted.unit,
      });
      
      showModal("success", "Success", `Ingredient added successfully! (${converted.quantity} ${converted.unit})`);
      setShowAddIngredient(false);
      setNewIngredient({ ingredient_name: "", quantity: "", unit: "g" });
      
      // Reload ingredients
      await loadIngredients();
    } catch (err) {
      showModal("error", "Error", err.response?.data?.message || "Failed to add ingredient. Please try again.");
    } finally {
      setAddingIngredient(false);
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_id || !form.product_name) {
      showModal("warning", "Missing Fields", "Category and Product Name are required.");
      return;
    }

    if (variants.some((v) => !v.variant_name || !v.price)) {
      showModal("warning", "Missing Fields", "All variants must have a name and price.");
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
      
      showModal("success", "Success", "Product added successfully!", () => {
        navigate("/dashboard/product");
      });
    } catch (err) {
      console.error("Error adding product:", err);
      showModal("error", "Error", "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
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

        {/* Add Ingredient Modal */}
        {showAddIngredient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-slideUp">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Add New Ingredient</h3>
                <button
                  onClick={() => {
                    setShowAddIngredient(false);
                    setNewIngredient({ ingredient_name: "", quantity: "", unit: "g" });
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={addingIngredient}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Ingredient Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ingredient Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Coffee Beans, Milk, Sugar"
                    value={newIngredient.ingredient_name}
                    onChange={(e) =>
                      setNewIngredient({ ...newIngredient, ingredient_name: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    disabled={addingIngredient}
                  />
                </div>

                {/* Quantity & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quantity <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1000"
                      value={newIngredient.quantity}
                      onChange={(e) =>
                        setNewIngredient({ ...newIngredient, quantity: e.target.value })
                      }
                      onWheel={(e) => e.target.blur()}
                      step="0.01"
                      min="0"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      disabled={addingIngredient}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unit <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={newIngredient.unit}
                      onChange={(e) =>
                        setNewIngredient({ ...newIngredient, unit: e.target.value })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white cursor-pointer"
                      disabled={addingIngredient}
                    >
                      {unitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversion Preview */}
                {newIngredient.quantity && newIngredient.unit && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-900 mb-1">Conversion Preview:</p>
                    <p className="text-sm text-blue-700">
                      {newIngredient.quantity} {newIngredient.unit} = {" "}
                      <span className="font-bold">
                        {convertToBaseUnit(newIngredient.quantity, newIngredient.unit).quantity}{" "}
                        {convertToBaseUnit(newIngredient.quantity, newIngredient.unit).unit}
                      </span>
                    </p>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-[#073dbe]">Tip:</span> Units will be automatically converted (kg→g, l→ml, pcs→60g) for consistent tracking.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 p-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowAddIngredient(false);
                    setNewIngredient({ ingredient_name: "", quantity: "", unit: "g" });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all font-medium text-sm"
                  disabled={addingIngredient}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIngredient}
                  className="flex-1 px-4 py-2 bg-[#073dbe] hover:bg-[#052d99] text-white rounded-lg transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={addingIngredient}
                >
                  {addingIngredient ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus size={16} />
                      Add Ingredient
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiPackage className="text-white text-xl" />
                </div>
                {isEditing ? "Edit Product" : "Create Product"}
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                {isEditing
                  ? "Update product details and variants"
                  : "Add a new product with variants to your menu"}
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
                  disabled={loading}
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
                    disabled={loading}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`${
                      loading ? "cursor-not-allowed" : "cursor-pointer"
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Product Variants
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddIngredient(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                  disabled={loading}
                >
                  <FiPlus size={16} />
                  Add Ingredient
                </button>
                <button
                  type="button"
                  onClick={addVariant}
                  className="bg-[#073dbe] hover:bg-[#052d99] text-white px-3 py-2 rounded-lg transition-all font-medium flex items-center gap-2 text-sm"
                  disabled={loading}
                >
                  <FiPlus size={16} />
                  Add Variant
                </button>
              </div>
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
                    </h3>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Select Ingredients
                      </h4>
                      {/* Search Bar */}
                      <div className="relative w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search ingredients..."
                          value={searchQueries[index] || ""}
                          onChange={(e) => handleSearchChange(index, e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                      {getFilteredIngredients(index).length > 0 ? (
                        getFilteredIngredients(index).map((ing) => {
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
                                      selected?.amount || "",
                                      e.target.checked
                                    )
                                  }
                                  className="mt-0.5 w-4 h-4 text-[#073dbe] rounded focus:ring-2 focus:ring-blue-200"
                                  disabled={loading}
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
                                          e.target.value,
                                          true
                                        )
                                      }
                                      onWheel={(e) => e.target.blur()}
                                      step="0.01"
                                      min="0"
                                      className="w-full mt-2 p-2 border border-[#073dbe] rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                      disabled={loading}
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
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white py-3 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <FiCheckCircle size={18} />
                  {isEditing ? "Update Product" : "Create Product"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/product")}
              className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50"
              disabled={loading}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
