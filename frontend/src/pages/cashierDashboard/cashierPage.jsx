// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function CashierPage() {
//   const [products, setProducts] = useState([]);
//   const [cart, setCart] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("all");


//   // Single discount checkbox (Senior/PWD)
//   const [isDiscounted, setIsDiscounted] = useState(false);

//   const [orderType, setOrderType] = useState("dine-in");
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchProductsWithVariants();
//     fetchCategories();
//   }, []);

//   // Fetch products
//   const fetchProductsWithVariants = async () => {
//     try {
//       const res = await axios.get("http://localhost:8080/product");
//       const productsWithVariants = await Promise.all(
//         res.data.map(async (prod) => {
//           const { data: variants } = await axios.get(
//             `http://localhost:8080/variants/product/${prod.id}`
//           );
//           return { ...prod, variants };
//         })
//       );
//       setProducts(productsWithVariants);
//     } catch (error) {
//       console.error("Error fetching products:", error);
//     }
//   };

//   // Fetch categories
//   const fetchCategories = async () => {
//     try {
//       const res = await axios.get("http://localhost:8080/category");
//       setCategories(res.data || []);
//     } catch (err) {
//       console.error("Error fetching categories:", err);
//     }
//   };

//   // Add item to cart
//   const addToCart = (product, variant) => {
//     const key = `${product.id}-${variant.id}`;
//     const existing = cart.find((item) => item.key === key);

//     if (existing) {
//       setCart(
//         cart.map((item) =>
//           item.key === key ? { ...item, quantity: item.quantity + 1 } : item
//         )
//       );
//     } else {
//       setCart([
//         ...cart,
//         {
//           key,
//           id: product.id,
//           product_name: product.product_name,
//           variant: variant.name,
//           price: variant.price,
//           quantity: 1,
//           image: product.image || null,
//           description: product.product_description || "",
//         },
//       ]);
//     }
//   };

//   // Remove from cart
//   const removeFromCart = (key) => {
//     setCart(cart.filter((item) => item.key !== key));
//   };

//   // Compute totals
//   const totalPrice = cart.reduce(
//     (total, item) => total + item.price * item.quantity,
//     0
//   );

//   const discountedTotal = isDiscounted ? Math.max(totalPrice - 5, 0) : totalPrice;

//   // Filter products by category
//   const filteredProducts =
//     selectedCategory === "all"
//       ? products
//       : products.filter((p) => p.category_id === Number(selectedCategory));

//   // Checkout
//   const handleCheckout = async () => {
//     if (cart.length === 0) return;

//     const orderPayload = {
//       cashier_id: 3,
//       order_type: orderType,
//       status: "pending",
//       total: discountedTotal,
//       items: cart.map((item) => ({
//         product_id: item.id,
//         product_name: item.product_name,
//         variant: item.variant,
//         quantity: item.quantity,
//         subtotal: item.price * item.quantity,
//       })),
//     };

//     try {
//       const res = await axios.post(
//         "http://localhost:8080/order/add",
//         orderPayload
//       );

//       alert(`Order #${res.data.order_id} created successfully!`);

//       // IMPORTANT: pass isDiscounted to the receipt
//       printReceipt(orderPayload, res.data.order_id, isDiscounted);

//       setCart([]);
//       setIsDiscounted(false);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to create order.");
//     }
//   };

//   // Receipt printing
//   const printReceipt = (order, orderId, isDiscounted) => {
//     const receiptWindow = window.open("", "PRINT", "height=600,width=400");
//     receiptWindow.document.write(`
//       <html>
//       <head><title>Receipt</title></head>
//       <body style="font-family: Arial; padding: 20px;">
//         <h2 style="text-align:center;">Barcelo Cafe</h2>
//         <p><strong>Order ID:</strong> ${orderId}</p>
//         <hr>
//     `);

//     // Print items
//     order.items.forEach((item) => {
//       receiptWindow.document.write(`
//         <p>${item.product_name} (${item.variant}) x ${item.quantity} = ₱${item.subtotal.toFixed(2)}</p>
//       `);
//     });

//     receiptWindow.document.write(`<hr>`);

//     // Show discount only if applied
//     if (isDiscounted) {
//       receiptWindow.document.write(
//         `<p style="color:green;"><strong>Discount Applied</strong></p>`
//       );
//     }

