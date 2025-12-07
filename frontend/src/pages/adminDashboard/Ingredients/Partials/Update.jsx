import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/api";
import { FiPackage, FiX, FiTrash2 } from "react-icons/fi";

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredient = async () => {
      try {
        const res = await api.get(`/ingredients/${id}`);
        setFormData({
          ingredient_name: res.data.ingredient_name,
          quantity: res.data.quantity,
          unit: res.data.unit,
        });
      } catch (error) {
        console.error("Error fetching ingredient:", error);
        alert("Failed to fetch ingredient data");
        navigate("/dashboard/ingredients");
      } finally {
        setLoading(false);
      }
    };

    fetchIngredient();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/ingredients/${id}`, formData);
      alert("Ingredient updated successfully! ✅");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error updating ingredient");
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Are you sure you want to delete this ingredient? This action cannot be undone.")) return;

    try {
      await api.delete(`/ingredients/${id}`);
      alert("Ingredient deleted successfully! 🗑️");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error deleting ingredient");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ingredient...</p>
        </div>
      </div>
    );
  }

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
                Update Ingredient
              </h1>
              <p className="text-gray-600 mt-2 ml-1">
                Modify ingredient details
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
                  <option value="kg">kg (kilograms)</option>
                  <option value="L">L (liters)</option>
                  <option value="pcs">pcs (pieces)</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                Update Ingredient
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2"
              >
                <FiTrash2 size={18} />
                Delete Ingredient
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
