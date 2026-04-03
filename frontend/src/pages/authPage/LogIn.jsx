import { useState, useContext, useEffect } from "react";
import api from "../../api/api";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../../components/modals";
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";
import { ShopContext } from "../../context/createShopContext";

export default function Login() {
  const navigate = useNavigate();
  const { shopId, shop } = useContext(ShopContext);
  
  const [brandColor, setBrandColor] = useState("#073dbe");
  const [isGoodCoffee, setIsGoodCoffee] = useState(false);
  const [textColor, setTextColor] = useState("white");

  // Determine colors based on shop
  useEffect(() => {
    // Priority 1: Use shop context if available
    if (shop?.brand_color) {
      setBrandColor(shop.brand_color);
      setIsGoodCoffee(shop.id === 2);
      setTextColor(shop.id === 2 ? "#FFD700" : "white");
    }
    // Priority 2: Use shopId from localStorage
    else if (shopId) {
      // Good Coffee (Shop 2) has black color
      if (shopId === 2) {
        setBrandColor("#000000");
        setIsGoodCoffee(true);
        setTextColor("#FFD700");
      } else {
        setBrandColor("#073dbe");
        setIsGoodCoffee(false);
        setTextColor("white");
      }
    }
    // Priority 3: Check localStorage directly
    else {
      const stored = localStorage.getItem('selectedShop');
      if (stored === '2') {
        setBrandColor("#000000");
        setIsGoodCoffee(true);
        setTextColor("#FFD700");
      } else {
        setBrandColor("#073dbe");
        setIsGoodCoffee(false);
        setTextColor("white");
      }
    }
  }, [shopId, shop]);

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

    // Check if shop is selected
    if (!shopId) {
      showModal("error", "No Shop Selected", "Please select a shop first.", () => {
        navigate('/');
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("http://localhost:8080/user/auth", form);
      const user = res.data.user;

      // Verify user belongs to selected shop
      if (user.shop_id !== shopId) {
        showModal("error", "Shop Mismatch", `This user account is linked to a different shop. You selected a different shop on the previous screen.`, () => {
          navigate('/');
        });
        setLoading(false);
        return;
      }

      // Save user with shopId in localStorage
      localStorage.setItem("user", JSON.stringify({
        ...user,
        shopId: shopId
      }));

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
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: brandColor }}>
            <FiLogIn className="text-2xl" style={{ color: textColor }} />
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
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg transition-all outline-none"
                style={{ 
                  borderColor: "rgba(203, 213, 225, 1)"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = brandColor;
                  e.target.style.boxShadow = `0 0 0 3px ${isGoodCoffee ? 'rgba(255, 215, 0, 0.1)' : 'rgba(7, 61, 190, 0.1)'}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(203, 213, 225, 1)";
                  e.target.style.boxShadow = "none";
                }}
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
                className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg transition-all outline-none"
                style={{ 
                  borderColor: "rgba(203, 213, 225, 1)"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = brandColor;
                  e.target.style.boxShadow = `0 0 0 3px ${isGoodCoffee ? 'rgba(255, 215, 0, 0.1)' : 'rgba(7, 61, 190, 0.1)'}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(203, 213, 225, 1)";
                  e.target.style.boxShadow = "none";
                }}
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
            className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
            style={{
              backgroundColor: brandColor,
              color: textColor,
              ...(isGoodCoffee ? { border: "2px solid #FFD700" } : {})
            }}
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