//     receiptWindow.document.write(`
//         <p><strong>Total:</strong> ₱${order.total.toFixed(2)}</p>
//         <hr>
//         <p style="text-align:center;">Thank you for dining at Barcelo Cafe!</p>
//       </body>
//       </html>
//     `);

//     receiptWindow.document.close();
//     receiptWindow.focus();
//     receiptWindow.print();
//   };

//   return (
//     <div className="flex flex-col md:flex-row gap-6 p-6">
//       {/* SIDEBAR */}
//       <aside className="w-full md:w-1/5 bg-white p-4 rounded-xl shadow-lg h-screen overflow-y-auto">
//         <h2 className="text-xl font-bold mb-4">Categories</h2>
//         <ul className="space-y-2">
//           <li>
//             <button
//               className={`w-full text-left px-3 py-1 rounded ${
//                 selectedCategory === "all"
//                   ? "bg-blue-600 text-white"
//                   : "hover:bg-blue-100"
//               }`}
//               onClick={() => setSelectedCategory("all")}
//             >
//               All
//             </button>
//           </li>

//           {categories.map((cat) => (
//             <li key={cat.id}>
//               <button
//                 className={`w-full text-left px-3 py-1 rounded ${
//                   selectedCategory === cat.id
//                     ? "bg-blue-600 text-white"
//                     : "hover:bg-blue-100"
//                 }`}
//                 onClick={() => setSelectedCategory(cat.id)}
//               >
//                 {cat.name}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </aside>

//       {/* PRODUCTS */}
//       <div className="flex-1 bg-white p-6 rounded-xl shadow-lg">
//         <h2 className="text-2xl font-bold mb-4">Products</h2>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {filteredProducts.map((prod) => (
//             <div
//               key={prod.id}
//               className="border p-3 rounded-xl hover:shadow-md transition"
//             >
//               {prod.image && (
//                 <div className="h-32 w-full mb-3 overflow-hidden rounded-lg bg-gray-100 border">
//                   <img
//                     src={
//                       prod.image.startsWith("http")
//                         ? prod.image
//                         : `http://localhost:8080/uploads/${prod.image}`
//                     }
//                     className="h-full w-full object-cover"
//                   />
//                 </div>
//               )}

//               <h3 className="font-semibold">{prod.product_name}</h3>

//               {prod.product_description && (
//                 <p className="text-sm text-gray-500 mt-1">
//                   {prod.product_description}
//                 </p>
//               )}

//               <div className="flex flex-col gap-2 mt-2">
//                 {prod.variants.length > 0 ? (
//                   prod.variants.map((v) => (
//                     <button
//                       key={v.id}
//                       className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
//                       onClick={() => addToCart(prod, v)}
//                     >
//                       {v.name} - ₱{v.price}
//                     </button>
//                   ))
//                 ) : (
//                   <span className="text-gray-400 text-sm">
//                     No variants available
//                   </span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* CART */}
//       <div className="w-full md:w-1/4 bg-white p-6 rounded-xl shadow-lg">
//         <h2 className="text-2xl font-bold mb-4">Cart</h2>

//         {cart.length === 0 ? (
//           <p className="text-gray-600">Cart is empty.</p>
//         ) : (
//           <ul className="space-y-3">
//             {cart.map((item) => (
//               <li key={item.key} className="flex justify-between">
//                 <div>
//                   {item.product_name} ({item.variant}) x {item.quantity}
//                 </div>
//                 <div className="flex gap-2">
//                   <span>₱{item.price * item.quantity}</span>
//                   <button
//                     className="text-red-600 hover:text-red-800"
//                     onClick={() => removeFromCart(item.key)}
//                   >
//                     Remove
//                   </button>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* DISCOUNT CHECKBOX */}
//         <div className="mt-4">
//           <label className="flex items-center gap-2 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={isDiscounted}
//               onChange={() => setIsDiscounted(!isDiscounted)}
//             />
//             <span className="font-semibold text-sm">
//               Senior / PWD Discount (-₱5)
//             </span>
//           </label>
//         </div>

//         {/* TOTAL */}
//         <div className="mt-4 border-t pt-4 font-bold text-lg flex justify-between">
//           <span>Total:</span>
//           <span>₱{discountedTotal.toFixed(2)}</span>
//         </div>

