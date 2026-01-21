/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { FiArrowLeft, FiSave, FiCheckCircle, FiAlertCircle, FiPlus } from "react-icons/fi";

export default function AddOnEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: "info", 
    title: "",
    message: "" 
  });
  
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    quantity: "",
    unit: "ml",
    price: "",
    unit_price: "",
    quantity_per_item: "1"
  });

  useEffect(() => {
    fetchAddOn();
  }, [id]);

  const fetchAddOn = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/addons/${id}`);
      setAddOnForm({
        name: response.data.name,
        quantity: response.data.quantity,
        unit: response.data.unit,
        price: response.data.price,
        unit_price: response.data.unit_price,
        quantity_per_item: response.data.quantity_per_item || "1"
      });
    } catch (error) {
      showModal("error", "Load Failed", "Failed to load add-on");
      setTimeout(() => navigate("/dashboard/ingredients"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, title, message) => {
    setModal({ 
      isOpen: true, 
      type, 
      title,
      message 
    });
  };

  const closeModal = () => {
    setModal({ 
      isOpen: false, 
      type: "info", 
      title: "",
      message: "" 
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddOnForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!addOnForm.name || !addOnForm.quantity || !addOnForm.price || !addOnForm.quantity_per_item) {
      showModal("error", "Missing Fields", "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/addons/${id}`, {
        name: addOnForm.name,
        quantity: Number(addOnForm.quantity),
        unit: addOnForm.unit,
        price: Number(addOnForm.price),
        unit_price: Number(addOnForm.unit_price),
        quantity_per_item: Number(addOnForm.quantity_per_item)
      });

      showModal("success", "Success", "Add-on updated successfully!");
      setTimeout(() => navigate("/dashboard/ingredients"), 1500);
    } catch (error) {
      showModal("error", "Update Failed", error.response?.data?.message || "Error updating add-on");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard/ingredients")}
          className="flex items-center gap-2 text-[#073dbe] hover:text-[#052d99] font-medium mb-6 transition-colors"
        >
          <FiArrowLeft size={20} />
          Back to Ingredients
        </button>

        <div className="bg-white rounded-lg border border-slate-200 p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Edit Add-On</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Add-On Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Add-On Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={addOnForm.name}
                onChange={handleChange}
                placeholder="e.g., Brown Sugar Syrup"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                required
                disabled={submitting}
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={addOnForm.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={addOnForm.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm cursor-pointer bg-white"
                  required
                  disabled={submitting}
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </div>

            {/* Usage per Product */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Usage per Product <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="quantity_per_item"
                  value={addOnForm.quantity_per_item}
                  onChange={handleChange}
                  placeholder="1"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                  required
                  disabled={submitting}
                />
                <div className="flex items-center justify-center px-3 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 min-w-fit">
                  {addOnForm.unit || "ml"}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">How much is used per drink</p>
            </div>

            {/* Stock Calculation */}
            {addOnForm.quantity && addOnForm.quantity_per_item && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Total Stock:</span> {Number(addOnForm.quantity).toFixed(2)} {addOnForm.unit || "ml"}
                </p>
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Usage per Product:</span> {Number(addOnForm.quantity_per_item).toFixed(2)} {addOnForm.unit || "ml"}
                </p>
                <p className="text-sm font-bold text-blue-700">
                  ≈ {Math.floor(Number(addOnForm.quantity) / Number(addOnForm.quantity_per_item))} servings possible
                </p>
              </div>
            )}

            {/* Cost & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cost per Unit (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={addOnForm.unit_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Selling Price (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={addOnForm.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Profit Info */}
            {addOnForm.unit_price && addOnForm.price && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  <span className="font-medium">Profit per Unit:</span>
                  <span className="font-bold float-right">₱{(Number(addOnForm.price) - Number(addOnForm.unit_price)).toFixed(2)}</span>
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard/ingredients")}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Saving..." : <><FiPlus size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success/Error Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                {modal.title}
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