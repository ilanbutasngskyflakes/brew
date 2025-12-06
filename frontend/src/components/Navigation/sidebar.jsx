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
    { name: "Home", path: "/dashboard", icon: <Home size={20} /> },
    { name: "Products", path: "/dashboard/product", icon: <Box size={20} /> },
    { name: "Ingredients", path: "/dashboard/ingredients", icon: <Archive size={20} /> },
    { name: "Reports", path: "/dashboard/reports", icon: <FileText size={20} /> },
    { name: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed top-0 left-0 h-screen ${isOpen ? "w-64" : "w-64 lg:w-16"} bg-[#0d45ce] text-white flex flex-col transition-all duration-300 shadow-2xl z-50 lg:z-30`}
      >
        {/* Top Section */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700 min-h-[64px] flex-shrink-0">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">A</span>
              </div>
              <span className="text-lg lg:text-xl font-bold tracking-wide">Admin Panel</span>
            </div>
          )}

          <button
            className="p-2 hover:bg-blue-700 rounded-lg transition-all active:scale-95"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center gap-3 py-2.5 px-4 rounded-lg transition-all active:scale-95
                ${
                  isActive
                    ? "bg-blue-900 font-semibold shadow-md border-l-4 border-white"
                    : "hover:bg-blue-800 border-l-4 border-transparent"
                }
                ${!isOpen ? "justify-center px-2 lg:px-2" : ""}`}
                title={!isOpen ? item.name : ""}
              >
                <span className={!isOpen ? "" : "flex-shrink-0"}>{item.icon}</span>
                {isOpen && <span className="text-sm lg:text-base font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 m-3 lg:m-4 p-2.5 lg:p-3 bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md active:scale-95
            ${!isOpen ? "justify-center px-2" : ""}`}
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut size={20} />
            {isOpen && <span className="text-sm lg:text-base font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Spacer for main content - prevents overlap */}
      <div className={`${isOpen ? "w-64" : "w-0 lg:w-16"} flex-shrink-0 transition-all duration-300`} />
    </>
  );
}
