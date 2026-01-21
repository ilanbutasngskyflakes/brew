/* eslint-disable no-unused-vars */
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
  FiCheckCircle,
  FiX
} from "react-icons/fi";

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false,
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: "", isAddOn: false });
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    quantity: "",
    unit: "ml",
    unit_price: "", // Cost per unit (what you paid)
    price: "", // Selling price per unit (what customers pay)
    quantity_per_item: "1" // ✅ Add this
  });
  const [submittingAddOn, setSubmittingAddOn] = useState(false);
  const [addOns, setAddOns] = useState([]);
  const navigate = useNavigate();

  // Helper function to convert base unit price to display unit price
  const convertPriceToDisplayUnit = (baseUnitPrice, unit) => {
    if (typeof baseUnitPrice !== 'number' && typeof baseUnitPrice !== 'string') return 0;
    const price = Number(baseUnitPrice);
    if (isNaN(price)) return 0;

    // Convert FROM base unit to display unit
    if (unit === "L") {
      return price * 1000; // ₱/ml → ₱/L
    } else if (unit === "kg") {
      return price * 1000; // ₱/g → ₱/kg
    }

    // Base units (ml, g,s) - no conversion needed
    return price;
  };

  // Helper function to format price without rounding
  const formatPrice = (price) => {
    if (typeof price !== 'number' && typeof price !== 'string') return '--';
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '--';
    
    // Convert to string and remove trailing zeros after decimal
    return numPrice.toString();
  };

  // Helper function to get the display unit for price
  const getDisplayUnit = (unit) => {
    if (unit === "L") return "L";
    if (unit === "kg") return "kg";
    return unit;
  };

  // Add this helper function near the top with other helpers:
  const getLowStockThreshold = (unit) => {
    // Different thresholds based on unit type
    if (unit === "pcs" || unit === "cups") {
      return 20;  // Low stock for pieces/cups when below 20
    } else if (unit === "ml") {
      return 3000;  // Low stock for ml when below 3000
    } else if (unit === "g") {
      return 500;  // Low stock for grams when below 500
    } else if (unit === "L") {
      return 3;  // Low stock for liters when below 3L (3000ml)
    } else if (unit === "kg") {
      return 0.5;  // Low stock for kg when below 500g
    }
    return 100;  // Default threshold
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ingredientsRes = await api.get("/ingredients");
      setIngredients(ingredientsRes.data);
      fetchAddOns();
    } catch (error) {
      showModal("error", "Load Failed", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, title, message, onConfirm = null, confirmText = "OK", showCancel = false) => {
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
    setModal({ 
      isOpen: false, 
      type: "info",
      title: "",
      message: "",
      onConfirm: null,
      confirmText: "OK",
      showCancel: false,
    });
  };

  const openDeleteModal = (id, name, isAddOn = false) => {
    setDeleteModal({ show: true, id, name, isAddOn });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, id: null, name: "", isAddOn: false });
  };

  const openAddOnModal = () => {
    setShowAddOnModal(true);
  };

  const closeAddOnModal = () => {
    setShowAddOnModal(false);
    setAddOnForm({
      name: "",
      quantity: "",
      unit: "ml",
      unit_price: "",
      price: "",
      quantity_per_item: "1" // ✅ Add this
    });
  };

  const handleDelete = async () => {
    try {
      // Check if it's an add-on or ingredient based on what we're deleting
      const isAddOn = deleteModal.isAddOn || false;
      
      if (isAddOn) {
        // Delete add-on
        await api.delete(`/addons/${deleteModal.id}`);
        showModal("success", "Add-on deleted successfully!");
      } else {
        // Delete ingredient
        await api.delete(`/ingredients/${deleteModal.id}`);
        showModal("success", "Ingredient deleted successfully!");
      }
      
      closeDeleteModal();
      fetchData();
      fetchAddOns();
    } catch (error) {
      closeDeleteModal();
      showModal("error", error.response?.data?.message || "Failed to delete. Please try again.");
    }
  };

  const handleAddOnChange = (e) => {
    const { name, value } = e.target;
    setAddOnForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAddOn = async (e) => {
    e.preventDefault();

    if (!addOnForm.name || !addOnForm.quantity || !addOnForm.unit_price || !addOnForm.price) {
      showModal("error", "Missing Fields", "Please fill in all required fields");
      return;
    }

    setSubmittingAddOn(true);
    try {
      await api.post("/addons/add", {
        name: addOnForm.name,
        quantity: Number(addOnForm.quantity),
        unit: addOnForm.unit,
        unit_price: Number(addOnForm.unit_price), // Cost per unit
        price: Number(addOnForm.price), // Selling price
        quantity_per_item: Number(addOnForm.quantity_per_item) // ✅ Add this
      });

      showModal("success", "Add-On Created", "Add-on created successfully!", () => {
        closeAddOnModal();
        fetchAddOns();
      });
      setAddOnForm({ 
        name: "", 
        quantity: "", 
        unit: "ml", 
        unit_price: "", 
        price: "",
        quantity_per_item: "1" // ✅ Add this
      });
      closeAddOnModal();
      fetchAddOns();
    } catch (error) {
      showModal("error", error.response?.data?.message || "Error creating add-on");
    } finally {
      setSubmittingAddOn(false);
    }
  };

  const fetchAddOns = async () => {
    try {
      const response = await api.get("/addons");
      setAddOns(response.data);
    } catch (error) {
      console.error("Failed to load add-ons");
    }
  };

  const convertToAddOn = async (ingredient) => {
    if (!ingredient || !ingredient.id) {
      showModal("error", "Invalid ingredient selected");
      return;
    }

    try {
      // ✅ Get the ACTUAL quantity value
      const quantity = Number(ingredient.quantity) || 0;
      
      // Convert base unit price to display unit price for add-on
      const displayUnitPrice = convertPriceToDisplayUnit(ingredient.unit_price, ingredient.unit);

      const addOnData = {
        name: ingredient.ingredient_name,
        quantity: quantity,  // ✅ CORRECT - Pass actual quantity
        unit: ingredient.unit,
        price: displayUnitPrice || 0,  // Display unit price (selling price)
        unit_price: ingredient.unit_price || 0  // Base unit price (cost)
      };

      console.log("📦 Converting to add-on:", addOnData);

      const response = await api.post("/addons/add", addOnData);

      showModal(
        "success",
        "Add-On Created",
        `"${ingredient.ingredient_name}" has been added as an add-on with ${quantity} ${ingredient.unit}!`,
        () => {
          fetchAddOns(); // Refresh add-ons list
          fetchData();   // Refresh ingredients list
        }
      );
    } catch (error) {
      console.error("Error converting to add-on:", error);
      showModal(
        "error",
        "Conversion Failed",
        error.response?.data?.message || "Failed to convert ingredient to add-on"
      );
    }
  };

  const filteredIngredients = ingredients
    .filter((item) => 
      item.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((item) => {
      const threshold = getLowStockThreshold(item.unit);
      if (filterStock === "low") {
        return Number(item.quantity) < threshold;
      } else if (filterStock === "normal") {
        return Number(item.quantity) >= threshold;
      }
      return true;
    });

  const lowStockCount = ingredients.filter(item => {
    const threshold = getLowStockThreshold(item.unit);
    return Number(item.quantity) < threshold;
  }).length;

  // Calculate total inventory value using base unit prices
  const totalInventoryValue = ingredients.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
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
            <div className="flex gap-2 w-full lg:w-auto">
              <Link
                to="/dashboard/ingredients/new"
                className="flex-1 lg:flex-none bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
              >
                <FiPlus size={18} />
                Add Ingredient
              </Link>
              <button
                onClick={openAddOnModal}
                className="flex-1 lg:flex-none bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
              >
                <FiPlus size={18} />
                Add Add-On
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 p-2.5 rounded-lg">
                <FiPackage className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Inventory Value</div>
            <div className="text-2xl font-bold text-slate-900">₱{totalInventoryValue.toFixed(2)}</div>
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
                <h4 className="font-bold text-red-800 mb-2 text-sm">Low Stock Alert</h4>
                <div className="text-sm text-red-700 space-y-1 mb-3">
                  <p>{lowStockCount} ingredient{lowStockCount !== 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} to be restocked:</p>
                  <ul className="text-xs ml-4">
                    {ingredients.filter(item => {
                      const threshold = getLowStockThreshold(item.unit);
                      return Number(item.quantity) < threshold;
                    }).slice(0, 5).map(item => {
                      const threshold = getLowStockThreshold(item.unit);
                      return (
                        <li key={item.id}>
                          • {item.ingredient_name}: {Number(item.quantity)} {item.unit} (threshold: {threshold} {item.unit})
                        </li>
                      );
                    })}
                  </ul>
                  {lowStockCount > 5 && (
                    <p className="text-xs ml-4">• ... and {lowStockCount - 5} more</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setFilterStock("low")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0"
              >
                View Items
              </button>
            </div>
          </div>
        )}

        {/* Add-Ons Section - MOVED TO TOP */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-600 rounded"></span>
            Add-Ons
          </h2>

          {addOns.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-slate-400 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Add-Ons Yet</h3>
              <p className="text-slate-600 text-sm mb-6">
                Create add-ons by clicking "Add Add-On" or converting ingredients
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Add-On Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Usage per Product
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Total Stock
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Unit
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Price (₱)
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Servings Left
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {addOns.map((addon) => {
                      const quantity = Number(addon.quantity) || 0;
                      const quantityPerItem = Number(addon.quantity_per_item) || 1;
                      const price = Number(addon.price) || 0;
                      const servingsLeft = Math.floor(quantity / quantityPerItem);
                      const percentageLeft = ((quantity / (servingsLeft * quantityPerItem + quantityPerItem)) * 100).toFixed(0);

                      return (
                        <tr key={addon.id} className="hover:bg-slate-50 transition-colors">
                          {/* Name */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">{addon.name}</div>
                          </td>

                          {/* ✅ Usage per Product */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-blue-600">
                              {quantityPerItem.toFixed(2)} {addon.unit}
                            </div>
                            <div className="text-xs text-slate-500">per serving</div>
                          </td>

                          {/* Total Stock */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">{quantity.toFixed(2)}</div>
                            <div className="text-xs text-slate-500">{addon.unit}</div>
                          </td>

                          {/* Unit */}
                          <td className="px-4 py-3">
                            <div className="text-sm text-slate-600 font-medium">{addon.unit}</div>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-orange-600">₱{price.toFixed(2)}</div>
                          </td>

                          {/* Servings Left with Progress */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-bold text-slate-900">{servingsLeft}</div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      percentageLeft > 50 ? "bg-green-500" :
                                      percentageLeft > 25 ? "bg-yellow-500" :
                                      "bg-red-500"
                                    }`}
                                    style={{ width: `${percentageLeft}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{percentageLeft}% left</div>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => navigate(`/dashboard/addons/${addon.id}/edit`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                              >
                                <FiEdit size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(addon.id, addon.name, true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                              >
                                <FiTrash2 size={14} />
                                Delete
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

        {/* Ingredients Table - MOVED BELOW ADD-ONS */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#073dbe] rounded"></span>
            Ingredients
          </h2>

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
                        Cost per Unit (₱)
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">
                        Total Value (₱)
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
                      const isLowStock = Number(item.quantity) < 50;
                      const baseUnitPrice = Number(item.unit_price) || 0;
                      const displayPrice = convertPriceToDisplayUnit(baseUnitPrice, item.unit);
                      const displayUnit = getDisplayUnit(item.unit);
                      const quantity = Number(item.quantity) || 0;
                      const itemValue = quantity * displayPrice;
                      
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
                              {quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700 font-medium text-sm">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <span className="text-slate-700 font-medium block">
                                {typeof item.unit_price !== 'undefined' && item.unit_price !== null ? `₱${formatPrice(displayPrice)}` : '--'}
                              </span>
                              <span className="text-slate-500 text-xs">
                                per {displayUnit}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700 font-bold text-sm">
                              ₱{itemValue.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const threshold = getLowStockThreshold(item.unit);
                              const isLowStock = Number(item.quantity) < threshold;
                              const isCritical = Number(item.quantity) < (threshold * 0.5);  // Critical when below 50% of threshold
                              
                              return isLowStock ? (
                                <span className={`inline-flex items-center gap-1 ${
                                  isCritical ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                } px-2.5 py-1 rounded-full text-xs font-semibold`}>
                                  <FiAlertCircle size={12} />
                                  {isCritical ? "🔴 CRITICAL" : "⚠️ LOW STOCK"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                  ✓ Normal
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <Link
                                to={`/dashboard/ingredients/${item.id}/edit`}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                              >
                                <FiEdit size={14} />
                                Edit
                              </Link>
                              <button
                                onClick={() => openDeleteModal(item.id, item.ingredient_name, false)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1"
                                title="Delete"
                              >
                                <FiTrash2 size={14} />
                                Delete
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

        {/* Success/Error Modal */}
        {modal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  modal.type === "success" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {modal.type === "success" ? (
                    <FiCheckCircle size={24} className="text-green-600" />
                  ) : (
                    <FiAlertCircle size={24} className="text-red-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {modal.type === "success" ? "Success" : "Error"}
                </h3>
              </div>
              
              <p className="text-slate-600 mb-6">{modal.message}</p>
              
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    modal.type === "success"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Delete</h3>
              </div>
              
              <p className="text-slate-600 mb-2">
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{deleteModal.name}"</span>?
              </p>
              <p className="text-sm text-slate-500 mb-6">
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add-On Modal */}
        {showAddOnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Add New Add-On</h3>
                <button
                  onClick={closeAddOnModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={submittingAddOn}
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitAddOn} className="space-y-4">
                {/* Add-On Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Add-On Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={addOnForm.name}
                    onChange={handleAddOnChange}
                    placeholder="e.g., Brown Sugar Syrup"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                    required
                    disabled={submittingAddOn}
                  />
                </div>

                {/* Quantity & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={addOnForm.quantity}
                      onChange={handleAddOnChange}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                      required
                      disabled={submittingAddOn}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unit"
                      value={addOnForm.unit}
                      onChange={handleAddOnChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm cursor-pointer bg-white"
                      required
                      disabled={submittingAddOn}
                    >
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                </div>

                {/* Usage per Product */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Usage per Product <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="quantity_per_item"
                      value={addOnForm.quantity_per_item}
                      onChange={handleAddOnChange}
                      placeholder="1"
                      step="0.01"
                      min="0"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                      required
                      disabled={submittingAddOn}
                    />
                    <div className="flex items-center justify-center px-3 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 min-w-fit">
                      {addOnForm.unit || "ml"}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">How much is used per drink</p>
                </div>

                {/* Stock Calculation */}
                {addOnForm.quantity && addOnForm.quantity_per_item && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-blue-900">
                      <span className="font-semibold">Total Stock:</span> {Number(addOnForm.quantity).toFixed(2)} {addOnForm.unit || "ml"}
                    </p>
                    <p className="text-xs text-blue-900">
                      <span className="font-semibold">Usage per Product:</span> {Number(addOnForm.quantity_per_item).toFixed(2)} {addOnForm.unit || "ml"}
                    </p>
                    <p className="text-sm font-bold text-blue-700">
                      ≈ {Math.floor(Number(addOnForm.quantity) / Number(addOnForm.quantity_per_item))} servings possible
                    </p>
                  </div>
                )}

                {/* Cost & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cost per Unit (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={addOnForm.unit_price}
                      onChange={handleAddOnChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                      required
                      disabled={submittingAddOn}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Selling Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={addOnForm.price}
                      onChange={handleAddOnChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none text-sm"
                      required
                      disabled={submittingAddOn}
                    />
                  </div>
                </div>

                {/* Profit Display */}
                {addOnForm.unit_price && addOnForm.price && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-900">
                      <span className="font-medium">Profit per Unit:</span>
                      <span className="font-bold float-right">₱{(Number(addOnForm.price) - Number(addOnForm.unit_price)).toFixed(2)}</span>
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeAddOnModal}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    disabled={submittingAddOn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={submittingAddOn}
                  >
                    {submittingAddOn ? "Adding..." : <><FiPlus size={16} /> Add</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
