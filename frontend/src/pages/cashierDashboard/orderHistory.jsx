import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

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
      `Are you sure you want to edit Order #${order.id}?\n\n` +
      `This will load the order into the cashier page for editing.`
    );
    
    if (confirmEdit) {
      console.log("Edit button clicked, order:", order);
      navigate("/cashier", { state: { editOrder: order } });
    }
  };
  
  const handleBackToCashier = () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to go back to the cashier page?\n\n" +
      "Make sure you've completed all necessary actions here."
    );
    
    if (confirmLeave) {
      navigate("/cashier");
    }
  };

  const printReceipt = (order) => {
    const isDiscounted = order.discount > 0;

    // Ensure numbers are safe (avoid NaN)
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
          .divider { 
            border-top: 1px dashed #000; 
            margin: 10px 0; 
          }
          .header { text-align: center; margin-bottom: 15px; }
          .item-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 5px 0;
            font-size: 11px;
          }
          .item-name { flex: 1; }
          .item-qty { width: 40px; text-align: center; }
          .item-price { width: 70px; text-align: right; }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-weight: bold;
          }
          .footer { 
            text-align: center; 
            margin-top: 15px; 
            font-size: 10px; 
          }
          .discount-note {
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
          }
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

        <div style="text-align: center; font-weight: bold; margin: 10px 0;">
          OFFICIAL RECEIPT
        </div>

        ${isDiscounted ? `<div class="discount-note">${order.discount_type === 'senior' ? 'SENIOR CITIZEN' : 'PWD'} DISCOUNT APPLIED (-₱${safeDiscount.toFixed(2)})</div>` : ''}

        <div class="divider"></div>

        <div style="font-size: 11px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Date:</span>
            <span>${new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Order #:</span>
            <span>${order.id}</span>
          </div>
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
          
          let itemHTML = `
            <div class="item-row">
              <div class="item-name">${item.product_name || ""}</div>
              <div class="item-qty">x${qty}</div>
              <div class="item-price">₱${subtotal.toFixed(2)}</div>
            </div>
          `;
          if (item.variant_name) {
            itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">${item.variant_name}</div>`;
          }
          if (item.topping_name) {
            itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">+ ${item.topping_name}</div>`;
          }
          return itemHTML;
        }).join('')}

        <div class="divider"></div>

        <div class="total-row">
          <span>SUBTOTAL:</span>
          <span>₱${(safeTotal + safeDiscount).toFixed(2)}</span>
        </div>

        ${isDiscounted ? `
          <div class="total-row" style="color: #d00;">
            <span>DISCOUNT:</span>
            <span>-₱${safeDiscount.toFixed(2)}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="total-row" style="font-size: 14px;">
          <span>TOTAL:</span>
          <span>₱${safeTotal.toFixed(2)}</span>
        </div>

        <div class="total-row">
          <span>CASH:</span>
          <span>₱${safePaid.toFixed(2)}</span>
        </div>

        <div class="total-row">
          <span>CHANGE:</span>
          <span>₱${Math.max(0, safeChange).toFixed(2)}</span>
        </div>

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
    <div className="min-h-screen bg-gray-50 p-3 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Order History</h1>
            <p className="text-gray-600 text-sm lg:text-base mt-1">View and manage past orders</p>
          </div>
          <button
            onClick={handleBackToCashier}
            className="w-full sm:w-auto bg-gray-700 hover:bg-gray-800 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg hover:shadow-lg transition-all font-medium"
          >
            ← Back to Cashier
          </button>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 lg:p-12 text-center">
              <div className="text-5xl lg:text-6xl mb-3">📋</div>
              <p className="text-base lg:text-lg text-gray-500 font-medium">No orders yet</p>
              <p className="text-sm text-gray-400 mt-2">Orders will appear here once completed</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-md p-4 lg:p-6 hover:shadow-lg transition-all border border-gray-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg lg:text-xl font-bold text-gray-800">Order #{order.id}</h3>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-2">{new Date(order.created_at).toLocaleString()}</p>
                    <div className="flex gap-2">
                      {order.discount > 0 && (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {order.discount_type === 'senior' ? 'Senior' : 'PWD'} Discount
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 w-full lg:w-auto">
                    <p className="text-xl lg:text-2xl font-bold text-indigo-600">₱{Number(order.total).toFixed(2)}</p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => printReceipt(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-medium whitespace-nowrap"
                      >
                        Print Receipt
                      </button>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all text-sm font-medium whitespace-nowrap"
                      >
                        Edit Order
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">Order Items</h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm lg:text-base">{item.product_name}</div>
                        <div className="flex flex-wrap gap-1 lg:gap-2 mt-1 text-xs lg:text-sm">
                        {item.variant_name && (
                            <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.variant_name}</span>
                        )}
                        {item.topping_name && (
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">+ {item.topping_name}</span>
                        )}
                          <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-semibold">x{item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-indigo-600 text-sm lg:text-base whitespace-nowrap">₱{Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200 space-y-2">
                    {order.discount > 0 && (
                      <div className="flex justify-between text-red-600 text-sm lg:text-base">
                        <span className="font-medium">Discount Applied:</span>
                        <span className="font-bold">-₱{Number(order.discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-800 bg-indigo-50 p-3 rounded-lg">
                      <span className="font-bold text-base lg:text-lg">Total Amount:</span>
                      <span className="font-bold text-lg lg:text-xl text-indigo-600">₱{Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}