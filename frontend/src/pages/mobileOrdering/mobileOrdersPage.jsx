/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FiArrowLeft, FiTrash2, FiX } from 'react-icons/fi';
import Modal from '../../components/Modal';

export default function MobileOrdersPage() {
  const [mobileOrders, setMobileOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false,
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const showModal = (type, title, message, onConfirm = null, confirmText = "OK", showCancel = false) => {
    setModal({ isOpen: true, type, title, message, onConfirm, confirmText, showCancel });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "cashier")) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadAllOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://192.168.68.101:8080/order');
        if (response.ok) {
          const orders = await response.json();
          setMobileOrders(Array.isArray(orders) ? orders : []);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setMobileOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();

    const newSocket = io('http://192.168.68.101:8080');

    newSocket.on('connect', () => {
      console.log('Mobile Orders page connected');
      newSocket.emit('join-cashier');
    });

    newSocket.on('new-order', (data) => {
      console.log('New mobile order received:', data);
      setMobileOrders(prev => [data, ...prev]);
    });

    return () => newSocket.disconnect();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://192.168.68.101:8080/order/${orderId}/socket-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setMobileOrders(prev => 
          prev.map(order => 
            order.order_id === orderId || order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        showModal('success', 'Success', `Order #${orderId} updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      showModal('error', 'Error', 'Failed to update order status');
    }
  };

  const deleteOrder = (orderId) => {
    setMobileOrders(prev => prev.filter(order => order.order_id !== orderId && order.id !== orderId));
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'preparing': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'ready': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        showCancel={modal.showCancel}
      />

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#073dbe] text-white p-6 flex items-center justify-between border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold">Order #{selectedOrder.order_id || selectedOrder.id}</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-semibold">Status</p>
                  <span className={`inline-block mt-2 px-4 py-2 rounded-full font-bold text-sm capitalize border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-600 text-sm font-semibold mb-1">Customer Name</p>
                  <p className="text-slate-900 font-bold text-lg">{selectedOrder.customer_name || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-semibold mb-1">Order Type</p>
                  <p className="text-slate-900 font-bold">{selectedOrder.order_type === 'dine-in' ? 'Dine In' : 'Takeout'}</p>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-slate-600 text-sm font-semibold mb-3">Items Ordered</p>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{item.product_name}</p>
                          <p className="text-slate-600 text-sm">{item.variant_name}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-slate-900">x{item.quantity}</p>
                          <p className="text-slate-600 text-sm">₱{Number(item.subtotal || item.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-slate-600 text-sm font-semibold mb-2">Special Requests</p>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-slate-900 text-sm whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-slate-100 rounded-lg p-4 space-y-2 border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Subtotal</span>
                  <span className="text-slate-900 font-bold">₱{(Number(selectedOrder.total) + Number(selectedOrder.discount || 0)).toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="font-semibold">Discount</span>
                    <span className="font-bold">-₱{Number(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-2 flex justify-between items-center">
                  <span className="text-slate-900 font-bold">Total</span>
                  <span className="text-[#073dbe] font-bold text-xl">₱{Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 space-y-3">
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'confirmed')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Confirm Order
                </button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'preparing')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.order_id || selectedOrder.id, 'ready')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Mark as Ready
                </button>
              )}
              {selectedOrder.status === 'ready' && (
                <div className="w-full bg-green-100 text-green-700 font-bold py-3 rounded-lg text-center border border-green-300">
                  Order is ready for pickup
                </div>
              )}
              
              <button
                onClick={() => deleteOrder(selectedOrder.order_id || selectedOrder.id)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiTrash2 size={18} />
                Clear Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#073dbe]">All Orders</h1>
            <p className="text-slate-600 text-sm mt-1">
              <strong>{mobileOrders.length}</strong> total orders
            </p>
          </div>
          <button
            onClick={() => navigate('/cashier')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#073dbe] hover:bg-[#052d99] text-white rounded-lg font-semibold transition-colors"
          >
            <FiArrowLeft size={18} />
            Back to Cashier
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {loading && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-600 font-semibold">Loading orders...</p>
          </div>
        )}

        {!loading && mobileOrders.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-lg font-semibold text-slate-600">No orders found</p>
          </div>
        )}

        {!loading && mobileOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mobileOrders.map(order => (
              <div
                key={order.order_id || order.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header - Clickable */}
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">Order #{order.order_id || order.id}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-[#073dbe]">
                        {order.customer_name || 'Walk-in'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{order.items?.length || 0} items</span>
                      <span className="text-slate-600">{order.order_type === 'dine-in' ? 'Dine In' : 'Takeout'}</span>
                    </div>
                  </div>
                </button>

                {/* Card Footer - Total */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">Total</span>
                    <span className="text-[#073dbe] font-bold text-lg">₱{Number(order.total).toFixed(2)}</span>
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