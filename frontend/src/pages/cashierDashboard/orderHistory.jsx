import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { FiArrowLeft, FiPrinter, FiEdit3, FiClock, FiShoppingBag } from "react-icons/fi";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadOrders();
  }, [location]);

  const loadOrders = async () => {
    try {
      const { data } = await api.get("/order");
      setOrders(data || []);
    } catch (err) {
      console.error("Cannot load orders:", err);
    }
  };

  const handleEditOrder = (order) => {
    const confirmEdit = window.confirm(
      `Are you sure you want to edit Order #${order.id}?\n\nThis will load the order into the cashier page for editing.`
    );
    
    if (confirmEdit) {
      navigate("/cashier", { state: { editOrder: order } });
    }
  };
  
  const handleBackToCashier = () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to go back to the cashier page?"
    );
    
    if (confirmLeave) {
      navigate("/cashier");
    }
  };

  const printReceipt = (order) => {
    const isDiscounted = order.discount > 0;
    const safeTotal = Number(order.total || 0);
    const safeDiscount = Number(order.discount || 0);
    const safeChange = Number(order.change || 0);
    const safePaid = Number(order.paid || 0) || (safeTotal + safeChange);

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
          body { 
            font-family: 'Courier New', monospace; 
            padding: 20px; 
            font-size: 12px;
            max-width: 300px;
            margin: 0 auto;
          }
          h2, h3 { text-align: center; margin: 5px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .header { text-align: center; margin-bottom: 15px; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
          .item-name { flex: 1; }
          .item-qty { width: 40px; text-align: center; }
          .item-price { width: 70px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          .discount-note { text-align: center; font-weight: bold; margin: 10px 0; }
          .order-type { text-align: center; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Barcelo Cafe</h2>
          <div>La Consolacion College</div>
          <div>Galo- Gatuslao- Rizal Streets,</div>
          <div>Bacolod City, Philippines, 6100</div>
          <div>Contact: (034) 434 9661</div>
          <div>Email: lccbpresident@lccbonline.edu.ph</div>
        </div>
        <div class="divider"></div>
        <div style="text-align: center; font-weight: bold; margin: 10px 0;">OFFICIAL RECEIPT</div>
        <div class="order-type">${order.order_type === 'dine-in' ? '🍽️ DINE IN' : '🥡 TAKE OUT'}</div>
        ${isDiscounted ? `<div class="discount-note">${order.discount_type === 'senior' ? 'SENIOR CITIZEN' : 'PWD'} DISCOUNT APPLIED (-₱${safeDiscount.toFixed(2)})</div>` : ''}
        <div class="divider"></div>
        <div style="font-size: 11px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>Date:</span><span>${new Date(order.created_at).toLocaleString()}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Order #:</span><span>${order.id}</span></div>
        </div>
        <div class="divider"></div>
        <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">
          <div style="display: flex;">
            <div class="item-name">ITEM</div>
            <div class="item-qty">QTY</div>
            <div class="item-price">PRICE</div>
          </div>
        </div>
        ${order.items?.map(item => {
          const qty = Number(item.quantity || 0);
          const subtotal = Number(item.subtotal || 0);
          let itemHTML = `<div class="item-row"><div class="item-name">${item.product_name || ""}</div><div class="item-qty">x${qty}</div><div class="item-price">₱${subtotal.toFixed(2)}</div></div>`;
          if (item.variant_name) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">${item.variant_name}</div>`;
          if (item.topping_name) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">+ ${item.topping_name}</div>`;
          return itemHTML;
        }).join('')}
        <div class="divider"></div>
        <div class="total-row"><span>SUBTOTAL:</span><span>₱${(safeTotal + safeDiscount).toFixed(2)}</span></div>
        ${isDiscounted ? `<div class="total-row" style="color: #d00;"><span>DISCOUNT:</span><span>-₱${safeDiscount.toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="total-row" style="font-size: 14px;"><span>TOTAL:</span><span>₱${safeTotal.toFixed(2)}</span></div>
        <div class="total-row"><span>CASH:</span><span>₱${safePaid.toFixed(2)}</span></div>
        <div class="total-row"><span>CHANGE:</span><span>₱${Math.max(0, safeChange).toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="footer">
          <div style="margin: 10px 0;">Reference No: BARCELO${String(order.id).padStart(6, '0')}</div>
          <div style="margin: 10px 0; font-weight: bold;">Thank you for your order!</div>
          <div>Please come again!</div>
        </div>
      </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    
    setTimeout(() => {
      try { 
        receiptWindow.print(); 
      } catch (e) { 
        console.error("Print failed:", e); 
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
              <p className="text-sm text-slate-600 mt-1">View and manage past orders</p>
            </div>
            <button
              onClick={handleBackToCashier}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
            >
              <FiArrowLeft size={16} />
              <span>Back to Cashier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <FiShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-600 mb-1">No orders yet</p>
            <p className="text-sm text-slate-400">Orders will appear here once completed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-[#073dbe] transition-all">
                {/* Order Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">Order #{order.id}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "completed" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {order.order_type && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {order.order_type === 'dine-in' ? 'Dine In' : 'Take Out'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FiClock size={12} className="text-slate-400" />
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            {order.discount_type === 'senior' ? 'Senior' : 'PWD'} -₱{Number(order.discount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                      <div className="bg-[#073dbe] text-white px-4 py-2 rounded-lg">
                        <p className="text-xs text-blue-100">Total</p>
                        <p className="text-xl font-bold">₱{Number(order.total).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => printReceipt(order)}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-1 text-sm"
                        >
                          <FiPrinter size={14} />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="flex-1 sm:flex-none bg-[#073dbe] hover:bg-[#052d99] text-white px-3 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-1 text-sm"
                        >
                          <FiEdit3 size={14} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-4 py-3">
                  <h4 className="font-bold text-slate-800 mb-2 text-sm">Order Items</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm mb-1">{item.product_name}</div>
                          <div className="flex flex-wrap gap-1 text-xs">
                            {item.variant_name && (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {item.variant_name}
                              </span>
                            )}
                            {item.topping_name && (
                              <span className="text-[#073dbe] bg-blue-50 px-2 py-0.5 rounded">
                                + {item.topping_name}
                              </span>
                            )}
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-[#073dbe] text-sm whitespace-nowrap">
                          ₱{Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary - Simplified */}
                  {order.discount > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-sm text-red-600">
                        <span className="font-medium">Discount Applied:</span>
                        <span className="font-bold">-₱{Number(order.discount).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}