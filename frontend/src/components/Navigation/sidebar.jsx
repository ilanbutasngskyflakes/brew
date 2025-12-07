import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, Box, Archive, FileText, Settings, LogOut, ChevronRight } from "lucide-react";

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
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed top-0 left-0 h-screen ${
          isOpen ? "w-64" : "w-64 lg:w-20"
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-lg z-50 lg:z-30`}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-4 border-b border-slate-200 min-h-[64px] flex-shrink-0">
          <button
            className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Info (when expanded) */}
        {isOpen && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-[#073dbe] font-bold text-sm">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-xs text-slate-600 capitalize">{user.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all group relative
                ${
                  isActive
                    ? "bg-[#073dbe] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }
                ${!isOpen ? "justify-center lg:px-3" : ""}`}
                title={!isOpen ? item.name : ""}
              >
                <span className={`${isActive ? "text-white" : "text-slate-600 group-hover:text-[#073dbe]"} ${!isOpen ? "" : "flex-shrink-0"}`}>
                  {item.icon}
                </span>
                {isOpen && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.name}</span>
                    {isActive && <ChevronRight size={16} className="text-white" />}
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg z-50">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex-shrink-0 border-t border-slate-200">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 m-3 p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all hover:shadow-md group w-[calc(100%-1.5rem)]
            ${!isOpen ? "justify-center" : ""}`}
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">Logout</span>}
            
            {/* Tooltip for collapsed state */}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg z-50">
                Logout
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
              </div>
            )}
          </button>

          {/* Copyright */}
          {isOpen && (
            <div className="px-4 pb-3 text-center">
              <p className="text-xs text-slate-500">© 2025 Barcelo Cafe</p>
            </div>
          )}
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className={`${isOpen ? "w-64" : "w-0 lg:w-20"} flex-shrink-0 transition-all duration-300`} />
    </>
  );
}
