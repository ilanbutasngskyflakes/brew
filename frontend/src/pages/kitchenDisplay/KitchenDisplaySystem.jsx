import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import api from "../../api/api";
import { ShopContext } from "../../context/createShopContext";

export default function KitchenDisplaySystem() {
  const navigate = useNavigate();
  const { shop } = useContext(ShopContext);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [, setLoading] = useState(true);
  const [, setLastOrderCount] = useState(0);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertedOrderIds, setAlertedOrderIds] = useState(new Set());

  

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      const response = await api.get("/order");
      const allOrders = response.data || [];
      
      // Filter for pending orders
      const pending = allOrders.filter(
        order => order.status === "pending" || order.status === "new"
      );

      // Check for truly new orders (not yet alerted)
      const newOrderIds = pending.map(o => o.id);
      const hasNewOrders = newOrderIds.some(id => !alertedOrderIds.has(id));
      
      if (hasNewOrders) {
        // Mark all current orders as alerted
        setAlertedOrderIds(new Set(newOrderIds));
      }

      setLastOrderCount(pending.length);
      setPendingOrders(pending);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh pending orders
  useEffect(() => {
    fetchPendingOrders();

    if (autoRefresh) {
      const interval = setInterval(fetchPendingOrders, 1000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, alertedOrderIds]);

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm("Mark this order as complete?")) return;

    setCompletingOrderId(orderId);
    try {
      await api.patch(`/order/${orderId}/status`, { status: "completed" });
      
      // Remove from pending list
      setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
      
      // Remove from alerted orders since it's no longer pending
      setAlertedOrderIds(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });
      
      alert("Order completed! ✓");
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order");
    } finally {
      setCompletingOrderId(null);
    }
  };

  const getOrderItems = (order) => {
    if (Array.isArray(order.items)) {
      return order.items;
    }
    return [];
  };

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading shop information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cashier")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              title="Back to Cashier"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Kitchen Display</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                autoRefresh
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {autoRefresh ? "Auto" : "Manual"}
            </button>
            <button
              onClick={fetchPendingOrders}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              title="Refresh now"
            >
              <FiRefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Container */}
      <div className="flex-1 p-6">
        {/* Pending Count */}
        <div className="mb-6 text-slate-600">
          <p className="text-sm font-medium">{pendingOrders.length} pending order{pendingOrders.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Orders Grid */}
        {pendingOrders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-500 font-medium">No pending orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOrders.map((order) => {
              const orderItems = getOrderItems(order);
              const createdAt = new Date(order.created_at);
              const now = new Date();
              const waitTime = Math.floor((now - createdAt) / 1000); // seconds

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border-2 border-red-400 overflow-hidden"
                >
                  {/* Order Header - Simple */}
                  <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Order #{order.id}</h3>
                      {order.customer_name && (
                        <p className="text-sm text-slate-600 mt-0.5">{order.customer_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">{waitTime}s ago</p>
                    </div>
                  </div>

                  {/* Order Details - Minimal */}
                  <div className="px-6 py-4 space-y-4">
                    {/* Order Type */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-slate-900">
                        {order.order_type ? order.order_type.toUpperCase() : "TAKEOUT"}
                      </span>
                      {!order.cashier_id && (
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">QR</span>
                      )}
                    </div>

                    {/* Items - Simplified */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Items</h4>
                      <div className="space-y-1">
                        {orderItems.length > 0 ? (
                          orderItems.map((item, idx) => (
                            <div key={idx} className="text-sm text-slate-700 flex justify-between">
                              <span>{item.product_name}</span>
                              <span className="text-slate-500">x{item.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No items</p>
                        )}
                      </div>
                    </div>

                    {/* Special Requests - Simple */}
                    {order.notes && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">Notes:</p>
                        <p className="text-sm text-slate-700 italic">{order.notes}</p>
                      </div>
                    )}

                    {/* Complete Button */}
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      disabled={completingOrderId === order.id}
                      className="w-full mt-4 py-2 px-4 rounded font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm"
                    >
                      {completingOrderId === order.id ? "Completing..." : "Done"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}
