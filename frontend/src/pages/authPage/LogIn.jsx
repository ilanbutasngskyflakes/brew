import { useState } from "react";
import api from "../../api/api";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../components/modals";
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false,
  });

  const showModal = (
    type,
    title,
    message,
    onConfirm = null,
    confirmText = "OK",
    showCancel = false
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel,
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.password.trim()) {
      showModal("warning", "Missing Fields", "Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("http://localhost:8080/user/auth", form);
      const user = res.data.user;

      // Save user in localStorage
      localStorage.setItem("user", JSON.stringify(user));

      showModal("success", "Login Successful", `Welcome back, ${user.name}!`, () => {
        if (user.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/cashier");
        }
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "";
      
      // Specific error messages
      if (errorMessage.toLowerCase().includes("username") || errorMessage.toLowerCase().includes("user not found")) {
        showModal("error", "Username Not Found", "The username you entered does not exist. Please check and try again.");
      } else if (errorMessage.toLowerCase().includes("password")) {
        showModal("error", "Incorrect Password", "The password you entered is incorrect. Please try again.");
      } else {
        showModal("error", "Login Failed", errorMessage || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        showCancel={modal.showCancel}
      />

      <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-lg border border-slate-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-[#073dbe] w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FiLogIn className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-600 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                name="name"
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#073dbe] hover:bg-[#052d99] text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                <FiLogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        
      </div>
    </div>
  );
}
