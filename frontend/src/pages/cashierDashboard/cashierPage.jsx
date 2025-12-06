import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState("none");
  const [searchTerm, setSearchTerm] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [toppings, setToppings] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadOrderForEdit = (order) => {
    console.log("Loading order for edit:", order);
    
    if (!order || !order.items || order.items.length === 0) {
      console.error("Invalid order data:", order);
      alert("Cannot load order - invalid data");
      return;
    }
    
    // Convert order items back to cart format
    const cartItems = order.items.map((item, index) => ({
      id: `edit-${order.id}-${index}`,
      product_id: item.product_id,
      product_name: item.product_name,
      variant_id: item.variant_id,
      variant_name: item.variant_name,
      price: Number(item.price || 0),
      quantity: item.quantity,
      topping_id: item.topping_id || null,
      isMilkTea: item.topping_id !== null,
      maxStock: 999
    }));
    
    console.log("Cart items to load:", cartItems);
    
    setCart(cartItems);
    setDiscountType(order.discount_type || "none");
    setEditingOrderId(order.id);
    
    // Clear the navigation state
    window.history.replaceState({}, document.title);
    
    alert("Order loaded for editing. Make your changes and checkout again.");
  };

  // Debug: Log when location state changes
  useEffect(() => {
    console.log("Location state changed:", location.state);
  }, [location]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadToppings();
  }, []);

  useEffect(() => {
    // Check if we're editing an order
    console.log("Checking for edit order:", location.state?.editOrder);
    if (location.state?.editOrder) {
      loadOrderForEdit(location.state.editOrder);
    }
  }, [location.state]);

  // Add this useEffect
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart]);

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

  const loadToppings = async () => {
    try {
      const { data } = await api.get("/addons");
      setToppings(data || []);
    } catch (err) {
      console.error("Cannot load toppings:", err);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name.toLowerCase() : "";
  };

  const addToCart = (product, variant) => {
    if (!variant.quantity || variant.quantity === 0) {
      alert(`${product.product_name} - ${variant.name} is out of stock!`);
      return;
    }

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
      price: Number(variant.price),
      quantity: 1,
      image: product.image,
      category_id: product.category_id,
      isMilkTea: isMilkTea,
      topping_id: null,
      maxStock: variant.quantity
    };
    
    setCart([...cart, cartItem]);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + change);
        
        const totalForVariant = cart
          .filter(i => i.variant_id === item.variant_id)
          .reduce((sum, i) => sum + (i.id === itemId ? newQty : i.quantity), 0);
        
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

  const selectTopping = (itemId, toppingId) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          topping_id: item.topping_id === toppingId ? null : toppingId 
        };
      }
      return item;
    }));
  };

  const getToppingById = (toppingId) => {
    return toppings.find(t => t.id === toppingId);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const toppingPrice = item.topping_id 
        ? parseFloat(getToppingById(item.topping_id)?.price) || 0
        : 0;
      const quantity = Number(item.quantity) || 0;

      return sum + (itemPrice + toppingPrice) * quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    if (discountType === "senior" || discountType === "pwd") {
      return 5;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const paid = parseFloat(amountPaid);
    const total = calculateTotal();

    if (isNaN(paid) || paid < total) {
      alert(`Insufficient payment! Total: ₱${total.toFixed(2)}`);
      return;
    }

    const change = paid - total;

    // Get user from localStorage - admin acts as cashier
    const user = JSON.parse(localStorage.getItem("user"));
    const cashier_id = user?.id;

    if (!cashier_id) {
      alert("User session not found. Please log in again.");
      return;
    }

    try {
      const orderData = {
        cashier_id: cashier_id,
        order_type: "dine-in",
        status: "completed",
        total: parseFloat(total.toFixed(2)),
        items: cart.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          topping_id: item.topping_id || null,
          quantity: item.quantity,
          subtotal: parseFloat(((Number(item.price) + Number(getToppingById(item.topping_id)?.price || 0)) * Number(item.quantity)).toFixed(2)),
        })),
      };

      console.log("Order data:", JSON.stringify(orderData, null, 2));

      // Store cart items for receipt
      const cartItemsForReceipt = [...cart];
      const receiptData = {
        total: total,
        discount: calculateDiscount(),
        discount_type: discountType,
        paid: paid,
        change: change
      };

      if (editingOrderId) {
        const response = await api.put(`/order/${editingOrderId}`, orderData);
        alert(`Order #${editingOrderId} updated successfully!\n\nTotal: ₱${total.toFixed(2)}\nPaid: ₱${paid.toFixed(2)}\nChange: ₱${change.toFixed(2)}`);
        
        // Print receipt for updated order
        printReceipt(receiptData, editingOrderId, change, cartItemsForReceipt);
        
        setEditingOrderId(null);
      } else {
        const response = await api.post("/order", orderData);
        const orderId = response.data.id || response.data.order_id;
        alert(`Order completed!`);
        
        // Print receipt for new order
        printReceipt(receiptData, orderId, change, cartItemsForReceipt);
      }

      // Reset cart and form
      setCart([]);
      setDiscountType("none");
      setAmountPaid("");
      
    } catch (err) {
      console.error("Checkout error:", err);
      console.error("Error details:", err.response?.data);
      alert(`Failed to complete order: ${err.response?.data?.message || err.message}`);
    }
  };

  const printReceipt = (order, orderId, change, cartItems) => {
    const isDiscounted = order.discount > 0;

    // ensure numbers are safe (avoid NaN)
    const safeTotal = Number(order.total || 0);
    const safeDiscount = Number(order.discount || 0);
    const safeChange = Number(change ?? 0);
    const safePaid = Number(order.paid || 0) || (safeTotal + safeChange);

    const receiptWindow = window.open("", "_blank", "height=600,width=400");
    if (!receiptWindow) {
      alert("Popup blocked. Please allow popups to print the receipt.");
      return;
    }

    receiptWindow.document.write(`
      <html>
      <head>
        <title>Receipt - Order #${orderId}</title>
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
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Order #:</span>
            <span>${orderId}</span>
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

        ${cartItems.map(item => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          const topping = item.topping_id ? getToppingById(item.topping_id) : null;
          const toppingPrice = Number(topping?.price || 0);
          const totalPrice = (price + toppingPrice) * qty;
          
           let itemHTML = `
             <div class="item-row">
               <div class="item-name">${item.product_name || ""}</div>
               <div class="item-qty">x${qty}</div>
               <div class="item-price">₱${totalPrice.toFixed(2)}</div>
             </div>
           `;
          if (item.variant_name) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">${item.variant_name}</div>`;
          if (topping) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">+ ${topping.name}</div>`;
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
          <div style="margin: 10px 0;">Reference No: BARCELO${String(orderId).padStart(6, '0')}</div>
          <div style="margin: 10px 0; font-weight: bold;">Thank you for your order!</div>
          <div>Please come again!</div>
        </div>
      </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
    
    // REMOVED automatic print - user can print manually from the preview window
    // This prevents double printing issue
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || String(product.category_id) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryId = product.category_id || 'uncategorized';
    const categoryName = getCategoryName(product.category_id) || 'Uncategorized';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: categoryName,
        products: []
      };
    }
    
    acc[categoryId].products.push(product);
    return acc;
  }, {});

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar - Categories */}
      <div className="w-full lg:w-64 xl:w-72 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 lg:p-6 bg-indigo-600 sticky top-0 z-10">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Menu</h2>
          <p className="text-indigo-100 text-xs lg:text-sm mt-1">Select a category</p>
        </div>
        <div className="flex-1 p-3 lg:p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 border border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <span>All Products</span>
            </div>
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(String(category.id))}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                selectedCategory === String(category.id)
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="capitalize">{category.name}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="sticky bottom-0 p-3 lg:p-4 bg-white border-t border-gray-200">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-gray-700 hover:bg-gray-800 text-white px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-md"
          >
            <span>←</span>
            <span>Back to Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
          <div className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Barcelo Cafe</h1>
                
              </div>
              <button
                onClick={() => navigate("/cashier/order")}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <span>Order History</span>
              </button>
            </div>
          
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 lg:py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-xs lg:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 lg:py-20">
              <p className="text-lg lg:text-xl text-gray-500 font-medium">No products found</p>
              <p className="text-gray-400 mt-2">Try a different search term or category</p>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-8">
              {Object.entries(groupedProducts).map(([categoryId, categoryData]) => (
                <div key={categoryId}>
                  {/* Category Header */}
                  <div className="mb-4 lg:mb-5 pb-2.5 lg:pb-3 border-b-2 border-indigo-200">
                    <div className="flex-1">
                      <h2 className="text-lg lg:text-xl font-bold text-gray-800 capitalize">
                        {categoryData.name}
                      </h2>
                      <p className="text-xs lg:text-sm text-gray-500 mt-1">{categoryData.products.length} product{categoryData.products.length !== 1 ? 's' : ''} available</p>
                    </div>
                  </div>
                
                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
                    {categoryData.products.map(product => (
                      <div key={product.id} className="group bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-300">
                        <div className="h-36 lg:h-44 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                          {product.image ? (
                            <img
                              src={`http://localhost:8080/uploads/${product.image}`}
                              alt={product.product_name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-2xl text-gray-400">?</span>
                              </div>
                              <p className="text-gray-400 text-xs mt-2">No image</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 lg:p-4">
                          <h3 className="font-bold text-sm lg:text-base text-gray-900 mb-1 line-clamp-1">{product.product_name}</h3>
                          <p className="text-xs text-gray-500 mb-2.5 lg:mb-3 line-clamp-2 min-h-[28px] lg:min-h-[32px]">{product.product_description || 'No description available'}</p>
                        
                          <div className="space-y-2">
                            {product.variants?.map(variant => (
                              <div key={variant.id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 hover:border-indigo-400 transition-all">
                                <div className="flex justify-between items-start lg:items-center gap-2 mb-1.5">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-xs lg:text-sm text-gray-800 block truncate">{variant.name}</span>
                                    <p className="text-indigo-600 font-bold text-sm lg:text-base mt-0.5">₱{Number(variant.price).toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-medium flex items-center gap-1 ${
                                      variant.quantity === 0 ? "text-red-600" : 
                                      variant.quantity < 10 ? "text-orange-600" : 
                                      "text-green-600"
                                    }`}>
                                    <span>
                                      {variant.quantity === 0 ? "Out of Stock" : 
                                       variant.quantity < 10 ? `Low Stock (${variant.quantity})` : 
                                       `Stock: ${variant.quantity}`}
                                    </span>
                                  </p>
                                  <button
                                    onClick={() => addToCart(product, variant)}
                                    disabled={variant.quantity === 0}
                                    className={`px-2.5 lg:px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 whitespace-nowrap ${
                                      variant.quantity === 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md"
                                    }`}
                                  >
                                    {variant.quantity === 0 ? "Unavailable" : "Add to Cart"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
        <div className="p-4 lg:p-6 bg-green-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                <span>Shopping Cart</span>
              </h2>
              <p className="text-green-100 text-xs lg:text-sm mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
            {cart.length > 0 && (
              <div className="bg-white/20 rounded-full px-3 lg:px-4 py-1.5 lg:py-2">
                <p className="text-white font-bold text-base lg:text-lg">{cart.length}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 lg:p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 lg:py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-lg lg:text-xl font-medium text-gray-500">Cart is empty</p>
              <p className="text-gray-400 mt-2 text-xs lg:text-sm">Add some products to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6">
                {cart.map(item => {
                  const selectedTopping = item.topping_id ? getToppingById(item.topping_id) : null;
                  return (
                    <div key={item.id} className="bg-white rounded-lg p-3 lg:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm lg:text-base line-clamp-1">{item.product_name}</h4>
                          <p className="text-xs lg:text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <span>{item.variant_name}</span>
                          </p>
                          <p className="text-indigo-600 font-bold mt-1 text-base lg:text-lg">₱{Number(item.price).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-white hover:bg-red-500 w-7 h-7 lg:w-8 lg:h-8 rounded-lg font-bold text-lg lg:text-xl transition-all flex items-center justify-center flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center gap-2 lg:gap-3 mb-2.5 bg-gray-50 rounded-lg p-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 lg:w-9 lg:h-9 rounded-lg font-bold shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        >
                          -
                        </button>
                        <span className="font-bold text-lg lg:text-xl text-gray-800 flex-1 text-center bg-white rounded-lg py-1.5 lg:py-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 lg:w-9 lg:h-9 rounded-lg font-bold shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        >
                          +
                        </button>
                      </div>

                      {item.isMilkTea && toppings.length > 0 && (
                        <div className="border-t border-gray-200 pt-2.5 mt-2.5">
                          <p className="text-xs lg:text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                            <span>Add-ons Available:</span>
                          </p>
                          <div className="space-y-1">
                            {toppings.map(topping => (
                              <label key={topping.id} className="flex items-center gap-2 cursor-pointer hover:bg-indigo-50 p-2 rounded-lg transition-all border border-transparent hover:border-indigo-200">
                                <input
                                  type="radio"
                                  name={`topping-${item.id}`}
                                  checked={item.topping_id === topping.id}
                                  onChange={() => selectTopping(item.id, topping.id)}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs lg:text-sm text-gray-700 flex-1 font-medium">{topping.name}</span>
                                <span className="text-xs lg:text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">+₱{Number(topping.price).toFixed(2)}</span>
                              </label>
                            ))}
                          </div>
                          {selectedTopping && (
                            <button
                              onClick={() => selectTopping(item.id, item.topping_id)}
                              className="mt-1.5 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                              <span>Remove add-on</span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-2.5 mt-2.5 bg-indigo-50 rounded-lg p-2">
                        <p className="flex items-center justify-between">
                          <span className="text-xs lg:text-sm text-gray-600 font-medium">Item Total:</span>
                          <span className="text-base lg:text-lg font-bold text-indigo-600">₱{((Number(item.price) + Number(selectedTopping?.price || 0)) * Number(item.quantity)).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 rounded-lg p-3 lg:p-4 mb-3 lg:mb-4 border border-amber-200">
                <p className="font-bold text-gray-800 mb-2.5 flex items-center gap-2 text-sm lg:text-base">
                  <span>Apply Discount:</span>
                </p>
                <div className="space-y-1.5 lg:space-y-2">
                  <label className="flex items-center gap-2 lg:gap-3 cursor-pointer hover:bg-white/50 p-2 lg:p-2.5 rounded-lg transition-all border border-transparent hover:border-amber-300">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "none"}
                      onChange={() => setDiscountType("none")}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-gray-700 text-xs lg:text-sm">No Discount</span>
                  </label>
                  <label className="flex items-center gap-2 lg:gap-3 cursor-pointer hover:bg-white/50 p-2 lg:p-2.5 rounded-lg transition-all border border-transparent hover:border-amber-300">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "senior"}
                      onChange={() => setDiscountType("senior")}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium text-gray-700 text-xs lg:text-sm">Senior Citizen</span>
                      <span className="text-amber-700 font-bold bg-amber-100 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-xs">-₱5.00</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 lg:gap-3 cursor-pointer hover:bg-white/50 p-2 lg:p-2.5 rounded-lg transition-all border border-transparent hover:border-amber-300">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "pwd"}
                      onChange={() => setDiscountType("pwd")}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium text-gray-700 text-xs lg:text-sm">PWD</span>
                      <span className="text-amber-700 font-bold bg-amber-100 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-xs">-₱5.00</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 lg:p-4 space-y-2 lg:space-y-2.5 mb-3 lg:mb-4 border border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium text-sm lg:text-base">Subtotal:</span>
                  <span className="font-bold text-gray-800 text-base lg:text-lg">₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                {(discountType === "senior" || discountType === "pwd") && (
                  <div className="flex justify-between text-red-600 bg-red-50 rounded-lg p-1.5 lg:p-2">
                    <span className="font-medium flex items-center gap-1 text-sm lg:text-base">
                      <span>Discount:</span>
                    </span>
                    <span className="font-bold text-sm lg:text-base">-₱{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg lg:text-xl font-bold border-t-2 border-gray-300 pt-2 lg:pt-2.5">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-green-600 bg-green-50 px-2 lg:px-3 py-1 rounded-lg">₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 lg:p-4 mb-3 lg:mb-4 border border-blue-200">
                <label className="block font-bold text-gray-800 mb-2 lg:mb-2.5 flex items-center gap-2 text-sm lg:text-base">
                  <span>Amount Paid:</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 lg:px-4 py-3 rounded-lg border-2 border-blue-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-lg lg:text-xl font-bold text-gray-800"
                />
                {amountPaid && !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) >= calculateTotal() && (
                  <div className="mt-2.5 p-3 bg-green-500 rounded-lg">
                    <p className="text-white font-bold flex items-center justify-between text-base lg:text-lg">
                      <span className="flex items-center gap-2">
                        <span>Change:</span>
                      </span>
                      <span className="text-xl lg:text-2xl">₱{(parseFloat(amountPaid) - calculateTotal()).toFixed(2)}</span>
                    </p>
                  </div>
                )}
                {amountPaid && !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) < calculateTotal() && (
                  <div className="mt-2.5 p-3 bg-red-500 rounded-lg">
                    <p className="text-white font-bold flex items-center justify-between text-sm lg:text-base">
                      <span className="flex items-center gap-2">
                        <span>Need more:</span>
                      </span>
                      <span className="text-lg lg:text-xl">₱{(calculateTotal() - parseFloat(amountPaid)).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 lg:py-4 rounded-lg font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-xl lg:text-2xl">{editingOrderId ? "✏️" : "✅"}</span>
                <span>{editingOrderId ? "Update Order" : "Complete Order"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}