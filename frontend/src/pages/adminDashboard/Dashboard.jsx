import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login"); 
    } else if (user.role !== "admin") {
      navigate("/login"); 
    }
  }, [user, navigate]);

  const menuItems = [
    { name: "Products", path: "/dashboard/products" },
    { name: "Inventory", path: "/dashboard/inventory" },
    { name: "Reports", path: "/dashboard/reports" },
    { name: "Settings", path: "/dashboard/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2c0d77] text-white flex flex-col">
        <div className="p-6 text-xl font-bold">Dashboard</div>
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="block py-2 px-4 rounded hover:bg-purple-800 transition"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 p-2 bg-red-600 rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user?.first_name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            <p>Quick stats and dashboard overview go here.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
            <p>Recent logs, user activity, or updates here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
