import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

export default function Modal({ isOpen, onClose, title, message, type = "info", onConfirm, confirmText = "OK", showCancel = false }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-green-600" size={48} />;
      case "error":
        return <FiAlertCircle className="text-red-600" size={48} />;
      case "warning":
        return <FiAlertTriangle className="text-yellow-600" size={48} />;
      case "confirm":
        return <FiAlertTriangle className="text-orange-600" size={48} />;
      default:
        return <FiInfo className="text-blue-600" size={48} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "error":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "confirm":
        return "bg-orange-600 hover:bg-orange-700";
      default:
        return "bg-[#073dbe] hover:bg-[#052d99]";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <div className="mb-4 flex justify-center">
            {getIcon()}
          </div>
          <p className="text-slate-600 text-sm">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-200">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all font-medium text-sm"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-all font-medium text-sm ${getColor()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
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