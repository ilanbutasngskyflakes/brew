import { useState } from "react";
import api from "../../../../api/api";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiX, FiPlus, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function Create() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

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

  const showModal = (type, message) => {
    setModal({ show: true, type, message });
  };

  const closeModal = () => {
    setModal({ show: false, type: "", message: "" });
    if (modal.type === "success") {
      navigate("/dashboard/ingredients");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Convert to base units before submitting
      const converted = convertToBaseUnit(formData.quantity, formData.unit);
      const dataToSubmit = {
        ingredient_name: formData.ingredient_name,
        quantity: converted.quantity,
        unit: converted.unit,
      };

      await api.post("/ingredients/add", dataToSubmit);
      showModal("success", "Ingredient added successfully!");
    } catch (error) {
      showModal("error", error.response?.data?.message || "Error adding ingredient. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
                Add New Ingredient
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Add a new ingredient to your inventory
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

            {/* Quantity & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  step="0.01"
                  min="0"
                  className="p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  required
                  disabled={submitting}
                />
              </div>

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
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-[#073dbe]">Tip:</span> Liters
                will be automatically converted to ml, and kilograms to grams for
                consistent tracking.
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
                    Adding...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    Add Ingredient
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/ingredients")}
                className="flex-1 sm:flex-none bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-lg transition-all font-medium disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal */}
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