//         <button
//           className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
//           disabled={cart.length === 0}
//           onClick={handleCheckout}
//         >
//           Checkout
//         </button>

//         {/* ORDER TYPE */}
//         <div className="mt-4">
//           <label className="font-semibold text-sm">
//             Order Type:
//             <select
//               value={orderType}
//               onChange={(e) => setOrderType(e.target.value)}
//               className="mt-1 border rounded px-2 py-1 w-full"
//             >
//               <option value="dine-in">Dine In</option>
//               <option value="takeout">Take Out</option>
//             </select>
//           </label>
//         </div>

//         {/* ORDER HISTORY */}
//         <button
//           className="mt-2 w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
//           onClick={() => navigate("/cashier/order")}
//         >
//           View Order History
//         </button>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Single discount checkbox (Senior/PWD)
  const [isDiscounted, setIsDiscounted] = useState(false);

  const [orderType, setOrderType] = useState("dine-in");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductsWithVariants();
    fetchCategories();
  }, []);

  // Fetch products
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8080/category");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Add item to cart
const addToCart = (product, variant) => {
  const key = `${product.id}-${variant.id}`;
  const existing = cart.find((item) => item.key === key);

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
        variant_id: variant.id, // Add this
        product_name: product.product_name,
        variant: variant.name,
        price: variant.price,
        quantity: 1,
        image: product.image || null,
        description: product.product_description || "",
      },
    ]);
  }
};

  // Remove from cart
  const removeFromCart = (key) => {
    setCart(cart.filter((item) => item.key !== key));
  };

  // Compute totals
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const discountedTotal = isDiscounted ? Math.max(totalPrice - 5, 0) : totalPrice;

  // Filter products by category
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category_id === Number(selectedCategory));

  // Checkout
 const handleCheckout = async () => {
  if (cart.length === 0) return;

  // Prepare payload with variant_id
  const orderPayload = {
    cashier_id: 3, // Replace with actual logged-in cashier ID
    order_type: orderType,
    status: "pending",
    total: discountedTotal,
    items: cart.map((item) => ({
      product_id: item.id,
      variant_id: item.variant_id || item.key.split("-")[1], // Ensure variant_id is passed
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

    // Pass discount info to receipt
    printReceipt(orderPayload, res.data.order_id, isDiscounted);

    setCart([]);
    setIsDiscounted(false);
  } catch (err) {
    console.error(err);
    if (err.response) {
      alert(`Error: ${err.response.data.message}`);
    } else {
      alert("Failed to create order.");
    }
  }
};

  // Receipt printing
  const printReceipt = (order, orderId, isDiscounted) => {
    const receiptWindow = window.open("", "PRINT", "height=600,width=400");
    receiptWindow.document.write(`
      <html>
      <head><title>Receipt</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h2 style="text-align:center;">Barcelo Cafe</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <hr>
    `);

    order.items.forEach((item) => {
      receiptWindow.document.write(`
        <p>${item.product_name} (${item.variant || "Default"}) x ${item.quantity} = ₱${item.subtotal.toFixed(2)}</p>
      `);
    });

    receiptWindow.document.write(`<hr>`);

    if (isDiscounted) {
      receiptWindow.document.write(
        `<p style="color:green;"><strong>Discount Applied</strong></p>`
      );
    }

    receiptWindow.document.write(`
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

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      {/* SIDEBAR */}
      <aside className="w-full md:w-1/5 bg-white p-4 rounded-xl shadow-lg h-screen overflow-y-auto">
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
      <div className="flex-1 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Products</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="border p-3 rounded-xl hover:shadow-md transition"
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
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={() => addToCart(prod, v)}
                    >
                      {v.name} - ₱{v.price}
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

      {/* CART */}
      <div className="w-full md:w-1/4 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Cart</h2>

        {cart.length === 0 ? (
          <p className="text-gray-600">Cart is empty.</p>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => (
              <li key={item.key} className="flex justify-between">
                <div>
                  {item.product_name} ({item.variant}) x {item.quantity}
                </div>
                <div className="flex gap-2">
                  <span>₱{item.price * item.quantity}</span>
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

        {/* DISCOUNT CHECKBOX */}
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

        <button
          className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={cart.length === 0}
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
