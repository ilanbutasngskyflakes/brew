/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/purity */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { 
  FiShoppingCart, 
  FiSearch, 
  FiX, 
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowLeft,
  FiPackage
} from "react-icons/fi";

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [orderType, setOrderType] = useState("dine-in");
  const navigate = useNavigate();
  const location = useLocation();

  const loadOrderForEdit = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      alert("Cannot load order - invalid data");
      return;
    }
    
    const cartItems = order.items.map((item, index) => {
      // Find the product that has this variant
      let product = null;
      let variant = null;
      
      for (const p of products) {
        const foundVariant = p.variants?.find(v => v.id === item.variant_id);
        if (foundVariant) {
          product = p;
          variant = foundVariant;
          break;
        }
      }
      
      // Use current variant price, fallback to 0 if not found
      const currentPrice = variant ? Number(variant.price) : 0;
      
      return {
        id: `edit-${order.id}-${index}`,
        product_id: product?.id || item.product_id,
        product_name: item.product_name,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        price: currentPrice,
        quantity: item.quantity,
        topping_id: item.topping_id || null,
        isMilkTea: item.topping_id !== null,
        maxStock: 9999,
        isEditMode: true
      };
    });
    
    setCart(cartItems);
    setDiscountType(order.discount_type || "none");
    setOrderType(order.order_type || "dine-in");
    setEditingOrderId(order.id);
    window.history.replaceState({}, document.title);
    alert("Order loaded for editing");
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadToppings();
  }, []);

  useEffect(() => {
    if (location.state?.editOrder && toppings.length > 0 && products.length > 0) {
      loadOrderForEdit(location.state.editOrder);
    }
  }, [location.state, toppings, products]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have items in your cart';
        return e.returnValue;
      }
    };

    const handlePopState = (e) => {
      if (cart.length > 0 || editingOrderId) {
        const confirmLeave = window.confirm(
          editingOrderId 
            ? 'You are editing an order. Leave?'
            : 'You have items in cart. Leave?'
        );
        
        if (!confirmLeave) {
          e.preventDefault();
          window.history.pushState(null, '', window.location.href);
        } else {
          setCart([]);
          setEditingOrderId(null);
        }
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [cart, editingOrderId]);

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

  const handleProductClick = (product) => {
    if (product.variants && product.variants.length > 0) {
      const hasStock = product.variants.some(v => v.quantity > 0);
      if (!hasStock && !editingOrderId) {
        alert(`${product.product_name} is out of stock!`);
        return;
      }
      
      if (product.variants.length === 1) {
        addToCart(product, product.variants[0]);
      } else {
        setSelectedProduct(product);
        setShowVariantModal(true);
      }
    }
  };

  const addToCart = (product, variant) => {
    if (!editingOrderId && (!variant.quantity || variant.quantity === 0)) {
      alert(`${product.product_name} - ${variant.name} is out of stock!`);
      return;
    }

    const existingInCart = cart
      .filter(item => item.variant_id === variant.id && !item.isEditMode)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    if (!editingOrderId && existingInCart >= variant.quantity) {
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
      maxStock: editingOrderId ? 9999 : variant.quantity,
      isEditMode: false
    };
    
    setCart([...cart, cartItem]);
    setShowVariantModal(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + change);
        
        if (!item.isEditMode) {
          const totalForVariant = cart
            .filter(i => i.variant_id === item.variant_id && !i.isEditMode)
            .reduce((sum, i) => sum + (i.id === itemId ? newQty : i.quantity), 0);
          
          if (item.maxStock && totalForVariant > item.maxStock) {
            alert(`Cannot add more! Only ${item.maxStock} in stock.`);
            return item;
          }
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

  const handleNavigateWithConfirm = (path) => {
    if (cart.length > 0 || editingOrderId) {
      const confirmLeave = window.confirm(
        editingOrderId 
          ? 'You are editing an order. Leave?'
          : 'You have items in cart. Leave?'
      );
      
      if (confirmLeave) {
        setCart([]);
        setEditingOrderId(null);
        navigate(path);
      }
    } else {
      navigate(path);
    }
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
    const user = JSON.parse(localStorage.getItem("user"));
    const cashier_id = user?.id;

    if (!cashier_id) {
      alert("User session not found. Please log in again.");
      return;
    }

    try {
      const orderData = {
        cashier_id: cashier_id,
        order_type: orderType,
        status: "completed",
        discount_type: discountType,
        discount: calculateDiscount(),
        total: parseFloat(total.toFixed(2)),
        items: cart.map(item => {
          const toppingPrice = item.topping_id ? Number(getToppingById(item.topping_id)?.price || 0) : 0;
          const itemPrice = Number(item.price);
          const totalItemPrice = itemPrice + toppingPrice;
          
          return {
            product_id: item.product_id,
            variant_id: item.variant_id,
            topping_id: item.topping_id || null,
            quantity: item.quantity,
            price: parseFloat(totalItemPrice.toFixed(2)),
            subtotal: parseFloat((totalItemPrice * item.quantity).toFixed(2)),
          };
        }),
      };

      const cartItemsForReceipt = [...cart];
      const receiptData = {
        total: total,
        discount: calculateDiscount(),
        discount_type: discountType,
        paid: paid,
        change: change,
        order_type: orderType
      };

      if (editingOrderId) {
        await api.put(`/order/${editingOrderId}`, orderData);
        alert(`Order #${editingOrderId} updated!`);
        printReceipt(receiptData, editingOrderId, change, cartItemsForReceipt);
        setEditingOrderId(null);
      } else {
        const response = await api.post("/order", orderData);
        const orderId = response.data.id || response.data.order_id;
        alert(`Order completed!`);
        printReceipt(receiptData, orderId, change, cartItemsForReceipt);
      }

      setCart([]);
      setDiscountType("none");
      setAmountPaid("");
      setOrderType("dine-in");
      
    } catch (err) {
      console.error("Checkout error:", err);
      alert(`Failed to complete order: ${err.response?.data?.message || err.message}`);
    }
  };

  const printReceipt = (order, orderId, change, cartItems) => {
    const isDiscounted = order.discount > 0;
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
        <div class="order-type">${order.order_type === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</div>
        ${isDiscounted ? `<div class="discount-note">${order.discount_type === 'senior' ? 'SENIOR CITIZEN' : 'PWD'} DISCOUNT APPLIED (-₱${safeDiscount.toFixed(2)})</div>` : ''}
        <div class="divider"></div>
        <div style="font-size: 11px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>Date:</span><span>${new Date().toLocaleString()}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Order #:</span><span>${orderId}</span></div>
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
          let itemHTML = `<div class="item-row"><div class="item-name">${item.product_name || ""}</div><div class="item-qty">x${qty}</div><div class="item-price">₱${totalPrice.toFixed(2)}</div></div>`;
          if (item.variant_name) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">${item.variant_name}</div>`;
          if (topping) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">+ ${topping.name}</div>`;
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
          <div style="margin: 10px 0;">Reference No: BARCELO${String(orderId).padStart(6, '0')}</div>
          <div style="margin: 10px 0; font-weight: bold;">Thank you for your order!</div>
          <div>Please come again!</div>
        </div>
      </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || String(product.category_id) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = categories.map(category => ({
    category,
    products: filteredProducts.filter(p => p.category_id === category.id)
  }));

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Categories */}
      <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 bg-[#073dbe]">
          <h2 className="text-lg font-bold text-white mb-1">Categories</h2>
          <p className="text-blue-100 text-xs">Browse menu</p>
          {editingOrderId && (
            <div className="mt-2 bg-amber-500 text-white px-2 py-1.5 rounded-lg text-xs font-bold">
              Editing Order #{editingOrderId}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all font-medium text-sm ${
              selectedCategory === "all"
                ? "bg-[#073dbe] text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>All Products</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === "all" ? "bg-white/20" : "bg-slate-300"
              }`}>
                {products.length}
              </span>
            </div>
          </button>
          
          {categories.map(category => {
            const count = products.filter(p => p.category_id === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(String(category.id))}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all font-medium capitalize text-sm ${
                  selectedCategory === String(category.id)
                    ? "bg-[#073dbe] text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === String(category.id) ? "bg-white/20" : "bg-slate-300"
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="p-3 bg-white border-t border-slate-200">
          <button
            onClick={() => handleNavigateWithConfirm("/dashboard")}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
          >
            <FiArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Barcelo Cafe</h1>
                <p className="text-slate-600 text-sm mt-0.5">Select products to add to cart</p>
              </div>
              <button
                onClick={() => handleNavigateWithConfirm("/cashier/order")}
                className="w-full sm:w-auto bg-[#073dbe] hover:bg-[#052d99] text-white px-4 py-2 rounded-lg transition-all font-medium text-sm"
              >
                Order History
              </button>
            </div>
          
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiPackage className="text-slate-400 text-2xl" />
              </div>
              <p className="text-lg text-slate-900 font-bold mb-1">No products found</p>
              <p className="text-slate-500 text-sm">Try a different search term or category</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedProducts.map(({ category, products: categoryProducts }) => {
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <h2 className="text-xl font-bold text-slate-900 capitalize mb-3">{category.name}</h2>
                  
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {categoryProducts.map(product => {
                        const hasStock = product.variants?.some(v => v.quantity > 0);
                        return (
                          <div 
                            key={product.id} 
                            onClick={() => hasStock && handleProductClick(product)}
                            className={`bg-white rounded-lg border border-slate-200 overflow-hidden transition-all ${
                              hasStock ? 'hover:border-[#073dbe] cursor-pointer' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                              {product.image ? (
                                <img
                                  src={`http://localhost:8080/uploads/${product.image}`}
                                  alt={product.product_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-3">
                                  <FiPackage className="text-slate-400 text-3xl mx-auto mb-2" />
                                  <p className="text-slate-400 text-xs">No image</p>
                                </div>
                              )}
                              
                              {!hasStock && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                                    OUT OF STOCK
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-3">
                              <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">{product.product_name}</h3>
                              
                              {product.variants && product.variants.length > 0 && (
                                <div>
                                  {product.variants.length === 1 ? (
                                    <div className="flex items-center justify-between">
                                      <p className="text-[#073dbe] font-bold text-lg">
                                        ₱{Number(product.variants[0].price).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Stock: {product.variants[0].quantity}
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-0.5">{product.variants.length} variants</p>
                                      <p className="text-[#073dbe] font-bold text-lg">
                                        From ₱{Math.min(...product.variants.map(v => Number(v.price))).toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.product_name}</h3>
                <p className="text-slate-600 text-sm mt-0.5">Select a variant</p>
              </div>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {selectedProduct.variants?.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => addToCart(selectedProduct, variant)}
                  disabled={variant.quantity === 0}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    variant.quantity === 0
                      ? "bg-slate-100 border-slate-200 cursor-not-allowed opacity-50"
                      : "bg-white border-slate-300 hover:border-[#073dbe] hover:bg-blue-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{variant.name}</p>
                      <p className="text-[#073dbe] font-bold text-xl mt-0.5">₱{Number(variant.price).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {variant.quantity === 0 ? "Out of Stock" : `Stock: ${variant.quantity}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 bg-[#073dbe]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiShoppingCart size={18} />
                Cart
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
            {cart.length > 0 && (
              <div className="bg-white/20 rounded-full px-2.5 py-0.5">
                <p className="text-white font-bold text-sm">{cart.length}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <FiShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-600 mb-1">Cart is empty</p>
              <p className="text-slate-400 text-xs">Add products to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {cart.map(item => {
                  const selectedTopping = item.topping_id ? getToppingById(item.topping_id) : null;
                  return (
                    <div key={item.id} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.product_name}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{item.variant_name}</p>
                          <p className="text-[#073dbe] font-bold mt-1">₱{Number(item.price).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-white hover:bg-red-600 w-7 h-7 rounded-lg font-bold transition-all flex items-center justify-center"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-lg font-bold transition-all flex items-center justify-center"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="font-bold text-lg text-slate-800 flex-1 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-green-600 hover:bg-green-700 text-white w-8 h-8 rounded-lg font-bold transition-all flex items-center justify-center"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>

                      {item.isMilkTea && toppings.length > 0 && (
                        <div className="border-t border-slate-200 pt-2 mt-2">
                          <p className="text-xs font-bold text-slate-800 mb-2">Add-ons:</p>
                          <div className="space-y-1.5">
                            {toppings.map(topping => (
                              <label key={topping.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-all">
                                <input
                                  type="radio"
                                  name={`topping-${item.id}`}
                                  checked={item.topping_id === topping.id}
                                  onChange={() => selectTopping(item.id, topping.id)}
                                  className="w-4 h-4 text-[#073dbe]"
                                />
                                <span className="text-xs text-slate-700 flex-1 font-medium">{topping.name}</span>
                                <span className="text-xs text-[#073dbe] font-bold">+₱{Number(topping.price).toFixed(2)}</span>
                              </label>
                            ))}
                          </div>
                          {selectedTopping && (
                            <button
                              onClick={() => selectTopping(item.id, item.topping_id)}
                              className="mt-1.5 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                              <FiX size={12} />
                              Remove add-on
                            </button>
                          )}
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-2 mt-2 bg-slate-50 rounded-lg p-2">
                        <p className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-semibold">Item Total:</span>
                          <span className="text-base font-bold text-[#073dbe]">₱{((Number(item.price) + Number(selectedTopping?.price || 0)) * Number(item.quantity)).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Type */}
              <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                <p className="font-bold text-slate-800 mb-2 text-sm">Order Type</p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === "dine-in"}
                      onChange={() => setOrderType("dine-in")}
                      className="w-4 h-4 text-[#073dbe]"
                    />
                    <span className="font-semibold text-slate-700 text-sm">Dine In</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === "takeout"}
                      onChange={() => setOrderType("takeout")}
                      className="w-4 h-4 text-[#073dbe]"
                    />
                    <span className="font-semibold text-slate-700 text-sm">Take Out</span>
                  </label>
                </div>
              </div>

              {/* Discount */}
              <div className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">
                <p className="font-bold text-slate-800 mb-2 text-sm">Discount</p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "none"}
                      onChange={() => setDiscountType("none")}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="font-semibold text-slate-700 text-sm">No Discount</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "senior"}
                      onChange={() => setDiscountType("senior")}
                      className="w-4 h-4 text-amber-600"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-sm">Senior Citizen</span>
                      <span className="text-amber-700 font-bold text-xs">-₱5.00</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                    <input
                      type="radio"
                      name="discount"
                      checked={discountType === "pwd"}
                      onChange={() => setDiscountType("pwd")}
                      className="w-4 h-4 text-amber-600"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-sm">PWD</span>
                      <span className="text-amber-700 font-bold text-xs">-₱5.00</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 mb-3 border border-slate-200">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-bold text-slate-800">₱{calculateSubtotal().toFixed(2)}</span>
                </div>
                {(discountType === "senior" || discountType === "pwd") && (
                  <div className="flex justify-between text-red-600 text-sm">
                    <span className="font-semibold">Discount:</span>
                    <span className="font-bold">-₱{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2">
                  <span className="text-slate-800">Total:</span>
                  <span className="text-[#073dbe]">₱{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200">
                <label className="block font-bold text-slate-800 mb-2 text-sm">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-3 rounded-lg border border-blue-300 focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 focus:outline-none text-lg font-bold text-slate-800"
                />
                {amountPaid && !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) >= calculateTotal() && (
                  <div className="mt-2 p-2 bg-green-600 rounded-lg">
                    <p className="text-white font-bold flex items-center justify-between text-sm">
                      <span>Change:</span>
                      <span className="text-lg">₱{(parseFloat(amountPaid) - calculateTotal()).toFixed(2)}</span>
                    </p>
                  </div>
                )}
                {amountPaid && !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) < calculateTotal() && (
                  <div className="mt-2 p-2 bg-red-600 rounded-lg">
                    <p className="text-white font-bold flex items-center justify-between text-sm">
                      <span>Need more:</span>
                      <span>₱{(calculateTotal() - parseFloat(amountPaid)).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Checkout */}
              <button
                onClick={handleCheckout}
                className="w-full bg-[#073dbe] hover:bg-[#052d99] text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={18} />
                <span>{editingOrderId ? "Update Order" : "Complete Order"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}