import { useState } from "react";
import api from "../../../../api/api";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiX } from "react-icons/fi";

export default function Create() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/ingredients/add", formData);
      alert("Ingredient added successfully! ✅");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error adding ingredient");
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
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                  <FiPackage className="text-white text-2xl" />
                </div>
                Add New Ingredient
              </h1>
              <p className="text-gray-600 mt-2 ml-1">
                Add a new ingredient to your inventory
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/ingredients")}
              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ingredient Name */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">
                Ingredient Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="ingredient_name"
                value={formData.ingredient_name}
                onChange={handleChange}
                placeholder="e.g., Espresso Beans, Milk, Sugar"
                className="p-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                required
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Quantity <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  step="0.01"
                  min="0"
                  className="p-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Unit <span className="text-red-600">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none cursor-pointer"
                >
                  <option value="ml">ml (milliliters)</option>
                  <option value="g">g (grams)</option>
                  
                </select>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-700">
                <span className="font-semibold">💡 Tip:</span> Make sure to use
                consistent units across all ingredients for accurate tracking.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Add Ingredient
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard/ingredients")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
