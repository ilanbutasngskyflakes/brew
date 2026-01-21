/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/api";
import { FiPackage, FiX, FiTrash2, FiSave, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
    unit_price: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    const fetchIngredient = async () => {
      try {
        const res = await api.get(`/ingredients/${id}`);
        setFormData({
          ingredient_name: res.data.ingredient_name,
          quantity: res.data.quantity ? res.data.quantity.toString() : "",
          unit: res.data.unit,
          unit_price: typeof res.data.unit_price !== 'undefined' && res.data.unit_price !== null ? res.data.unit_price.toString() : "",
        });
      } catch (error) {
        showModal("error", "Failed to fetch ingredient data");
        setTimeout(() => navigate("/dashboard/ingredients"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredient();
  }, [id, navigate]);

  // Unit conversion functions
  const convertToBaseUnit = (quantity, unit) => {
    const value = parseFloat(quantity);

    // Convert liquids to ml
    if (unit === "L") {
      return { quantity: value * 1000, unit: "ml" };
    }

    // Convert solids to g
    if (unit === "kg") {
      return { quantity: value * 1000, unit: "g" };
    }

    // Return as-is for base units (ml, g, pcs)
    return { quantity: value, unit };
  };

  // Convert price when unit changes (like L to ml or kg to g)
  const convertPriceWithUnit = (priceEntered, fromUnit, toUnit) => {
    if (!priceEntered) return "";

    const price = parseFloat(priceEntered);
    if (isNaN(price)) return "";

    // If switching FROM L/kg TO ml/g (1000x more units, so price per unit gets smaller)
    if ((fromUnit === "L" && toUnit === "ml") || (fromUnit === "kg" && toUnit === "g")) {
      return (price / 1000).toString();
    }

    // If switching FROM ml/g TO L/kg (1000x fewer units, so price per unit gets bigger)
    if ((fromUnit === "ml" && toUnit === "L") || (fromUnit === "g" && toUnit === "kg")) {
      return (price * 1000).toString();
    }

    // No conversion needed
    return price.toString();
  };

  // Calculate unit price based on entry unit - returns as string to preserve precision
  const calculateUnitPrice = (priceEntered, unit) => {
    if (!priceEntered) return "";
    
    const price = parseFloat(priceEntered);
    if (isNaN(price)) return "";

    let result = price;

    // If user enters price in L or kg, convert to base unit (ml or g)
    if (unit === "L") {
      result = price / 1000; // ₱/ml
    } else if (unit === "kg") {
      result = price / 1000; // ₱/g
    }

    // Return as string with full precision
    return result.toString();
  };

  const showModal = (type, message) => {
    setModal({ show: true, type, message });
  };

  const closeModal = () => {
    setModal({ show: false, type: "", message: "" });
    if (modal.type === "success") {
      navigate("/dashboard/ingredients");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "unit") {
      // Auto convert price when unit changes
      const newPrice = convertPriceWithUnit(formData.unit_price, formData.unit, value);
      setFormData((prev) => ({
        ...prev,
        unit: value,
        unit_price: newPrice,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Convert to base units before submitting
      const converted = convertToBaseUnit(formData.quantity, formData.unit);
      const calculatedPrice = calculateUnitPrice(formData.unit_price, formData.unit);

      const dataToSubmit = {
        ingredient_name: formData.ingredient_name,
        quantity: converted.quantity.toString(),
        unit: converted.unit,
        unit_price: calculatedPrice !== "" ? calculatedPrice : null,
      };

      await api.put(`/ingredients/${id}`, dataToSubmit);
      showModal("success", "Ingredient updated successfully!");
    } catch (error) {
      showModal("error", error.response?.data?.message || "Error updating ingredient. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setDeleteModal(false);
      await api.delete(`/ingredients/${id}`);
      showModal("success", "Ingredient deleted successfully!");
    } catch (error) {
      showModal("error", error.response?.data?.message || "Error deleting ingredient. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading ingredient...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiPackage className="text-white text-xl" />
                </div>
                Update Ingredient
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Modify ingredient details
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/ingredients")}
              className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-all"
              disabled={submitting}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ingredient Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-2">
                Ingredient Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="ingredient_name"
                value={formData.ingredient_name}
                onChange={handleChange}
                placeholder="e.g., Espresso Beans, Milk, Sugar"
                className="p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                required
                disabled={submitting}
              />
            </div>

            {/* Quantity, Unit, and Unit Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quantity */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Quantity <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="e.g., 1000"
                  step="any"
                  min="0"
                  className="p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Unit */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Unit <span className="text-red-600">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer"
                  disabled={submitting}
                >
                  <option value="ml">ml (milliliters)</option>
                  <option value="L">L (liters)</option>
                  <option value="g">g (grams)</option>
                  <option value="kg">kg (kilograms)</option>
                  <option value="pcs">pcs (pieces)</option>
                </select>
              </div>

              {/* Unit Price */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2">
                  Price per {formData.unit || "unit"} (₱)
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()}
                  placeholder="e.g., 0.0015 or 80.00"
                  step="any"
                  min="0"
                  className="p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Conversion Preview */}
            {formData.unit_price && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold text-green-700">Cost per base unit:</span>{" "}
                  ₱{calculateUnitPrice(formData.unit_price, formData.unit)}/
                  {formData.unit === "L" ? "ml" : formData.unit === "kg" ? "g" : formData.unit}
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-[#073dbe]">Tip:</span> Price automatically adjusts when you change units. Switch from L→ml or kg→g and the price will convert proportionally.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white py-2.5 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    Update Ingredient
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModal(true)}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white py-2.5 px-6 rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Delete</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this ingredient? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                modal.type === "success" ? "bg-green-100" : "bg-red-100"
              }`}>
                {modal.type === "success" ? (
                  <FiCheckCircle size={24} className="text-green-600" />
                ) : (
                  <FiAlertCircle size={24} className="text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {modal.type === "success" ? "Success" : "Error"}
              </h3>
            </div>
            
            <p className="text-slate-600 mb-6">{modal.message}</p>
            
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  modal.type === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

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