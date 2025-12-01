import { useState, useEffect, Fragment } from "react";
import axios from "axios";
import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, TrashIcon, PrinterIcon } from "@heroicons/react/24/outline";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8080/order");
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`http://localhost:8080/order/${orderId}`, { status });
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update order status");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm(`Delete Order #${orderId}?`)) return;
    try {
      await axios.delete(`http://localhost:8080/order/${orderId}`);
      setOrders(orders.filter((order) => order.id !== orderId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete order");
    }
  };

  const printReceipt = (order) => {
    const receiptWindow = window.open("", "PRINT", "height=600,width=400");
    receiptWindow.document.write(`
      <html>
      <head><title>Receipt</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h2 style="text-align:center;">Barcelo Cafe</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <hr>
    `);

    order.items.forEach((item) => {
      receiptWindow.document.write(`
        <p>${item.product_name} (${item.variant || "Default"}) x ${item.quantity} = ₱${item.subtotal.toFixed(2)}</p>
      `);
    });

    receiptWindow.document.write(`
        <hr>
        <p><strong>Total:</strong> ₱${order.total.toFixed(2)}</p>
        <hr>
        <p style="text-align:center;">Thank you for dining at Barcelo Cafe!</p>
      </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={order.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                  <td className="px-4 py-2 font-semibold">{order.id}</td>
                  <td className="px-4 py-2">₱{order.total.toFixed(2)}</td>

                  {/* Status buttons */}
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className={`px-3 py-1 rounded-lg font-medium ${
                        order.status === "completed"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 hover:bg-green-100"
                      }`}
                      onClick={() => updateStatus(order.id, "completed")}
                    >
                      Completed
                    </button>
                    <button
                      className={`px-3 py-1 rounded-lg font-medium ${
                        order.status === "pending"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-200 hover:bg-yellow-100"
                      }`}
                      onClick={() => updateStatus(order.id, "pending")}
                    >
                      Pending
                    </button>
                  </td>

                  {/* Dropdown menu for Print/Delete */}
                  <td className="px-4 py-2 text-center">
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="inline-flex justify-center w-full rounded-md bg-gray-100 p-1 hover:bg-gray-200">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <div className="py-1 flex flex-col">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full ${active ? "bg-gray-100" : ""}`}
                                  onClick={() => printReceipt(order)}
                                >
                                  <PrinterIcon className="w-4 h-4" />
                                  Print
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-red-600 ${active ? "bg-gray-100" : ""}`}
                                  onClick={() => deleteOrder(order.id)}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
