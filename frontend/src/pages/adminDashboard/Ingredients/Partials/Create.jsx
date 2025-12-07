import { useState } from "react";
import api from "../../../../api/api";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiX, FiPlus } from "react-icons/fi";

export default function Create() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post("/ingredients/add", formData);
      alert("Ingredient added successfully");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error adding ingredient");
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
                  <option value="g">g (grams)</option>
                  <option value="kg">kg (kilograms)</option>
                  <option value="L">L (liters)</option>
                  <option value="pcs">pcs (pieces)</option>
                </select>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-[#073dbe]">Tip:</span> Use
                consistent units across all ingredients for accurate tracking.
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
