import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { 
  FiPackage, 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiAlertCircle,
  FiSearch,
  FiFilter
} from "react-icons/fi";

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState("all"); // all, low, normal
  const navigate = useNavigate();

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ingredients");
      setIngredients(res.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      alert("Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`⚠️ Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/ingredients/${id}`);
      alert("Ingredient deleted successfully! 🗑️");
      fetchIngredients();
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      alert("Failed to delete ingredient");
    }
  };

  const filteredIngredients = ingredients
    .filter((item) => 
      item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((item) => {
      if (filterStock === "low") {
        return Number(item.quantity) < 100; // Adjust threshold as needed
      } else if (filterStock === "normal") {
        return Number(item.quantity) >= 100;
      }
      return true;
    });

  const lowStockCount = ingredients.filter(item => Number(item.quantity) < 100).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                  <FiPackage className="text-white text-2xl" />
                </div>
                Ingredient Management
              </h1>
              <p className="text-gray-600 mt-2 ml-1">
                Track and manage your inventory
              </p>
            </div>
            <Link
              to="/dashboard/ingredients/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
            >
              <FiPlus className="text-xl" />
              Add Ingredient
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FiPackage className="text-indigo-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{ingredients.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total Ingredients</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiPackage className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {ingredients.filter(i => Number(i.quantity) >= 100).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Normal Stock</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <FiAlertCircle className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{lowStockCount}</div>
            <div className="text-sm text-gray-600 font-medium">Low Stock Alert</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-2 border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm"
              />
            </div>

            {/* Filter */}
            <div className="lg:w-48">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none cursor-pointer text-sm bg-white"
                >
                  <option value="all">All Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="normal">Normal Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">{filteredIngredients.length}</span>
            {filteredIngredients.length === 1 ? 'ingredient' : 'ingredients'} found
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && filterStock !== "low" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-red-600 text-2xl flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800 mb-1">⚠️ Low Stock Alert</h4>
                <p className="text-sm text-red-700">
                  {lowStockCount} ingredient{lowStockCount !== 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} to be restocked
                </p>
              </div>
              <button
                onClick={() => setFilterStock("low")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                View Items
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredIngredients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Ingredients Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? "Try adjusting your search" : "Start by adding your first ingredient"}
            </p>
            <Link
              to="/dashboard/ingredients/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <FiPlus />
              Add Ingredient
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Ingredient Name
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredIngredients.map((item) => {
                    const isLowStock = Number(item.quantity) < 100;
                    
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <FiPackage className="text-indigo-600" />
                            </div>
                            <span className="font-semibold text-gray-800">
                              {item.ingredient_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-lg font-bold ${
                            isLowStock ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.quantity ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 font-medium">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                              <FiAlertCircle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              ✓ Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/dashboard/ingredients/${item.id}/edit`)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.ingredient_name)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
