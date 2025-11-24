import { useState, useEffect } from "react";
import axios from "axios";

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/product"); // replace with your API
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Product List */}
      <div className="flex-1 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="border p-4 rounded-lg flex flex-col justify-between hover:shadow-md transition"
            >
              <h3 className="font-semibold">{prod.product_name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {prod.product_description}
              </p>
              <span className="font-bold mb-2">${prod.price}</span>
              <button
                className="mt-auto bg-[#0d45ce] text-white px-3 py-1 rounded hover:bg-blue-800 transition"
                onClick={() => addToCart(prod)}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-600">Cart is empty.</p>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <div>
                  {item.product_name} x {item.quantity}
                </div>
                <div className="flex gap-2 items-center">
                  <span>${item.price * item.quantity}</span>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t pt-4 font-bold text-lg flex justify-between">
          <span>Total:</span>
          <span>₱{totalPrice.toFixed(2)}</span>
        </div>
        <button
          className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
          disabled={cart.length === 0}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
