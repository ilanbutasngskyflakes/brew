// import { useState, useEffect } from "react";
// import axios from "axios";
// import ProductForm from "./productForm";



// export default function ProductDashboard() {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   // Load products
//   const loadProducts = async () => {
//     try {
//       const res = await axios.get("http://localhost:8080/product");
//       setProducts(res.data);
//     } catch (err) {
//       console.error("Failed to fetch products:", err.response?.data || err.message);
//     }
//   };

//   // Load categories
//   const loadCategories = async () => {
//     try {
//       const res = await axios.get("http://localhost:8080/category");
//       setCategories(res.data);
//     } catch (err) {
//       console.error("Failed to fetch categories:", err.response?.data || err.message);
//     }
//   };

//   useEffect(() => {
//     loadProducts();
//     loadCategories();
//   }, []);

//   // Add / Update product
//   const handleSubmit = async (formData) => {
//     try {
//       if (selectedProduct) {
//         await axios.put(`http://localhost:8080/product/${selectedProduct.id}`, formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         alert("Product updated successfully!");
//       } else {
//         await axios.post("http://localhost:8080/product/add", formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         alert("Product added successfully!");
//       }
//       setShowForm(false);
//       setSelectedProduct(null);
//       loadProducts();
//     } catch (err) {
//       console.error("Failed to save product:", err.response?.data || err.message);
//       alert("Failed to save product");
//     }
//   };

//   // Delete product
//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure you want to delete this product?")) return;
//     try {
//       await axios.delete(`http://localhost:8080/product/${id}`);
//       alert("Product deleted successfully!");
//       loadProducts();
//     } catch (err) {
//       console.error("Failed to delete product:", err.response?.data || err.message);
//       alert("Failed to delete product");
//     }
//   };

//   const getCategoryName = (id) => {
//     const cat = categories.find((c) => c.id === id);
//     return cat ? cat.name : "Unknown";
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main content */}
//       <div className="flex-1 p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Products</h1>
//           <button
//             className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
//             onClick={() => {
//               setSelectedProduct(null);
//               setShowForm(true);
//             }}
//           >
//             Add Product
//           </button>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {products.map((p) => (
//             <div
//               key={p.id}
//               className="bg-white border rounded-2xl shadow-lg p-4 flex flex-col"
//             >
//               {p.image && (
//                 <img
//                   src={`http://localhost:8080/uploads/${p.image}`}
//                   alt={p.product_name}
//                   className="h-40 w-full object-cover rounded-xl mb-4 border"
//                 />
//               )}
//               <h2 className="text-xl font-semibold text-gray-800 mb-1">{p.product_name}</h2>
//               <p className="text-gray-500 text-sm mb-1">{getCategoryName(p.category_id)}</p>
//               <p className="text-gray-800 font-bold mb-2">₱{p.price}</p>
//               <p
//                 className={`mb-3 font-medium ${
//                   p.status === "active" ? "text-green-600" : "text-red-600"
//                 }`}
//               >
//                 {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
//               </p>

//               <div className="mt-auto flex gap-3">
//                 <button
//                   className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition shadow"
//                   onClick={() => {
//                     setSelectedProduct(p);
//                     setShowForm(true);
//                   }}
//                 >
//                   Edit
//                 </button>
//                 <button
//                   className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition shadow"
//                   onClick={() => handleDelete(p.id)}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//         {showForm && (
//           <ProductForm
//             categories={categories}
//             formData={
//               selectedProduct || {
//                 category_id: "",
//                 product_name: "",
//                 product_description: "",
//                 price: "",
//                 status: "active",
//                 image: null,
//               }
//             }
//             isEditing={!!selectedProduct}
//             onSubmit={handleSubmit}
//             onDelete={handleDelete}
//             onClose={() => setShowForm(false)}
//           />
//         )}
//       </div>
//     </div>
//   );
// }
// ProductDashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import ProductForm from "./productForm";
import Sidebar from "../../../components/Navigation/sidebar";

export default function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8080/product");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err.response?.data || err.message);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8080/category");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      if (selectedProduct?.id) {
        await axios.put(`http://localhost:8080/product/${selectedProduct.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product updated successfully!");
      } else {
        await axios.post("http://localhost:8080/product/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product added successfully!");
      }
      setShowForm(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      console.error("Failed to save product:", err.response?.data || err.message);
      alert("Failed to save product");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`http://localhost:8080/product/${id}`);
      alert("Product deleted successfully!");
      loadProducts();
    } catch (err) {
      console.error("Failed to delete product:", err.response?.data || err.message);
      alert("Failed to delete product");
    }
  };

  const getCategoryName = (id) => {
    return categories.find((c) => c?.id === id)?.name || "Unknown";
  };

  return (
    <div className="p-6 w-full">

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            onClick={() => {
              setSelectedProduct(null);
              setShowForm(true);
            }}
          >
            Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p?.id} className="bg-white border rounded-2xl shadow-lg p-4 flex flex-col">
              {p?.image && (
                <img
                  src={`http://localhost:8080/uploads/${p.image}`}
                  alt={p.product_name}
                  className="h-40 w-full object-cover rounded-xl mb-4 border"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-800 mb-1">{p?.product_name}</h2>
              <p className="text-gray-500 text-sm mb-1">{getCategoryName(p?.category_id)}</p>
              <p className="text-gray-800 font-bold mb-2">₱{p?.price}</p>
              <p className={`mb-3 font-medium ${p?.status === "active" ? "text-green-600" : "text-red-600"}`}>
                {p?.status?.charAt(0)?.toUpperCase() + p?.status?.slice(1)}
              </p>

              <div className="mt-auto flex gap-3">
                <button
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition shadow"
                  onClick={() => {
                    setSelectedProduct(p);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition shadow"
                  onClick={() => handleDelete(p?.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <ProductForm
            categories={categories}
            formData={selectedProduct || {
              category_id: "",
              product_name: "",
              product_description: "",
              price: "",
              status: "active",
              image: null,
            }}
            isEditing={!!selectedProduct}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}
