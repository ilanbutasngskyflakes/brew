import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

export default function Modal({
  isOpen,
  onClose,
  type = "info",
  title = "",
  message = "",
  onConfirm = null,
  confirmText = "OK",
  showCancel = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            type === "success" ? "bg-green-100" : 
            type === "warning" ? "bg-yellow-100" :
            "bg-red-100"
          }`}>
            {type === "success" ? (
              <FiCheckCircle size={24} className="text-green-600" />
            ) : type === "warning" ? (
              <FiAlertCircle size={24} className="text-yellow-600" />
            ) : (
              <FiAlertCircle size={24} className="text-red-600" />
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {title}
          </h3>
        </div>
        
        <p className="text-slate-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg transition-colors font-medium text-white ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : type === "warning"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}