import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8080/order");
      // Add senior/pwd flags to each order if not present
      const updatedOrders = res.data.map(order => ({
        ...order,
        isSenior: order.isSenior || false,
        isPWD: order.isPWD || false,
      }));
      setOrders(updatedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:8080/order/${orderId}`, { status: newStatus });
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      alert(`Order #${orderId} updated to "${newStatus}"`);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status.");
    }
  };

  const viewReceipt = (order) => {
    const receiptWindow = window.open("", "PRINT", "height=600,width=400");
    receiptWindow.document.write(`
      <html>
      <head><title>Receipt</title></head>
      <body style="font-family: Arial; padding: 20px;">
    `);

    receiptWindow.document.write(`<h2 style="text-align:center;">Barcelo Cafe</h2>`);
    receiptWindow.document.write(`<p><strong>Order ID:</strong> ${order.id}</p>`);
    receiptWindow.document.write(`<hr>`);

    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const variantText = item.variant ? ` (${item.variant})` : "";
        receiptWindow.document.write(
          `<p>${item.product_name}${variantText} x ${item.quantity} = ₱${item.subtotal.toFixed(2)}</p>`
        );
      });
    }

    receiptWindow.document.write(`<hr>`);
    receiptWindow.document.write(`<p><strong>Total:</strong> ₱${order.total.toFixed(2)}</p>`);

    // Show discount info separately
    if (order.isSenior) receiptWindow.document.write(`<p style="color:green;"><strong>Senior Discount Applied</strong></p>`);
    if (order.isPWD) receiptWindow.document.write(`<p style="color:green;"><strong>PWD Discount Applied</strong></p>`);
    if (!order.isSenior && !order.isPWD) receiptWindow.document.write(`<p><strong>No Discount</strong></p>`);

    receiptWindow.document.write(`<hr>`);
    receiptWindow.document.write(`<p style="text-align:center;">Thank you for dining at Barcelo Cafe!</p>`);
    receiptWindow.document.write(`</body></html>`);

    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const toggleDiscount = (orderId, type) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          if (type === "senior") return { ...order, isSenior: !order.isSenior };
          if (type === "pwd") return { ...order, isPWD: !order.isPWD };
        }
        return order;
      })
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-2 md:mb-0">Order History</h2>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full rounded-xl overflow-hidden shadow-md">
          <thead className="bg-blue-600">
            <tr>
              <th className="px-4 py-2 text-left text-white">Order ID</th>
              <th className="px-4 py-2 text-left text-white">Order Type</th>
              <th className="px-4 py-2 text-left text-white">Status</th>
              <th className="px-4 py-2 text-left text-white">Total</th>
              <th className="px-4 py-2 text-left text-white">Senior</th>
              <th className="px-4 py-2 text-left text-white">PWD</th>
              <th className="px-4 py-2 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr
                key={order.id}
                className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
              >
                <td className="px-4 py-3">{order.id}</td>
                <td className="px-4 py-3 capitalize">{order.order_type}</td>
                <td className="px-4 py-3 capitalize">{order.status}</td>
                <td className="px-4 py-3 font-semibold">₱{order.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={order.isSenior}
                    onChange={() => toggleDiscount(order.id, "senior")}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={order.isPWD}
                    onChange={() => toggleDiscount(order.id, "pwd")}
                  />
                </td>
                <td className="px-4 py-3 flex gap-2 flex-wrap">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600"
                    onClick={() => viewReceipt(order)}
                  >
                    View Receipt
                  </button>

                  {order.status !== "completed" && (
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700"
                      onClick={() => updateOrderStatus(order.id, "completed")}
                    >
                      Completed
                    </button>
                  )}

                  {order.status !== "pending" && (
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded-lg hover:bg-yellow-600"
                      onClick={() => updateOrderStatus(order.id, "pending")}
                    >
                      Pending
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2">
            <div className="flex justify-between"><span className="font-semibold">Order ID:</span>{order.id}</div>
            <div className="flex justify-between"><span className="font-semibold">Type:</span>{order.order_type}</div>
            <div className="flex justify-between"><span className="font-semibold">Status:</span>{order.status}</div>
            <div className="flex justify-between"><span className="font-semibold">Total:</span>₱{order.total.toFixed(2)}</div>
            
            <div className="flex gap-4 mt-2 items-center">
              <label>
                <input type="checkbox" checked={order.isSenior} onChange={() => toggleDiscount(order.id, "senior")} /> Senior
              </label>
              <label>
                <input type="checkbox" checked={order.isPWD} onChange={() => toggleDiscount(order.id, "pwd")} /> PWD
              </label>
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              <button className="flex-1 bg-blue-500 text-white py-1 rounded-lg" onClick={() => viewReceipt(order)}>
                View Receipt
              </button>

              {order.status !== "completed" && (
                <button
                  className="flex-1 bg-green-600 text-white py-1 rounded-lg"
                  onClick={() => updateOrderStatus(order.id, "completed")}
                >
                  Completed
                </button>
              )}

              {order.status !== "pending" && (
                <button
                  className="flex-1 bg-yellow-500 text-white py-1 rounded-lg"
                  onClick={() => updateOrderStatus(order.id, "pending")}
                >
                  Pending
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
