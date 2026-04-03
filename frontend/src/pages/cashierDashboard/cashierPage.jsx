/* eslint-disable no-undef */
/* eslint-disable no-unused-labels */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/purity */
import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import Modal from "../../components/modals";
import { ShopContext } from "../../context/createShopContext";
import { FiShoppingCart, FiSearch, FiX, FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiPackage, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function CashierPage() {
  const { shop } = useContext(ShopContext);
  
  // ✅ Revert to manual state
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    showCancel: false,
  });

  const showModal = (type, title, message, onConfirm = null, confirmText = "OK", showCancel = false) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      showCancel,
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

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
  const [expandedItem, setExpandedItem] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [addOns, setAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "cashier")) {
      navigate("/login");
    }
  }, [user, navigate]);

  const loadOrderForEdit = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      showModal("error", "Invalid Order", "Cannot load order - invalid data");
      return;
    }
    
    const cartItems = order.items.map((item, index) => {
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
      
      const currentPrice = variant ? Number(variant.price) : 0;
      const calculatedCost = item.calculated_cost || variant?.calculated_cost || 0;
    
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
        isEditMode: true,
        calculated_cost: calculatedCost
      };
    });
    
    setCart(cartItems);
    setDiscountType(order.discount_type || "none");
    setOrderType(order.order_type || "dine-in");
    setEditingOrderId(order.id);
    window.history.replaceState({}, document.title);
    showModal("success", "Order Loaded", "Order loaded for editing");
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
      showModal("error", "Load Failed", "Cannot load products");
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/category");
      setCategories(data || []);
    } catch (err) {
      console.error("Cannot load categories:", err);
      showModal("error", "Load Failed", "Cannot load categories");
    }
  };

  const loadToppings = async () => {
    try {
      const { data } = await api.get("/addons");
      setToppings(data || []);
    } catch (err) {
      console.error("Cannot load toppings:", err);
      showModal("error", "Load Failed", "Cannot load toppings");
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
        showModal("error", "Out of Stock", `${product.product_name} is out of stock!`);
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

  const addToCart = (product, variant, addOnItems = []) => {
    const addOnsTotal = addOnItems.reduce((sum, addon) => sum + Number(addon.price), 0);
    
    // ✅ ADD discount per item
    const newItem = {
      id: Date.now(),
      product_id: product.id,
      product_name: product.product_name,
      variant_id: variant.id,
      variant_name: variant.name,
      price: Number(variant.price),
      quantity: 1,
      addOns: addOnItems,
      addOnsTotal: addOnsTotal,
      orderType: orderType,
      discount_type: "none",      // ✅ Per-item discount TYPE
      discount: 0,                // ✅ Per-item discount AMOUNT
      itemDiscountType: "none"    // Keep for UI state
    };

    setCart([...cart, newItem]);
    setShowVariantModal(false);
    setSelectedAddOns({});
  };

  // ✅ UPDATED: Update per-item discount - actually calculate it
  const updateItemDiscount = (itemId, discountType) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        let discountAmount = 0;
        const itemSubtotal = item.price * item.quantity;
        
        // Only apply 5 peso discount (not 5%)
        if (discountType === "senior" || discountType === "pwd") {
          discountAmount = 5;
        }
        
        return {
          ...item,
          discount_type: discountType,     // ✅ Send this to backend
          discount: discountAmount,        // ✅ Send this to backend
          itemDiscountType: discountType   // Keep for UI
        };
      }
      return item;
    }));
  };

  // ✅ UPDATED: This should call updateItemDiscount
  const updateItemDiscountType = (itemId, discountTypeValue) => {
    updateItemDiscount(itemId, discountTypeValue);  // ✅ Call the function that calculates discount
  };

  const updateItemOrderType = (itemId, newOrderType) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, itemOrderType: newOrderType } : item
    ));
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
            showModal("error", `Cannot add more! Only ${item.maxStock} in stock.`);
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
      let itemDiscount = 0;
      if (item.itemDiscountType === "senior" || item.itemDiscountType === "pwd") {
        itemDiscount = 5;
      }
      const itemPrice = (parseFloat(item.price) || 0) - itemDiscount;
      const toppingPrice = item.topping_id 
        ? parseFloat(getToppingById(item.topping_id)?.price) || 0
        : 0;
      const addOnsPrice = item.addOns ? item.addOns.reduce((sum, addon) => sum + Number(addon.price), 0) : 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (itemPrice + toppingPrice + addOnsPrice) * quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    return cart.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      const addOnsPrice = item.addOns ? item.addOns.reduce((sum, addon) => sum + Number(addon.price), 0) : 0;
      const itemDiscount = item.discount || 0;
      return sum + (itemSubtotal + addOnsPrice - itemDiscount);
    }, 0);
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
      showModal("error", "Empty Cart", "Please add items to cart");
      return;
    }

    if (!customerName.trim()) {
      showModal("error", "Customer Name Required", "Please enter customer name");
      return;
    }

    try {
      // ✅ Calculate total discount from per-item discounts
      const totalDiscount = cart.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
      
      // ✅ Calculate final total AFTER per-item discounts
      const finalTotal = cart.reduce((sum, item) => {
        const itemSubtotal = item.price * item.quantity;
        const addOnsPrice = item.addOns ? item.addOns.reduce((sum, addon) => sum + Number(addon.price), 0) : 0;
        const itemDiscount = item.discount || 0;
        return sum + (itemSubtotal + addOnsPrice - itemDiscount);
      }, 0);

      const orderPayload = {
        cashier_id: user?.id,
        order_type: orderType,
        status: "pending",  // ✅ Send to kitchen first as pending
        total: finalTotal,                    // ✅ Use calculated total
        discount_type: "per-item",            // ✅ Indicate per-item discounting
        discount: totalDiscount,              // ✅ Total discount amount
        customer_name: customerName,          // ✅ Already validated, send as-is
        notes: notes || null,                 // ✅ Add special requests/notes
        items: cart.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          discount_type: item.discount_type || null,  // ✅ Per-item discount type
          discount: item.discount || 0,               // ✅ Per-item discount amount
          addOns: item.addOns || []
        })),
        paid: amountPaid ? Number(amountPaid) : finalTotal,
        change: amountPaid ? Number(amountPaid) - finalTotal : 0
      };

      console.log("📤 SENDING ORDER:", orderPayload);
      
      const response = await api.post("/order", orderPayload);
      
      // ✅ DEDUCT ADD-ONS FROM INVENTORY
      const deductAddOnsPromises = cart.flatMap(item => {
        if (item.addOns && item.addOns.length > 0) {
          return item.addOns.map(addon => {
            // Calculate total quantity needed (addon quantity per item × number of items ordered)
            const totalAddonNeeded = (addon.quantity || 1) * item.quantity;
            
            return api.put(`/addons/${addon.id}`, {
              quantity: totalAddonNeeded,
              operation: "deduct" // Tell backend to deduct instead of set
            }).catch(error => {
              console.warn(`Failed to deduct ${addon.name}:`, error);
              // Don't fail the order if addon deduction fails
              return null;
            });
          });
        }
        return [];
      });

      // Wait for all add-ons to be deducted
      if (deductAddOnsPromises.length > 0) {
        await Promise.all(deductAddOnsPromises);
        console.log("✅ Add-ons inventory deducted");
      }

      showModal(
        "success",
        "Order Sent to Kitchen",
        `Order #${response.data.order_id} sent to kitchen! Waiting for preparation...`,
        () => {
          // ✅ Print receipt with customer name
          printReceipt(response.data.order_id, {
            order_type: orderType,
            total: finalTotal,
            discount: totalDiscount,
            paid: amountPaid ? Number(amountPaid) : finalTotal,
            change: amountPaid ? Number(amountPaid) - finalTotal : 0
          });

          setCart([]);
          setAmountPaid("");
          setCustomerName("");
          setNotes("");
          navigate("/cashier/order", { state: { updatedOrder: response.data } });
        }
      );
    } catch (error) {
      console.error("Checkout error:", error);
      showModal(
        "error",
        "Checkout Failed",
        error.response?.data?.message || "Failed to create order"
      );
    }
  };

  const printReceipt = (orderId, orderData) => {
    const isDiscounted = orderData.discount > 0;
    const safeTotal = Number(orderData.total || 0);
    const safeDiscount = Number(orderData.discount || 0);
    const safePaid = Number(orderData.paid || safeTotal);
    const safeChange = Number(orderData.change || 0);

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
          .discount-note { text-align: center; font-weight: bold; margin: 10px 0; color: #d00; }
          .order-type { text-align: center; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
          .item-type { font-size: 9px; color: #666; margin-left: 10px; }
          .item-discount { font-size: 9px; color: #d00; margin-left: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="divider"></div>
        <div style="text-align: center; font-weight: bold; margin: 10px 0;">${shop?.receipt_header || 'OFFICIAL RECEIPT'}</div>
        <div class="order-type">${orderData.order_type === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</div>
        
        <div class="divider"></div>
        <div style="font-size: 11px; margin-bottom: 10px;">
          <div class="info-row"><span>Date:</span><span>${new Date().toLocaleString()}</span></div>
          <div class="info-row"><span>Order #:</span><span>${orderId}</span></div>
          <div class="info-row"><span>Customer:</span><span>${customerName || 'Walk-in'}</span></div>
          <div class="info-row"><span>Served by:</span><span>${user?.name || 'Cashier'}</span></div>
        </div>
        <div class="divider"></div>
        <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">
          <div style="display: flex;">
            <div class="item-name">ITEM</div>
            <div class="item-qty">QTY</div>
            <div class="item-price">PRICE</div>
          </div>
        </div>
        ${cart.map(item => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          const addOnsPrice = item.addOns ? item.addOns.reduce((sum, addon) => sum + Number(addon.price), 0) : 0;
          const itemDiscount = item.discount || 0;
          const totalPrice = (price + addOnsPrice - itemDiscount) * qty;
          
          let itemHTML = `<div class="item-row"><div class="item-name">${item.product_name || ""}</div><div class="item-qty">x${qty}</div><div class="item-price">₱${totalPrice.toFixed(2)}</div></div>`;
          if (item.variant_name) itemHTML += `<div style="font-size:10px; color:#666; margin-left:10px;">${item.variant_name}</div>`;
          if (itemDiscount > 0) itemHTML += `<div class="item-discount">${item.discount_type?.toUpperCase() || 'DISCOUNT'} (-₱${itemDiscount.toFixed(2)})</div>`;
          if (item.addOns && item.addOns.length > 0) {
            item.addOns.forEach(addon => {
              itemHTML += `<div style="font-size:10px; color:#d97706; margin-left:10px;">+ ${addon.name}</div>`;
            });
          }
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
          <div style="margin: 6px 0;">Reference No: ${shop?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || 'SHOP'}${String(orderId).padStart(6, '0')}</div>
          <div style="margin: 10px 0; font-weight: bold;">${shop?.receipt_footer || 'Thank you for your order!'}</div>
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || String(product.category_id) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = categories.map(category => {
    const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
    
    const espressoProducts = categoryProducts.filter(p => 
      p.product_name.toLowerCase().includes("espresso")
    );
    const brewedProducts = categoryProducts.filter(p => 
      p.product_name.toLowerCase().includes("brewed")
    );
    const otherProducts = categoryProducts.filter(p => 
      !p.product_name.toLowerCase().includes("espresso") && 
      !p.product_name.toLowerCase().includes("brewed")
    );

    return {
      category,
      products: categoryProducts,
      espressoProducts,
      brewedProducts,
      otherProducts
    };
  });

  const checkCartStock = () => {
    cart.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      const variant = product?.variants?.find(v => v.id === item.variant_id);
      
      if (variant && Number(variant.quantity) < item.quantity) {
        showModal(
          "warning",
          "Low Stock",
          `${product.product_name} - ${variant.name}: Only ${variant.quantity} available`
        );
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Modal */}
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

      {/* Sidebar - Categories */}
      <div className="w-full lg:w-60 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 text-white" style={{ backgroundColor: shop?.brand_color || '#073dbe' }}>
          <h2 className="text-lg font-bold mb-1">Categories</h2>
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
                <h1 className="text-2xl font-bold text-slate-900">{shop?.name}</h1>
                <p className="text-slate-600 text-sm mt-0.5">Select products to add to cart</p>
              </div>
              <button
                onClick={() => handleNavigateWithConfirm("/cashier/order")}
                className="w-full sm:w-auto text-white px-4 py-2 rounded-lg transition-all font-medium text-sm"
                style={{ backgroundColor: shop?.brand_color || '#073dbe' }}
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
            <div className="space-y-8">
              {groupedProducts.map(({ category, espressoProducts, brewedProducts, otherProducts }) => {
                if (espressoProducts.length === 0 && brewedProducts.length === 0 && otherProducts.length === 0) {
                  return null;
                }

                return (
                  <div key={category.id}>
                    <h2 className="text-xl font-bold text-slate-900 capitalize mb-4">{category.name}</h2>
                    
                    {otherProducts.length > 0 && (
                      <div className="mb-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {otherProducts.map(product => {
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
                    )}

                    {espressoProducts.length > 0 && (
                      <div className="mb-6">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="w-1 h-6 bg-amber-600 rounded-full"></div>
                          <h3 className="text-lg font-bold text-amber-900">Espresso</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {espressoProducts.map(product => {
                            const hasStock = product.variants?.some(v => v.quantity > 0);
                            return (
                              <div 
                                key={product.id} 
                                onClick={() => hasStock && handleProductClick(product)}
                                className={`bg-white rounded-lg border border-amber-200 overflow-hidden transition-all ${
                                  hasStock ? 'hover:border-amber-600 cursor-pointer hover:shadow-lg' : 'opacity-50 cursor-not-allowed'
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
                                          <p className="text-amber-700 font-bold text-lg">
                                            ₱{Number(product.variants[0].price).toFixed(2)}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            Stock: {product.variants[0].quantity}
                                          </p>
                                        </div>
                                      ) : (
                                        <div>
                                          <p className="text-xs text-slate-500 mb-0.5">{product.variants.length} variants</p>
                                          <p className="text-amber-700 font-bold text-lg">
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
                    )}

                    {brewedProducts.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                          <h3 className="text-lg font-bold text-blue-900">Brewed</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {brewedProducts.map(product => {
                            const hasStock = product.variants?.some(v => v.quantity > 0);
                            return (
                              <div 
                                key={product.id} 
                                onClick={() => hasStock && handleProductClick(product)}
                                className={`bg-white rounded-lg border border-blue-200 overflow-hidden transition-all ${
                                  hasStock ? 'hover:border-blue-600 cursor-pointer hover:shadow-lg' : 'opacity-50 cursor-not-allowed'
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
                                          <p className="text-blue-700 font-bold text-lg">
                                            ₱{Number(product.variants[0].price).toFixed(2)}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            Stock: {product.variants[0].quantity}
                                          </p>
                                        </div>
                                      ) : (
                                        <div>
                                          <p className="text-xs text-slate-500 mb-0.5">{product.variants.length} variants</p>
                                          <p className="text-blue-700 font-bold text-lg">
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedProduct.product_name}</h3>
                <p className="text-slate-600 text-sm mt-0.5">Select a variant</p>
              </div>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedAddOns({});
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="space-y-2 mb-6">
              {selectedProduct.variants?.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedProduct({ ...selectedProduct, selectedVariant: variant });
                  }}
                  disabled={variant.quantity === 0}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedProduct.selectedVariant?.id === variant.id
                      ? "border-[#073dbe] bg-blue-50"
                      : variant.quantity === 0
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

            {/* Add-Ons Section */}
            {toppings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Add-Ons (Optional)</h3>
                <div className="grid grid-cols-1 gap-2">
                  {toppings.map((addon) => (
                    <label
                      key={addon.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                        selectedAddOns[addon.id]
                          ? "border-orange-600 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddOns[addon.id] || false}
                        onChange={(e) => {
                          setSelectedAddOns(prev => ({
                            ...prev,
                            [addon.id]: e.target.checked
                          }));
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {addon.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {addon.unit && `${addon.quantity} ${addon.unit}`}
                        </p>
                      </div>
                      <p className="text-sm text-orange-600 font-semibold">
                        +₱{Number(addon.price).toFixed(2)}
                      </p>
                   </label>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedAddOns({});
                }}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedProduct.selectedVariant) {
                    showModal("error", "Select Variant", "Please select a variant first");
                    return;
                  }

                  const addOnItems = Object.entries(selectedAddOns)
                    .filter(([_, selected]) => selected)
                    .map(([addonId, _]) => {
                      const addon = toppings.find(a => a.id === parseInt(addonId));
                      return {
                        id: addon.id,
                        name: addon.name,
                        price: addon.price,
                        quantity: addon.quantity,
                        unit: addon.unit,
                        unit_price: addon.price
                      };
                    });

                  addToCart(selectedProduct, selectedProduct.selectedVariant, addOnItems);
                }}
                className="flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium"
                style={{ backgroundColor: shop?.brand_color || '#073dbe' }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 text-white" style={{ backgroundColor: shop?.brand_color || '#073dbe' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
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

          {/* Customer Name Input */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-blue-100 mb-1.5">Customer Name <span className="text-red-300">*</span></label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name..."
              className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:border-white focus:ring-2 focus:ring-blue-200 text-sm"
              required
            />
          </div>
          
          {/* Special Requests / Notes Input */}
          <div className="mt-3">
            <label className="block text-xs font-bold text-blue-100 mb-1.5">Special Requests (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., No sugar, extra syrup, etc."
              className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white/10 text-white placeholder-blue-200 focus:outline-none focus:border-white focus:ring-2 focus:ring-blue-200 text-sm resize-none"
              rows="2"
            />
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
                {cart.map((item, idx) => {
                  const selectedTopping = item.topping_id ? getToppingById(item.topping_id) : null;
                  const isExpanded = expandedItem === item.id;
                  const itemDiscount = item.itemDiscountType === "senior" || item.itemDiscountType === "pwd" ? 5 : 0;
                  const discountedPrice = Number(item.price) - itemDiscount;
                  const addOnsPrice = item.addOns ? item.addOns.reduce((sum, addon) => sum + Number(addon.price), 0) : 0;
                  const totalItemPrice = discountedPrice + addOnsPrice;
                  
                  const variant = products
                    .flatMap(p => p.variants || [])
                    .find(v => v.id === item.variant_id);
                  const isLowStock = variant && variant.quantity < 20;
                  const isOutOfStock = variant && variant.quantity === 0;

                  return (
                    <div key={item.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-2">
                      {/* Item Card */}
                      <div className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.product_name}</h4>
                              {isOutOfStock ? (
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                                  OUT OF STOCK
                                </span>
                              ) : isLowStock ? (
                                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded">
                                  LOW STOCK
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">
                                  IN STOCK
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-slate-600 mt-0.5">{item.variant_name}</p>
                            
                            <p className="text-xs text-slate-500 mt-1">
                              <span className="font-medium">Price:</span> ₱{Number(item.price).toFixed(2)}
                            </p>

                            {item.addOns && item.addOns.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {item.addOns.map((addon, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-orange-50 px-2 py-1 rounded text-xs border border-orange-200">
                                    <span className="text-orange-800 font-medium">+ {addon.name}</span>
                                    <span className="text-orange-600 font-bold">₱{Number(addon.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {itemDiscount > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="line-through text-slate-400 text-xs">₱{Number(item.price).toFixed(2)}</span>
                                <span className="text-red-600 font-bold text-xs">-₱{itemDiscount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            <p className="text-[#073dbe] font-bold mt-1">
                              Total: ₱{totalItemPrice.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-white hover:bg-red-600 w-7 h-7 rounded-lg font-bold transition-all flex items-center justify-center"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5 mb-2">
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
                            disabled={item.quantity >= item.maxStock}
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>

                        <div className="border-t border-slate-200 pt-2 bg-slate-50 rounded-lg p-2 mb-2">
                          <p className="flex items-center justify-between">
                            <span className="text-xs text-slate-600 font-semibold">Item Subtotal:</span>
                            <span className="text-base font-bold text-[#073dbe]">₱{(totalItemPrice * Number(item.quantity)).toFixed(2)}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                          className="w-full text-center text-xs text-[#073dbe] font-bold hover:underline py-1"
                        >
                          {isExpanded ? "Hide Options" : "More Options"}
                        </button>
                      </div>

                      {/* Expandable Options */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-3">
                          {/* Order Type */}
                          <div>
                            <p className="text-xs font-bold text-slate-800 mb-1.5">Order Type</p>
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                                <input
                                  type="radio"
                                  name={`orderType-${item.id}`}
                                  checked={item.itemOrderType === "dine-in"}
                                  onChange={() => updateItemOrderType(item.id, "dine-in")}
                                  className="w-4 h-4 text-[#073dbe]"
                                />
                                <span className="font-semibold text-slate-700 text-sm">Dine In</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-all">
                                <input
                                  type="radio"
                                  name={`orderType-${item.id}`}
                                  checked={item.itemOrderType === "takeout"}
                                  onChange={() => updateItemOrderType(item.id, "takeout")}
                                  className="w-4 h-4 text-[#073dbe]"
                                />
                                <span className="font-semibold text-slate-700 text-sm">Take Out</span>
                              </label>
                            </div>
                          </div>

                          {/* Item Discount */}
                          <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <p className="font-bold text-slate-800 mb-2 text-sm">Item Discount</p>
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 p-2 rounded-lg transition-all">
                                <input
                                  type="radio"
                                  name={`discount-${item.id}`}
                                  checked={item.itemDiscountType === "none"}
                                  onChange={() => updateItemDiscountType(item.id, "none")}
                                  className="w-4 h-4 text-amber-600"
                                />
                                <span className="font-semibold text-slate-700 text-sm">No Discount</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 p-2 rounded-lg transition-all">
                                <input
                                  type="radio"
                                  name={`discount-${item.id}`}
                                  checked={item.itemDiscountType === "senior"}
                                  onChange={() => updateItemDiscountType(item.id, "senior")}
                                  className="w-4 h-4 text-amber-600"
                                />
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 text-sm">Senior Citizen</span>
                                  <span className="text-amber-700 font-bold text-xs">-₱5.00</span>
                                </div>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 p-2 rounded-lg transition-all">
                                <input
                                  type="radio"
                                  name={`discount-${item.id}`}
                                  checked={item.itemDiscountType === "pwd"}
                                  onChange={() => updateItemDiscountType(item.id, "pwd")}
                                  className="w-4 h-4 text-amber-600"
                                />
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 text-sm">PWD</span>
                                  <span className="text-amber-700 font-bold text-xs">-₱5.00</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Add-ons Info */}
                          {item.addOns && item.addOns.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <p className="text-xs font-bold text-orange-900 mb-2">Selected Add-Ons:</p>
                              <div className="space-y-1">
                                {item.addOns.map((addon, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-orange-800">{addon.name}</span>
                                    <span className="text-orange-600 font-bold">+₱{Number(addon.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Traditional Toppings */}
                          {item.isMilkTea && toppings.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-800 mb-2">Traditional Toppings:</p>
                              <div className="space-y-1.5">
                                {toppings.map(topping => (
                                  <label key={topping.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-all">
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
                                  onClick={() => selectTopping(item.id, null)}
                                  className="mt-1.5 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                  <FiX size={12} />
                                  Remove add-on
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
                disabled={cart.length === 0 || !customerName.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all disabled:cursor-not-allowed"
              >
                Checkout
              </button>
            </>
          )}
        </div>
      </div>

      {/* ✅ CORRECT Modal - Keep this ONE */}
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

     
    </div>
  );
}