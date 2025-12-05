import { useEffect, useState } from "react";
import api from "../../api/api";

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [discountType, setDiscountType] = useState("none");
  const [searchTerm, setSearchTerm] = useState("");

  // Fixed: Add-ons should dynamically use ingredients from backend
  const milkTeaAddOns = [
    { id: 14, name: "Pearls (Tapioca)", price: 15 },
    { id: 3, name: "Crystal Jelly", price: 15 },
    { id: 15, name: "Cream Cheese", price: 25 },
    { id: 16, name: "Pudding", price: 20 },
    { id: 17, name: "Coffee Jelly", price: 20 }
  ];

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadOrders();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await api.get("/product");
      setProducts(data.products || []);
    } catch (err) {
      console.error("Cannot load products:", err);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/category");
      setCategories(data || []);
    } catch (err) {
      console.error("Cannot load categories:", err);
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await api.get("/order");
      setOrders(data || []);
    } catch (err) {
      console.error("Cannot load orders:", err);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name.toLowerCase() : "";
  };

  const addToCart = (product, variant) => {
    // Check if variant has stock
    if (!variant.quantity || variant.quantity === 0) {
      alert(`${product.product_name} - ${variant.name} is out of stock!`);
      return;
    }

    // Check if adding more would exceed stock
    const existingInCart = cart.filter(item => item.variant_id === variant.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    if (existingInCart >= variant.quantity) {
      alert(`Cannot add more! Only ${variant.quantity} in stock.`);
      return;
    }

    const categoryName = getCategoryName(product.category_id);
    const isMilkTea = categoryName.includes("milktea") || categoryName.includes("milk tea");
    
    const cartItem = {
      id: `${product.id}-${variant.id}-${Date.now()}`,
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.product_name,
      variant_name: variant.name,
      price: variant.price,
      quantity: 1,
      image: product.image,
      category_id: product.category_id,
      isMilkTea: isMilkTea,
      addOns: [],
      maxStock: variant.quantity
    };
    
    setCart([...cart, cartItem]);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + change);
        
        // Get total quantity for this variant across all cart items
        const totalForVariant = cart
          .filter(i => i.variant_id === item.variant_id)
          .reduce((sum, i) => sum + (i.id === itemId ? newQty : i.quantity), 0);
        
        // Check if new quantity exceeds stock
        if (item.maxStock && totalForVariant > item.maxStock) {
          alert(`Cannot add more! Only ${item.maxStock} in stock.`);
          return item;
        }
        
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const toggleAddOn = (itemId, addOn) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const hasAddOn = item.addOns.some(a => a.id === addOn.id);
        const newAddOns = hasAddOn
          ? item.addOns.filter(a => a.id !== addOn.id)
          : [...item.addOns, addOn];
        return { ...item, addOns: newAddOns };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const addOnsTotal = item.addOns.reduce((s, a) => s + a.price, 0);
      return sum + (item.price + addOnsTotal) * item.quantity;
    }, 0);
  };

  const calculateDiscount = (subtotal) => {
    if (discountType === "senior" || discountType === "pwd") {
      return subtotal * 0.20;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    // Validate stock before checkout
    const stockIssues = [];
    const variantTotals = {};
    
    cart.forEach(item => {
      if (!variantTotals[item.variant_id]) {
        variantTotals[item.variant_id] = {
          quantity: 0,
          maxStock: item.maxStock,
          name: `${item.product_name} - ${item.variant_name}`
        };
      }
      variantTotals[item.variant_id].quantity += item.quantity;
    });
    
    Object.values(variantTotals).forEach(v => {
      if (v.maxStock && v.quantity > v.maxStock) {
        stockIssues.push(`${v.name}: trying to order ${v.quantity}, only ${v.maxStock} in stock`);
      }
    });
    
    if (stockIssues.length > 0) {
      alert("Stock issues:\n" + stockIssues.join("\n"));
      return;
    }

    // Fixed: Ensure variant_id is included in order data
const orderData = {
  cashier_id: 1,
  order_type: "dine-in",
  status: "completed",
  total: calculateTotal(),
  items: cart.map(item => ({
    product_id: item.product_id, // <-- add this
    variant_id: item.variant_id,
    quantity: item.quantity,
    subtotal: (item.price + item.addOns.reduce((s, a) => s + a.price, 0)) * item.quantity
  }))
};
    try {
      await api.post("/order/add", orderData);
      alert("Order created successfully!");
      setCart([]);
      setDiscountType("none");
      await loadOrders();
      await loadProducts();
    } catch (err) {
      console.error("Checkout error:", err);
      alert(`Failed to create order: ${err.response?.data?.message || err.message}`);
    }
  };

const printReceipt = (order, orderId, isDiscounted) => {
  const change = order.paid - order.total;

  const receiptWindow = window.open("", "PRINT", "height=600,width=400");
  receiptWindow.document.write(`
    <html>
    <head>
      <title>Receipt</title>
      <style>
        body { font-family: monospace; padding: 20px; white-space: pre; font-size: 12px; }
        h2, h3 { text-align: center; margin: 0; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
      </style>
    </head>
    <body>
        Barcelo Cafe
        La Consolacion College - Address Something
        Phone Number

        Receipt
        ${isDiscounted ? "Senior/PWD Discount Applied (-₱5)\n" : ""}

Description           Qty   Size     Price
-------------------------------------------

${order.items
  .map(item => {
    const name = (item.product_name.length > 18
      ? item.product_name.substring(0, 18)
      : item.product_name
    ).padEnd(18, ' ');

    const qty = `x${item.quantity}`.padEnd(5, ' ');
    const variant = (item.variant_name || '').padEnd(8, ' ');
    const price = `₱${item.subtotal.toFixed(2)}`.padStart(8, ' ');

    return `${name}${qty}${variant}${price}`;
  })
  .join('\n')}

-------------------------------------------
Total                  P ${order.total.toFixed(2)}
Cash                   P ${order.paid.toFixed(2)}
Change                 P ${change.toFixed(2)}

Reference No. BARCELO${orderId}

Thank you for your order!
Printed on ${new Date().toLocaleString()}
    </body>
    </html>
  `);
  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
};


  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category_id === Number(selectedCategory);
    const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sidebar - Categories */}
      <div className="w-64 bg-white shadow-2xl overflow-y-auto">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-2xl font-bold text-white">Categories</h2>
        </div>
        <div className="p-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            All Products
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(String(category.id))}
              className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all ${
                selectedCategory === String(category.id)
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Products */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-800">Cashier POS</h1>
            <button
              onClick={() => setShowOrderHistory(!showOrderHistory)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {showOrderHistory ? "Show Products" : "Order History"}
            </button>
          </div>
          
          {!showOrderHistory && (
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none shadow-sm"
            />
          )}
        </div>

        {showOrderHistory ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg">No orders yet</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Order #{order.id}</h3>
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                        order.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">₱{order.total}</p>
                      <button
                        onClick={() => printReceipt(order)}
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <span className="text-gray-800 font-medium">{item.product_name}</span>
                          {item.variant_name && (
                            <span className="text-gray-500 text-sm ml-2">({item.variant_name})</span>
                          )}
                          <span className="text-gray-600 ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-blue-600">₱{Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-12">
                <p className="text-lg">No products found</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={`http://localhost:8080/uploads/${product.image}`}
                        alt={product.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{product.product_name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.product_description}</p>
                    
                    {product.variants?.map(variant => (
                      <div key={variant.id} className="mb-2">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">{variant.name}</span>
                            <p className="text-blue-600 font-bold">₱{variant.price}</p>
                            <p className={`text-xs mt-1 ${
                              variant.quantity === 0 ? "text-red-600 font-semibold" : 
                              variant.quantity < 10 ? "text-orange-600" : 
                              "text-gray-500"
                            }`}>
                              Stock: {variant.quantity || 0}
                              {variant.quantity === 0 && " - Out of Stock"}
                              {variant.quantity > 0 && variant.quantity < 10 && " - Low Stock"}
                            </p>
                          </div>
                          <button
                            onClick={() => addToCart(product, variant)}
                            disabled={variant.quantity === 0}
                            className={`px-4 py-2 rounded-lg transition-all ${
                              variant.quantity === 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                            }`}
                          >
                            {variant.quantity === 0 ? "Out of Stock" : "Add"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white shadow-2xl overflow-y-auto">
        <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600">
          <h2 className="text-2xl font-bold text-white">Cart ({cart.length})</h2>
        </div>
        
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4 shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">{item.variant_name}</p>
                        <p className="text-blue-600 font-bold mt-1">₱{item.price}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg font-bold"
                      >
                        +
                      </button>
                    </div>

                    {item.isMilkTea && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Add-ons (Toppings):</p>
                        <div className="space-y-2">
                          {milkTeaAddOns.map(addOn => (
                            <label key={addOn.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={item.addOns.some(a => a.id === addOn.id)}
                                onChange={() => toggleAddOn(item.id, addOn)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-sm text-gray-700 flex-1">{addOn.name}</span>
                              <span className="text-sm text-blue-600 font-semibold">+₱{addOn.price}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-2 mt-2">
                      <p className="text-right font-bold text-gray-800">
                        Subtotal: ₱{((item.price + item.addOns.reduce((s, a) => s + a.price, 0)) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 mb-4 border-2 border-yellow-200">
                <p className="font-semibold text-gray-800 mb-2">Discount:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "none"}
                      onChange={() => setDiscountType("none")}
                      className="w-4 h-4"
                    />
                    <span>None</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "senior"}
                      onChange={() => setDiscountType("senior")}
                      className="w-4 h-4"
                    />
                    <span>Senior Citizen (20%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "pwd"}
                      onChange={() => setDiscountType("pwd")}
                      className="w-4 h-4"
                    />
                    <span>PWD (20%)</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                {(discountType === "senior" || discountType === "pwd") && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount (20%):</span>
                    <span className="font-semibold">-₱{calculateDiscount(calculateSubtotal()).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-4"
              >
                Checkout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}