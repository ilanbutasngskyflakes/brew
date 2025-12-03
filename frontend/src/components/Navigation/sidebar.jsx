import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, Box, Archive, FileText, Settings, LogOut } from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "admin") {
    navigate("/login");
    return null;
  }

  const menuItems = [
    { name: "Home", path: "/dashboard", icon: <Home size={20} /> },     // 👈 NEW
    { name: "Products", path: "/dashboard/product", icon: <Box size={20} /> },
    { name: "Inventory", path: "/dashboard/inventory", icon: <Archive size={20} /> },
    { name: "Ingredients", path: "/dashboard/ingredients", icon: <Archive size={20} /> },
    { name: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-16"
      } bg-[#0d45ce] text-white flex flex-col transition-all duration-300 shadow-xl`}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        {isOpen && <span className="text-xl font-bold tracking-wide">Admin</span>}

        <button
          className="p-2 hover:bg-blue-700 rounded-lg transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 py-2 px-4 rounded-lg transition-all 
              ${isActive ? "bg-blue-900 font-semibold shadow-md" : "hover:bg-blue-800"}
              ${!isOpen ? "justify-center px-0" : ""}`}
            >
              {item.icon}
              {isOpen && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={`flex items-center gap-3 m-4 p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md 
        ${!isOpen ? "justify-center px-0" : ""}`}
      >
        <LogOut size={18} />
        {isOpen && <span>Logout</span>}
      </button>
    </aside>
  );
}
