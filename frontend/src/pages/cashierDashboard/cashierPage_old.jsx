/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [orderType, setOrderType] = useState("dine-in");
  const [cashPaid, setCashPaid] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductsWithVariants();
    fetchCategories();
  }, []);

  const fetchProductsWithVariants = async () => {
    try {
      const res = await axios.get("http://localhost:8080/product");
      const productsWithVariants = await Promise.all(
        res.data.map(async (prod) => {
          const { data: variants } = await axios.get(
            `http://localhost:8080/variants/product/${prod.id}`
          );
          return { ...prod, variants };
        })
      );
      setProducts(productsWithVariants);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8080/category");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const addToCart = (product, variant) => {
    if (variant.quantity <= 0) return;

    const key = `${product.id}-${variant.id}`;
    const existing = cart.find((i) => i.key === key);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variant.id ? { ...v, quantity: v.quantity - 1 } : v
              ),
            }
          : p
      )
    );

    if (existing) {
      setCart(
        cart.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          key,
          id: product.id,
          variant_id: variant.id,
          product_name: product.product_name,
          variant: variant.name,
          price: variant.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (key) => {
    setCart(cart.filter((item) => item.key !== key));
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const discountedTotal = isDiscounted ? Math.max(totalPrice - 5, 0) : totalPrice;

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category_id === Number(selectedCategory));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (cashPaid < discountedTotal) {
      alert("Cash paid is less than total!");
      return;
    }

    const orderPayload = {
      cashier_id: 3,
      order_type: orderType,
      status: "pending",
      total: discountedTotal,
      paid: cashPaid,
      items: cart.map((item) => ({
        product_id: item.id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        variant: item.variant,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
    };

    try {
      const res = await axios.post(
        "http://localhost:8080/order/add",
        orderPayload
      );
      alert(`Order #${res.data.order_id} created successfully!`);
      printReceipt(orderPayload, res.data.order_id, isDiscounted);
      setCart([]);
      setIsDiscounted(false);
      setCashPaid(0);
    } catch (err) {
      console.error(err);
      if (err.response) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert("Failed to create order.");
      }
    }
  };

  const printReceipt = (order, orderId, isDiscounted) => {
    const receiptWindow = window.open("", "PRINT", "height=600,width=400");
    receiptWindow.document.write(`
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 20px; }
          h2, h3 { text-align: center; margin: 0; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .flex { display: flex; justify-content: space-between; }
          p, div { margin: 2px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <h2>Barcelo Cafe</h2>
        <p style="text-align:center;">La Consolacion College - Address Something</p>
        <p style="text-align:center;">Phone Number</p>
        <h3 style="text-align:center;">Receipt</h3>
        <div class="divider"></div>

        ${
          isDiscounted
            ? '<p style="color:green;font-weight:bold;">Senior/PWD Discount Applied (-₱5)</p>'
            : ""
        }

        <div>
          <div class="flex">
            <strong>Description</strong>
            <strong>Price</strong>
          </div>
          <div class="divider"></div>
          ${order.items
            .map(
              (item) =>
                `<div class="flex">
                  <span>${item.product_name} x ${item.quantity} ${
                  item.variant ? `(${item.variant})` : ""
                }</span>
                  <span>₱${item.subtotal.toFixed(2)}</span>
                </div>`
            )
            .join("")}
        </div>

        <div class="divider"></div>
        <div class="flex"><span>Total</span><span>₱${order.total.toFixed(
          2
        )}</span></div>
        <div class="flex"><span>Cash</span><span>₱${order.paid.toFixed(
          2
        )}</span></div>
        <div class="flex"><span>Change</span><span>₱${(
          order.paid - order.total
        ).toFixed(2)}</span></div>
        <div class="divider"></div>
        <p>Reference No. BARCELO${orderId}</p>
      </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6">

      {/* SIDEBAR */}
      <aside className="w-full md:w-1/6 bg-white p-4 rounded-xl shadow-lg h-auto md:h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <ul className="space-y-2">
          <li>
            <button
              className={`w-full text-left px-3 py-1 rounded ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
          </li>

          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                className={`w-full text-left px-3 py-1 rounded ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-100"
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* PRODUCTS */}
<div className="flex-1 bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
  <h2 className="text-2xl font-bold mb-4">Products</h2>

  {categories.map((cat) => {
    const categoryProducts = filteredProducts.filter(
      (p) => p.category_id === cat.id
    );

    if (categoryProducts.length === 0) return null;

    return (
      <div key={cat.id} className="mb-8">
        <h3 className="text-xl font-semibold mb-3 border-b pb-1">
          {cat.name}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryProducts.map((prod) => (
            <div
              key={prod.id}
              className="border p-3 rounded-xl hover:shadow-md transition flex flex-col"
            >
              {prod.image && (
                <div className="h-32 w-full mb-3 overflow-hidden rounded-lg bg-gray-100 border">
                  <img
                    src={
                      prod.image.startsWith("http")
                        ? prod.image
                        : `http://localhost:8080/uploads/${prod.image}`
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <h3 className="font-semibold">{prod.product_name}</h3>

              {prod.product_description && (
                <p className="text-sm text-gray-500 mt-1">
                  {prod.product_description}
                </p>
              )}

              <div className="flex flex-col gap-2 mt-2">
                {prod.variants.length > 0 ? (
                  prod.variants.map((v) => (
                    <button
                      key={v.id}
                      className={`px-3 py-1 rounded hover:bg-blue-700 flex justify-between items-center ${
                        v.quantity === 0
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-blue-600 text-white"
                      }`}
                      onClick={() => addToCart(prod, v)}
                      disabled={v.quantity === 0}
                    >
                      <span>
                        {v.name} - ₱{v.price}
                      </span>
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">
                    No variants available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>


      {/* CART */}
      <div className="w-full md:w-100 bg-white p-6 rounded-xl shadow-lg flex-shrink-0">
        <h2 className="text-2xl font-bold mb-4">Cart</h2>

        {cart.length === 0 ? (
          <p className="text-gray-600">Cart is empty.</p>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {cart.map((item) => (
              <li key={item.key} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.product_name}</span>
                  <span className="text-gray-500">({item.variant})</span>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      className="px-2 py-0.5 border border-gray-400 rounded-full hover:bg-gray-100"
                      onClick={() => {
                        if (item.quantity > 1) {
                          setCart((prev) =>
                            prev.map((i) =>
                              i.key === item.key
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                            )
                          );
                        } else {
                          removeFromCart(item.key);
                        }
                      }}
                    >
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      className="px-2 py-0.5 border border-gray-400 rounded-full hover:bg-gray-100"
                      onClick={() => {
                        const product = products.find(
                          (p) => p.id === item.id
                        );
                        const variant = product.variants.find(
                          (v) => v.id === item.variant_id
                        );

                        if (variant.quantity > 0) {
                          setCart((prev) =>
                            prev.map((i) =>
                              i.key === item.key
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                            )
                          );

                          setProducts((prev) =>
                            prev.map((p) =>
                              p.id === product.id
                                ? {
                                    ...p,
                                    variants: p.variants.map((v) =>
                                      v.id === variant.id
                                        ? { ...v, quantity: v.quantity - 1 }
                                        : v
                                    ),
                                  }
                                : p
                            )
                          );
                        } else {
                          alert("No more stock available!");
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <span>
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => removeFromCart(item.key)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* DISCOUNT */}
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDiscounted}
              onChange={() => setIsDiscounted(!isDiscounted)}
            />
            <span className="font-semibold text-sm">
              Senior / PWD Discount (-₱5)
            </span>
          </label>
        </div>

        {/* TOTAL */}
        <div className="mt-4 border-t pt-4 font-bold text-lg flex justify-between">
          <span>Total:</span>
          <span>₱{discountedTotal.toFixed(2)}</span>
        </div>

        {/* CASH PAID */}
        <div className="mt-2">
          <label className="font-semibold text-sm w-full flex flex-col">
            Cash Paid:
            <input
              type="number"
              min={0}
              value={cashPaid}
              onChange={(e) => setCashPaid(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount received"
              className="mt-1 border rounded px-2 py-1 w-full"
            />
          </label>
        </div>

        {/* CHANGE */}
        <div className="mt-2 flex justify-between font-semibold text-lg">
          <span>Change:</span>
          <span>
            ₱
            {(
              cashPaid - discountedTotal > 0
                ? cashPaid - discountedTotal
                : 0
            ).toFixed(2)}
          </span>
        </div>

        <button
          className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={cart.length === 0 || cashPaid < discountedTotal}
          onClick={handleCheckout}
        >
          Checkout
        </button>

        {/* ORDER TYPE */}
        <div className="mt-4">
          <label className="font-semibold text-sm">
            Order Type:
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="mt-1 border rounded px-2 py-1 w-full"
            >
              <option value="dine-in">Dine In</option>
              <option value="takeout">Take Out</option>
            </select>
          </label>
        </div>

        {/* ORDER HISTORY */}
        <button
          className="mt-2 w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => navigate("/cashier/order")}
        >
          View Order History
        </button>
      </div>
    </div>
  );
}
