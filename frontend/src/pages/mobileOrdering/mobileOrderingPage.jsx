/* eslint-disable react-hooks/purity */
import { useEffect, useState } from 'react';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';

export default function MobileOrderingPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [setShowStatusModal] = useState(false);
  const [categories, setCategories] = useState({});
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderCart, setOrderCart] = useState([]);

  useEffect(() => {
    fetch('http://192.168.68.101:8080/product')
      .then(res => res.json())
      .then(data => {
        let productList = Array.isArray(data) ? data : data.data || data.products || [];
        setProducts(productList);
      })
      .catch(err => {
        console.error('Error loading products:', err);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    fetch('http://192.168.68.101:8080/category')
      .then(res => res.json())
      .then(data => {
        let catList = Array.isArray(data) ? data : data.data || data.categories || [];
        const catMap = {};
        catList.forEach(cat => {
          catMap[cat.id] = cat.name;
        });
        setCategories(catMap);
      })
      .catch(err => console.error('Error loading categories:', err));
  }, []);

  const groupedProducts = products.reduce((acc, product) => {
    const categoryId = product.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = { 
        name: categories[categoryId] || `Category ${categoryId}`, 
        products: [] 
      };
    }
    acc[categoryId].products.push(product);
    return acc;
  }, {});

  const addToCart = (product) => {
    const variant = product.variants?.[0];
    if (!variant) {
      alert('No variants available for this product');
      return;
    }

    setCart([...cart, {
      id: Date.now(),
      product_id: product.id,
      product_name: product.product_name,
      variant_id: variant.id,
      variant_name: variant.name,
      price: Number(variant.price).toFixed(2),
      quantity: 1
    }]);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      const response = await fetch('http://192.168.68.101:8080/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashier_id: 1,
          order_type: 'takeout',
          status: 'pending',
          total: calculateTotal(),
          customer_name: customerName,
          notes: customerNotes,
          items: cart.map(item => ({
            product_name: item.product_name,
            variant_name: item.variant_name,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price
          })),
          discount_type: 'none',
          discount: 0,
          paid: calculateTotal(),
          change: 0
        })
      });

      const data = await response.json();
      const orderId = data.order_id || data.orderId || data.insertId;
      
      setCurrentOrderId(orderId);
      setOrderTotal(calculateTotal());
      setOrderCart(cart);
      setShowStatusModal(true);
    } catch (error) {
      console.error('Order placement error:', error);
      alert('Failed to place order');
    }
  };

  const printReceipt = () => {
    const receiptWindow = window.open('', '_blank', 'height=600,width=400');
    if (!receiptWindow) {
      alert('Please enable popups to print receipt');
      return;
    }

    receiptWindow.document.write(`
      <html>
      <head>
        <title>Receipt - Order #${currentOrderId}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            padding: 20px; 
            font-size: 12px;
            max-width: 300px;
            margin: 0 auto;
          }
          h1, h2 { text-align: center; margin: 5px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .header { text-align: center; margin-bottom: 15px; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
          .item-name { flex: 1; }
          .item-qty { width: 40px; text-align: center; }
          .item-price { width: 70px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          .notes { background: #f5f5f5; padding: 10px; margin: 10px 0; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Cafe Receipt</h1>
          <div style="font-size: 10px;">Show this to the cashier</div>
        </div>
        <div class="divider"></div>
        <div style="text-align: center; margin: 10px 0;">
          <h2 style="margin: 5px 0;">Order #${currentOrderId}</h2>
          <div style="font-size: 11px;">Customer: <strong>${customerName || 'Walk-in'}</strong></div>
          <div style="font-size: 10px;">${new Date().toLocaleString()}</div>
        </div>
        <div class="divider"></div>
        
        <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">
          <div style="display: flex;">
            <div class="item-name">Item</div>
            <div class="item-qty">Qty</div>
            <div class="item-price">Price</div>
          </div>
        </div>
        
        ${orderCart.map(item => `
          <div class="item-row">
            <div class="item-name">${item.product_name}</div>
            <div class="item-qty">${item.quantity}x</div>
            <div class="item-price">₱${(Number(item.price) * item.quantity).toFixed(2)}</div>
          </div>
          <div style="font-size: 9px; color: #666; margin-left: 10px;">${item.variant_name}</div>
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="total-row" style="font-size: 13px; margin-top: 10px;">
          <span>TOTAL:</span>
          <span>₱${orderTotal.toFixed(2)}</span>
        </div>
        
        ${customerNotes ? `
          <div class="notes">
            <strong>Special Requests:</strong><br>
            ${customerNotes}
          </div>
        ` : ''}
        
        <div class="divider"></div>
        <div class="footer">
          <div style="margin: 10px 0;">Thank you for your order!</div>
        </div>
      </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => receiptWindow.print(), 250);
  };

  const resetOrder = () => {
    setShowStatusModal(false);
    setCurrentOrderId(null);
    setCustomerName('');
    setCustomerNotes('');
    setCart([]);
    setOrderCart([]);
    setOrderTotal(0);
  };

  // Show receipt screen instead of products
  if (currentOrderId) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          {/* Receipt Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#073dbe] mb-2">Order Received!</h1>
            <p className="text-slate-600">Please show this receipt to the cashier</p>
          </div>

          {/* Order Number */}
          <div className="bg-[#073dbe] text-white rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-blue-100 mb-1">Order Number</p>
            <p className="text-4xl font-bold">#${currentOrderId}</p>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-slate-600 font-semibold">Customer</p>
            <p className="text-lg font-bold text-slate-900">{customerName}</p>
          </div>

          {/* Items */}
          <div className="border-t border-b border-slate-200 py-4 mb-4">
            <p className="text-xs text-slate-600 font-semibold mb-3">Items</p>
            <div className="space-y-2">
              {orderCart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.quantity}x {item.product_name}</p>
                    <p className="text-xs text-slate-600">{item.variant_name}</p>
                  </div>
                  <p className="font-bold text-slate-900">₱{(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {customerNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-amber-800 font-semibold mb-1">Special Requests</p>
              <p className="text-sm text-amber-900">{customerNotes}</p>
            </div>
          )}

          {/* Total */}
          <div className="bg-slate-100 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-900 font-bold">Total</span>
              <span className="text-2xl font-bold text-[#073dbe]">₱{orderTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={printReceipt}
              className="w-full flex items-center justify-center gap-2 bg-[#073dbe] hover:bg-[#052d99] text-white font-bold py-3 rounded-lg transition-colors"
            >
              <FiPrinter size={18} />
              Print Receipt
            </button>
            <button
              onClick={resetOrder}
              className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              <FiArrowLeft size={18} />
              Back to Ordering
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="bg-[#073dbe] text-white rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold m-0">Cafe</h1>
        <p className="text-blue-100 m-0 text-sm">Mobile Ordering</p>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <label className="block font-bold text-slate-900 mb-2">Your Name *</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <label className="block font-bold text-slate-900 mb-2">Special Requests (Optional)</label>
        <textarea
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder="e.g., no sugar, extra ice, light cream..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 focus:outline-none resize-vertical"
          maxLength="500"
          style={{ minHeight: '80px' }}
        />
        <p className="text-xs text-slate-500 mt-1">{customerNotes.length}/500 characters</p>
      </div>

      {/* Products */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Available Products</h2>
        {Object.values(groupedProducts).map((category) => (
          <div key={category.name} className="mb-6">
            <h3 className="text-base font-bold text-[#073dbe] border-b-2 border-[#073dbe] pb-2 mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {category.products.map(product => {
                const variant = product.variants?.[0];
                return (
                  <div key={product.id} className="border border-slate-300 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-slate-900 text-sm mb-2">{product.product_name}</h4>
                    {variant ? (
                      <p className="text-xs text-slate-600 mb-2">{variant.name || 'Standard'}</p>
                    ) : (
                      <p className="text-xs text-slate-400 mb-2 italic">No variant available</p>
                    )}
                    <p className="text-[#073dbe] font-bold text-sm mb-2">
                      ₱{variant ? Number(variant.price).toFixed(2) : '0.00'}
                    </p>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 bg-[#073dbe] hover:bg-[#052d99] text-white rounded-lg font-bold text-xs transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="font-bold text-slate-900 mb-3">Cart ({cart.length})</h2>
        {cart.length === 0 ? (
          <p className="text-slate-500 text-sm">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    <p className="text-slate-600">{item.variant_name}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-bold text-slate-900">₱{Number(item.price).toFixed(2)}</p>
                    <p className="text-slate-600">x{item.quantity}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-3 font-bold text-sm flex justify-between">
              <span className="text-slate-900">Total:</span>
              <span className="text-[#073dbe]">₱{calculateTotal().toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Checkout Button */}
      <button
        onClick={placeOrder}
        disabled={cart.length === 0 || !customerName.trim()}
        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
          cart.length === 0 || !customerName.trim()
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        Place Order
      </button>
    </div>
  );
}