/* eslint-disable no-undef */
/* eslint-disable react-hooks/immutability */
import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { ShopContext } from "../../context/createShopContext";
import { FiClock, FiEdit, FiShoppingCart, FiCalendar, FiArrowLeft, FiPrinter } from "react-icons/fi";

export default function OrderHistoryPage() {
  const { shop } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [toppings, setToppings] = useState([]);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersRes, toppingsRes] = await Promise.all([
          api.get("/order"),
          api.get("/addons")
        ]);
        setOrders(ordersRes.data || []);
        setToppings(toppingsRes.data || []);
      } catch (err) {
        console.error("Cannot load data:", err);
        alert("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location]);

  // Add null check before using:
  const getToppingById = (toppingId) => {
    const topping = toppings.find(t => t.id === toppingId);
    return topping || { id: toppingId, name: "Unknown" };
  };

  const handleEditOrder = (order) => {
    const confirmEdit = window.confirm(
      `Are you sure you want to edit Order #${order.id}? This will mark it as Refunded.`
    );
    
    if (confirmEdit) {
      // Auto-mark as refunded when edited
      handleStatusChange(order.id, "refunded").then(() => {
        navigate("/cashier", { state: { editOrder: order } });
      });
    }
  };

  const handlePrintReceipt = (order) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const isDiscounted = order.discount > 0;
    const safeTotal = Number(order.total || 0);
    const safeDiscount = Number(order.discount || 0);
    const safePaid = order.paid !== undefined && order.paid !== null
      ? Number(order.paid)
      : safeTotal;
    const safeChange = order.change !== undefined && order.change !== null
      ? Number(order.change)
      : 0;

    const receiptWindow = window.open("", "_blank", "height=600,width=400");
    if (!receiptWindow) {
      alert("Popup blocked. Please allow popups to print the receipt.");
      return;
    }

    receiptWindow.document.write(`
      <html>
      <head>
        <title>Receipt - Order #${order.id}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 20px; 
            font-size: 11px;
            max-width: 300px;
            margin: 0 auto;
            line-height: 1.4;
          }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
          .item-name { flex: 1; }
          .item-qty { width: 35px; text-align: center; }
          .item-price { width: 60px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin: 4px 0; font-weight: bold; }
          .label { font-weight: bold; }
          .value { text-align: right; }
        </style>
      </head>
      <body>
        <div class="divider"></div>
        <div class="center" style="font-weight: bold; margin: 4px 0;">${shop?.receipt_header || 'OFFICIAL RECEIPT'}</div>
        <div class="center" style="font-weight: bold; margin: 4px 0; text-transform: uppercase;">${order.order_type === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</div>
        <div class="divider"></div>
        
        <div style="margin: 4px 0;">
          <div class="item-row" style="margin: 3px 0;">
            <span class="label">Date:</span>
            <span class="value">${new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div class="item-row" style="margin: 3px 0;">
            <span class="label">Order #:</span>
            <span class="value">${order.id}</span>
          </div>
          <div class="item-row" style="margin: 3px 0;">
            <span class="label">Customer:</span>
            <span class="value">${order.customer_name || 'Walk-in'}</span>
          </div>
          <div class="item-row" style="margin: 3px 0;">
            <span class="label">Served by:</span>
            <span class="value">${user?.name || 'Cashier'}</span>
          </div>
        </div>
        
        <div class="divider"></div>
        <div class="item-row" style="font-weight: bold; margin: 4px 0;">
          <div class="item-name">ITEM</div>
          <div class="item-qty">QTY</div>
          <div class="item-price">PRICE</div>
        </div>
        <div class="divider"></div>
        
        ${order.items?.map(item => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          const itemDiscount = Number(item.discount || 0);
          const totalPrice = (price - itemDiscount) * qty;
          
          let itemHTML = `<div class="item-row">
            <div class="item-name">${item.product_name || ""}</div>
            <div class="item-qty">x${qty}</div>
            <div class="item-price">₱${totalPrice.toFixed(2)}</div>
          </div>`;
          
          if (item.variant_name) {
            itemHTML += `<div style="font-size: 10px; color: #666; margin-left: 5px; margin-bottom: 2px;">${item.variant_name}</div>`;
          }
          
          if (itemDiscount > 0) {
            itemHTML += `<div style="font-size: 9px; color: #d00; margin-left: 5px; font-weight: bold; margin-bottom: 2px;">${item.discount_type?.toUpperCase() || 'DISCOUNT'} -₱${itemDiscount.toFixed(2)}</div>`;
          }
          
          if (item.addOns && item.addOns.length > 0) {
            item.addOns.forEach(addon => {
              itemHTML += `<div style="font-size: 10px; color: #d97706; margin-left: 5px; margin-bottom: 2px;">+ ${addon.name}</div>`;
            });
          }
          
          return itemHTML;
        }).join('')}
        
        <div class="divider"></div>
        <div class="total-row">
          <span>SUBTOTAL:</span>
          <span>₱${(safeTotal + safeDiscount).toFixed(2)}</span>
        </div>
        
        ${isDiscounted ? `<div class="total-row" style="color: #d00;">
          <span>DISCOUNT:</span>
          <span>-₱${safeDiscount.toFixed(2)}</span>
        </div>` : ''}
        
        <div class="divider"></div>
        <div class="total-row" style="font-size: 12px; margin: 6px 0;">
          <span>TOTAL:</span>
          <span>₱${safeTotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>CASH:</span>
          <span>₱${safePaid.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>CHANGE:</span>
          <span>₱${Math.max(0, safeChange).toFixed(2)}</spa${shop?.receipt_footer || 'Thank you for your order!'}
        </div>
        
        <div class="divider"></div>
        <div class="center" style="font-size: 10px; margin: 6px 0;">
          <div>Reference No: ${shop?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || 'SHOP'}${String(order.id).padStart(6, '0')}</div>
          <div style="font-weight: bold; margin-top: 4px;">Thank you for your order!</div>
          <div>Please come again!</div>
        </div>
      </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => {
      receiptWindow.print();
    }, 250);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    return new Promise((resolve, reject) => {
      setStatusUpdating(orderId);
      api.patch(`/order/${orderId}/status`, { status: newStatus })
        .then(() => {
          // Update local state
          setOrders(orders.map(o => 
            o.id === orderId ? { ...o, status: newStatus } : o
          ));
          
          if (newStatus !== "refunded" && newStatus !== "pending" && newStatus !== "completed") {
            alert(`Order #${orderId} marked as ${newStatus}`);
          }
          setStatusUpdating(null);
          resolve();
        })
        .catch((err) => {
          console.error("Cannot update order status:", err);
          alert("Failed to update order status");
          setStatusUpdating(null);
          reject(err);
        });
    });
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
            <div className="p-2.5 rounded-lg text-white" style={{ backgroundColor: shop?.brand_color || '#073dbe' }}>
              <FiClock className="text-xl" />
            </div>
            Order History
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            View and manage past orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: (shop?.brand_color || '#073dbe') + '15' }}>
                <FiShoppingCart size={20} style={{ color: shop?.brand_color || '#073dbe' }} />
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
                      <div className="text-white px-3 py-1 rounded-lg font-bold text-sm" style={{ backgroundColor: shop?.brand_color || '#073dbe' }}>
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
                      {order.cashier_name && (
                        <div className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          By: {order.cashier_name}
                        </div>
                      )}
                      <div className="text-xs text-slate-600 bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold uppercase">
                        {order.order_type === 'dine-in' ? 'Dine In' : 'Take Out'}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-3">
                      {order.items?.map((item, idx) => {
                        const topping = item.topping_id ? getToppingById(item.topping_id) : null;
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs">
                                {item.quantity}x
                              </span>
                              <div className="flex-1">
                                <span className="font-medium text-slate-900">
                                  {item.product_name}
                                </span>
                                <span className="text-slate-500 ml-1">
                                  ({item.variant_name})
                                </span>
                                {topping && (
                                  <div className="text-xs text-slate-600 mt-0.5">
                                    + {topping.name}
                                  </div>
                                )}
                                {/* Show Add-ons if any */}
                                {item.addOns && item.addOns.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {item.addOns.map((addon, addonIdx) => (
                                      <div key={addonIdx} className="text-xs text-orange-700 font-medium">
                                        + {addon.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-slate-900">
                              ₱{Number(item.subtotal).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div className="text-sm">
                        {order.discount > 0 && (
                          <span className="text-red-600 font-medium">
                            Discount ({(order.discount_type || order.discounted) === 'senior' ? 'Senior' : 'PWD'}): -₱{Number(order.discount).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-600 uppercase font-semibold mb-1">Total</div>
                        <div className="text-xl font-bold text-[#073dbe]">
                          ₱{Number(order.total).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Cash: ₱{Number(order.paid ?? 0).toFixed(2)} | Change: ₱{Number(order.change ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={statusUpdating === order.id}
                      className={`flex-1 lg:flex-none py-2 px-3 rounded-lg transition-all font-medium text-sm border-2 outline-none ${
                        order.status === 'completed'
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : order.status === 'refunded'
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : 'border-yellow-500 bg-yellow-50 text-yellow-900'
                      } ${statusUpdating === order.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    <button
                      onClick={() => handlePrintReceipt(order)}
                      className="flex-1 lg:flex-none text-white py-2 px-4 rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
                      style={{ backgroundColor: shop?.brand_color || '#073dbe' }}
                    >
                      <FiPrinter size={16} />
                      Print
                    </button>
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