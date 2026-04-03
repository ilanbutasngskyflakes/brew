import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiPlus, FiMinus, FiArrowLeft, FiCheck, FiX } from "react-icons/fi";
import axios from "axios";

export default function PublicOrderPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    orderType: "takeout",
    address: "",
    notes: ""
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedTopping, setSelectedTopping] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // Fetch menu on mount
  useEffect(() => {
    fetchMenu();
  }, [shopId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const response = await axios.get(`${apiBaseURL}/public/shop/${shopId}/menu`);
      setMenu(response.data);
    } catch (error) {
      console.error("Error fetching menu:", error);
      alert("Failed to load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get brand color
  const brandColor = menu?.shop?.brand_color || "#073dbe";

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedVariant) {
      alert("Please select a product and variant");
      return;
    }

    const cartItem = {
      id: Math.random(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      variant_id: selectedVariant.id,
      variant_name: selectedVariant.name,
      price: selectedVariant.price,
      topping_id: selectedTopping?.id || null,
      topping_name: selectedTopping?.name || null,
      topping_price: selectedTopping?.price || 0,
      addOns: selectedAddOns,
      quantity: quantity,
      subtotal: (selectedVariant.price + (selectedTopping?.price || 0) + selectedAddOns.reduce((sum, a) => sum + a.price, 0)) * quantity
    };

    setCart([...cart, cartItem]);
    resetProductSelection();
  };

  const resetProductSelection = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSelectedTopping(null);
    setSelectedAddOns([]);
    setQuantity(1);
  };

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
          : item
      ));
    }
  };

  const toggleAddOn = (addon) => {
    if (selectedAddOns.find(a => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmitOrder = async () => {
    if (!customerInfo.phone.trim()) {
      alert("Please enter your phone number");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      setCheckoutLoading(true);
      const totalPrice = getCartTotal();
      const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

      const response = await axios.post(`${apiBaseURL}/public/orders`, {
        shopId: parseInt(shopId),
        items: cart,
        customerName: customerInfo.name || "Guest",
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        orderType: customerInfo.orderType,
        total: totalPrice,
        paid: totalPrice,
        change: 0,
        notes: customerInfo.notes
      });

      // Show success modal
      alert(`Order #${response.data.order_id} submitted successfully!\nYour order is being prepared.`);
      setCart([]);
      setShowCheckout(false);
      setCustomerInfo({ name: "", phone: "", email: "", orderType: "takeout", address: "", notes: "" });
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load menu</p>
          <button
            onClick={() => navigate("/")}
            className="text-white px-6 py-2 rounded-lg"
            style={{ backgroundColor: brandColor }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const brandColorLight = brandColor + "15"; // Add transparency for light backgrounds

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-white sticky top-0 z-40 shadow-md" style={{ backgroundColor: brandColor }}>
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button
              onClick={() => navigate("/")}
              className="p-1 sm:p-2 hover:opacity-80 transition-opacity"
              title="Back"
            >
              <FiArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">{menu.shop.name}</h1>
              <p className="text-xs sm:text-sm opacity-90 truncate">{menu.shop.receipt_header}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="ml-2 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap font-medium text-sm sm:text-base relative hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <FiShoppingCart size={18} className="sm:w-5 sm:h-5" />
            <span>{cart.length}</span>
            {cart.length > 0 && (
              <span className="text-xs sm:text-sm">₱{getCartTotal().toFixed(2)}</span>
            )}
          </button>
        </div>
      </div>

      <div className="w-full px-3 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto">
        {/* Menu Grid - 1 column on mobile, 2 on tablet+, 3 on desktop for better spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Products Section - Full width on mobile, left 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Menu</h2>
            {menu.categories.map(category => (
              <div key={category.id} className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">{category.name}</h3>
                <div className="space-y-2 sm:space-y-3">
                  {category.products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedVariant(product.variants[0] || null);
                      }}
                      className="w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all"
                      style={{
                        borderColor: selectedProduct?.id === product.id ? brandColor : "#e2e8f0",
                        backgroundColor: selectedProduct?.id === product.id ? brandColorLight : "white"
                      }}
                    >
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">{product.name}</p>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-slate-600">{product.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Product Details & Cart - Right 1/3 on desktop, below on mobile */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Details */}
            {selectedProduct && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">{selectedProduct.name}</h3>

                {/* Variants */}
                {selectedProduct.variants.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
                      Size / Variant
                    </label>
                    <div className="space-y-2">
                      {selectedProduct.variants.map((variant, idx) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className="w-full text-left p-2 sm:p-3 rounded-lg border-2 transition-all"
                          style={{
                            borderColor: selectedVariant?.id === variant.id ? brandColor : "#e2e8f0",
                            backgroundColor: selectedVariant?.id === variant.id ? brandColorLight : "white"
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-xs sm:text-sm">{variant.name || `Option ${idx + 1}`}</span>
                            <span className="font-bold text-sm sm:text-base" style={{ color: brandColor }}>₱{variant.price.toFixed(2)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings */}
                {menu.toppings.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
                      Toppings
                    </label>
                    <select
                      value={selectedTopping?.id || ""}
                      onChange={(e) => {
                        const topping = menu.toppings.find(t => t.id == e.target.value);
                        setSelectedTopping(topping || null);
                      }}
                      className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg bg-white text-sm sm:text-base"
                    >
                      <option value="">No topping</option>
                      {menu.toppings.map(topping => (
                        <option key={topping.id} value={topping.id}>
                          {topping.name} (+₱{topping.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Add-ons */}
                {menu.addOns.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
                      Add-ons
                    </label>
                    <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                      {menu.addOns.map(addon => (
                        <label key={addon.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAddOns.some(a => a.id === addon.id)}
                            onChange={() => toggleAddOn(addon)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="flex-1 text-xs sm:text-sm">{addon.name}</span>
                          <span className="text-xs sm:text-sm text-slate-600">+₱{addon.price.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: brandColorLight }}
                    >
                      <FiMinus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <span className="text-lg sm:text-xl font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: brandColorLight }}
                    >
                      <FiPlus size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base text-white"
                  style={{
                    backgroundColor: menu?.shop?.id === 2 ? "#000000" : "#073dbe"
                  }}
                >
                  <FiShoppingCart />
                  Add to Cart
                </button>
              </div>
            )}

            {/* Cart Summary - Sticky on desktop, normal flow on mobile */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Cart ({cart.length})</h3>
                <div className="space-y-2 sm:space-y-3 mb-6 max-h-40 sm:max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-start bg-slate-50 p-2 sm:p-3 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-slate-600 truncate">{item.variant_name}</p>
                        {item.topping_name && (
                          <p className="text-xs text-slate-500 truncate">+ {item.topping_name}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs hover:opacity-70 transition-opacity"
                            style={{ backgroundColor: brandColorLight }}
                          >
                            −
                          </button>
                          <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs hover:opacity-70 transition-opacity"
                            style={{ backgroundColor: brandColorLight }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">₱{item.subtotal.toFixed(2)}</p>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-xs hover:opacity-70 transition-opacity"
                          style={{ color: brandColor }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 mb-4">
                  <div className="flex justify-between text-base sm:text-lg font-bold text-slate-900">
                    <span>Total:</span>
                    <span>₱{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base text-white"
                  style={{
                    backgroundColor: menu?.shop?.id === 2 ? "#000000" : "#073dbe"
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Checkout</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ focusRingColor: brandColor }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="09xxxxxxxxx"
                  className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ focusRingColor: brandColor }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ focusRingColor: brandColor }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                  Order Type
                </label>
                <select
                  value={customerInfo.orderType}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, orderType: e.target.value })}
                  className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="takeout">Takeout</option>
                  <option value="dine-in">Dine In</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="Any special instructions or requests..."
                  className="w-full p-2 sm:p-3 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                  rows="3"
                  style={{ focusRingColor: brandColor }}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-3 sm:p-4 rounded-lg mb-6" style={{ backgroundColor: brandColorLight }}>
              <div className="flex justify-between mb-2 text-xs sm:text-sm">
                <span className="text-slate-600">Items:</span>
                <span className="font-medium">{cart.length}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold text-slate-900">
                <span>Total:</span>
                <span>₱{getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-medium transition-colors text-xs sm:text-sm disabled:opacity-50"
                disabled={checkoutLoading}
              >
                Back to Menu
              </button>
              <button
                onClick={handleSubmitOrder}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:opacity-90 font-medium flex items-center justify-center gap-2 transition-opacity text-xs sm:text-sm disabled:opacity-50 text-white"
                style={{
                  backgroundColor: menu?.shop?.id === 2 ? "#000000" : "#073dbe"
                }}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Submitting..." : <>
                  <FiCheck />
                  Submit Order
                </>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
