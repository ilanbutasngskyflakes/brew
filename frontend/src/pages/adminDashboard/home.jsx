export default function Home() {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>

      <p className="text-gray-600">
        Welcome to your admin dashboard. Use the sidebar to manage products,
        view inventory, check reports, or adjust settings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-blue-600 text-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Products</h3>
          <p className="text-sm opacity-80">Manage product listings</p>
        </div>

        <div className="p-4 bg-green-600 text-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Inventory</h3>
          <p className="text-sm opacity-80">Track stock levels</p>
        </div>

        <div className="p-4 bg-purple-600 text-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Reports</h3>
          <p className="text-sm opacity-80">View insights & analytics</p>
        </div>
      </div>
    </div>
  );
}
