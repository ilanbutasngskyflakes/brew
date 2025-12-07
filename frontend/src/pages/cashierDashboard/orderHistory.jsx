/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { FiClock, FiEdit, FiShoppingCart, FiCalendar, FiArrowLeft } from "react-icons/fi";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/order");
        setOrders(data || []);
      } catch (err) {
        console.error("Cannot load orders:", err);
        alert("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [location]);

  const handleEditOrder = (order) => {
    const confirmEdit = window.confirm(
      `Are you sure you want to edit Order #${order.id}? This will load the order into the cashier page for editing.`
    );
    
    if (confirmEdit) {
      navigate("/cashier", { state: { editOrder: order } });
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch = 
        order.id.toString().includes(searchQuery) ||
        order.items?.some(item => 
          item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesDate = !filterDate || 
        new Date(order.created_at).toISOString().split('T')[0] === filterDate;
      
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/cashier")}
            className="flex items-center gap-2 text-[#073dbe] hover:text-[#052d99] font-medium mb-4 transition-colors text-sm"
          >
            <FiArrowLeft size={18} />
            Back to Cashier
          </button>
          
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-[#073dbe] p-2.5 rounded-lg">
              <FiClock className="text-white text-xl" />
            </div>
            Order History
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            View and manage past orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <FiShoppingCart className="text-[#073dbe]" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-2.5 rounded-lg">
                <FiShoppingCart className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Today's Orders</div>
            <div className="text-2xl font-bold text-slate-900">
              {orders.filter(o => 
                new Date(o.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 p-2.5 rounded-lg">
                <FiShoppingCart className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-slate-900">
              ₱{orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by order ID or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
              />
            </div>

            {/* Date Filter */}
            <div className="lg:w-56 flex items-center gap-2">
              <FiCalendar className="text-slate-400 flex-shrink-0" size={18} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-slate-600">
            <span className="font-semibold text-[#073dbe]">{filteredOrders.length}</span>
            {' '}{filteredOrders.length === 1 ? 'order' : 'orders'} found
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShoppingCart className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Orders Found</h3>
            <p className="text-slate-600 text-sm">
              {searchQuery || filterDate ? "Try adjusting your filters" : "No orders have been placed yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-[#073dbe] text-white px-3 py-1 rounded-lg font-bold text-sm">
                        #{order.id}
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(order.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-slate-900">
                              {item.product_name}
                            </span>
                            <span className="text-slate-500">
                              ({item.variant_name})
                            </span>
                          </div>
                          <span className="font-semibold text-slate-900">
                            ₱{Number(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div className="text-sm">
                        {order.discount > 0 && (
                          <span className="text-red-600 font-medium">
                            Discount: ₱{Number(order.discount).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-600 uppercase font-semibold mb-1">Total</div>
                        <div className="text-xl font-bold text-[#073dbe]">
                          ₱{Number(order.total).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-32 flex lg:flex-col gap-2">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="flex-1 lg:flex-none bg-[#073dbe] hover:bg-[#052d99] text-white py-2 px-4 rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <FiEdit size={16} />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}