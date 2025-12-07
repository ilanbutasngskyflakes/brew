import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { 
  FiPackage, 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiAlertCircle,
  FiSearch
} from "react-icons/fi";

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState("all");
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
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/ingredients/${id}`);
      alert("Ingredient deleted successfully");
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
        return Number(item.quantity) < 100;
      } else if (filterStock === "normal") {
        return Number(item.quantity) >= 100;
      }
      return true;
    });

  const lowStockCount = ingredients.filter(item => Number(item.quantity) < 100).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading ingredients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiPackage className="text-white text-xl" />
                </div>
                Ingredient Management
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Track and manage your inventory
              </p>
            </div>
            <Link
              to="/dashboard/ingredients/new"
              className="w-full lg:w-auto bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
            >
              <FiPlus size={18} />
              Add Ingredient
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <FiPackage className="text-[#073dbe]" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Ingredients</div>
            <div className="text-2xl font-bold text-slate-900">{ingredients.length}</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-2.5 rounded-lg">
                <FiPackage className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Normal Stock</div>
            <div className="text-2xl font-bold text-slate-900">
              {ingredients.filter(i => Number(i.quantity) >= 100).length}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-50 p-2.5 rounded-lg">
                <FiAlertCircle className="text-red-600" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Low Stock Alert</div>
            <div className="text-2xl font-bold text-slate-900">{lowStockCount}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
              />
            </div>

            {/* Filter */}
            <div className="lg:w-48">
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer text-sm bg-white"
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="normal">Normal Stock</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-slate-600">
            <span className="font-semibold text-[#073dbe]">{filteredIngredients.length}</span>
            {' '}{filteredIngredients.length === 1 ? 'ingredient' : 'ingredients'} found
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && filterStock !== "low" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-red-600 text-xl flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800 mb-1 text-sm">Low Stock Alert</h4>
                <p className="text-sm text-red-700">
                  {lowStockCount} ingredient{lowStockCount !== 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} to be restocked
                </p>
              </div>
              <button
                onClick={() => setFilterStock("low")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                View Items
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredIngredients.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Ingredients Found</h3>
            <p className="text-slate-600 text-sm mb-6">
              {searchQuery ? "Try adjusting your search" : "Start by adding your first ingredient"}
            </p>
            <Link
              to="/dashboard/ingredients/new"
              className="inline-flex items-center gap-2 bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium text-sm"
            >
              <FiPlus size={16} />
              Add Ingredient
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                      Ingredient Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                      Quantity
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                      Unit
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIngredients.map((item) => {
                    const isLowStock = Number(item.quantity) < 100;
                    
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <FiPackage className="text-[#073dbe]" size={16} />
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">
                              {item.ingredient_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-base font-bold ${
                            isLowStock ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.quantity ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 font-medium text-sm">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <FiAlertCircle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/dashboard/ingredients/${item.id}/edit`)}
                              className="bg-[#073dbe] hover:bg-[#052d99] text-white p-2 rounded-lg transition-all"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.ingredient_name)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
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
