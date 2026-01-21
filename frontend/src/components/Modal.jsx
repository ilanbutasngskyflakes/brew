import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info", 
  onConfirm, 
  confirmText = "OK", 
  showCancel = false 
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-green-600" size={28} />;
      case "error":
        return <FiAlertCircle className="text-red-600" size={28} />;
      case "warning":
        return <FiAlertTriangle className="text-yellow-600" size={28} />;
      case "confirm":
        return <FiAlertTriangle className="text-orange-600" size={28} />;
      default:
        return <FiInfo className="text-blue-600" size={28} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100";
      case "error":
        return "bg-red-100";
      case "warning":
        return "bg-yellow-100";
      case "confirm":
        return "bg-orange-100";
      default:
        return "bg-blue-100";
    }
  };

  const getButtonColor = () => {
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

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-slideUp">
        {/* Icon */}
        <div className={`flex items-center justify-center w-16 h-16 rounded-full ${getBgColor()} mx-auto mb-4`}>
          {getIcon()}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-slate-600 text-center text-sm mb-6">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${getButtonColor()}`}
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