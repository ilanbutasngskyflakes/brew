/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/api";
import { 
  FiArrowLeft, 
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";

export default function AddCashFlowTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });

  const [formData, setFormData] = useState({
    type: "payout",
    category: "supplies",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    reference: ""
  });

  useEffect(() => {
    if (isEditMode) {
      fetchTransaction();
    }
  }, [id]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/cashflow/${id}`);  // ← Change to /cashflow
      setFormData({
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount.toString(),
        date: data.date,
        reference: data.reference || ""
      });
    } catch (err) {
      showModal("error", "Failed to load transaction details.");
      setTimeout(() => navigate("/dashboard/cashflow"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, message) => {
    setModal({ show: true, type, message });
  };

  const closeModal = () => {
    setModal({ show: false, type: "", message: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.category) {
      showModal("error", "Please fill in all required fields.");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      showModal("error", "Amount must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (isEditMode) {
        await api.put(`/cashflow/${id}`, payload);  // ← Change to /cashflow
        showModal("success", "Transaction updated successfully!");
      } else {
        await api.post("/cashflow", payload);  // ← Change to /cashflow
        showModal("success", "Transaction recorded successfully!");
      }

      setTimeout(() => {
        navigate("/dashboard/cashflow");
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      showModal("error", error.response?.data?.message || "Failed to save transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (type, category) => {
    return category || "Unknown";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading transaction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard/cashflow")}
            className="flex items-center gap-2 text-[#073dbe] hover:text-[#052d99] font-medium mb-4 transition-colors text-sm"
          >
            <FiArrowLeft size={18} />
            Back to Cash Flow
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isEditMode ? "Edit Transaction" : "New Transaction"}
          </h1>
          <p className="text-slate-600">
            {isEditMode 
              ? "Update the transaction details below" 
              : "Record a new cash in or cash out transaction"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Transaction Type <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['payin', 'payout'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFormChange({ target: { name: 'type', value: type } })}
                    className={`p-4 rounded-lg border-2 transition-all font-medium ${
                      formData.type === type
                        ? type === 'payin'
                          ? 'border-green-600 bg-green-50 text-green-900'
                          : 'border-red-600 bg-red-50 text-red-900'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {type === 'payin' ? '💰 Pay In' : '💸 Pay Out'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Category <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                placeholder="e.g., Petty Cash, Supplies, Payroll"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm font-medium"
              />
              <p className="text-xs text-slate-500 mt-2">Enter any category name</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Description <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="e.g., Coffee beans purchase, Daily sales, Employee salary"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Provide a clear description of the transaction</p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Amount (₱) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₱</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm font-medium"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm font-medium"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Reference / Notes
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleFormChange}
                placeholder="e.g., Invoice #12345, Check #001, Receipt #789"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Optional: Add invoice number, check number, or any reference</p>
            </div>

            {/* Summary Card */}
            <div className={`p-4 rounded-lg ${
              formData.type === 'payin' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="text-sm font-medium text-slate-600 mb-2">Summary</div>
              <div className={`text-2xl font-bold ${
                formData.type === 'payin' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formData.type === 'payin' ? '+' : '-'}₱{(parseFloat(formData.amount) || 0).toFixed(2)}
              </div>
              <div className="text-xs text-slate-600 mt-2">
                {formData.description || 'No description provided'}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate("/dashboard/cashflow")}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-lg transition-all font-medium text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#073dbe] hover:bg-[#052d99] disabled:bg-slate-400 text-white px-6 py-3 rounded-lg transition-all font-medium text-base"
              >
                {submitting 
                  ? "Saving..." 
                  : isEditMode 
                  ? "Update Transaction" 
                  : "Record Transaction"}
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
    </div>
  );
}