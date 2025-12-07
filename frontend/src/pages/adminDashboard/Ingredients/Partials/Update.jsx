import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/api";
import { FiPackage, FiX, FiTrash2, FiSave } from "react-icons/fi";

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      setSubmitting(true);
      await api.put(`/ingredients/${id}`, formData);
      alert("Ingredient updated successfully");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error updating ingredient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ingredient? This action cannot be undone.")) return;

    try {
      setSubmitting(true);
      await api.delete(`/ingredients/${id}`);
      alert("Ingredient deleted successfully");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error deleting ingredient");
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
                onClick={handleDelete}
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
