// // //   // import { useEffect, useState } from "react";
// // //   // import ProductForm from "./productForm";
// // //   // import api from "../../../api/api";
// // //   // import { useNavigate } from "react-router-dom";

// // //   // export default function ProductDashboard() {
// // //   //   const [products, setProducts] = useState([]);
// // //   //   const [categories, setCategories] = useState([]);
// // //   //   const [showForm, setShowForm] = useState(false);
// // //   //   const [editProduct, setEditProduct] = useState(null);
// // //   //   const navigate = useNavigate();

// // //   //   const loadProducts = async () => {
// // //   //     try {
// // //   //       const { data } = await api.get("/product");
// // //   //       setProducts(data || []);
// // //   //     } catch (err) {
// // //   //       console.error("Cannot load products:", err);
// // //   //     }
// // //   //   };

// // //   //   const loadCategories = async () => {
// // //   //     try {
// // //   //       const { data } = await api.get("/category");
// // //   //       setCategories(data || []);
// // //   //     } catch (err) {
// // //   //       console.error("Cannot load categories:", err);
// // //   //     }
// // //   //   };

// // //   //   useEffect(() => {
// // //   //     loadProducts();
// // //   //     loadCategories();
// // //   //   }, []);

// // //   //   const handleAdd = () => {
// // //   //     setEditProduct(null);
// // //   //     setShowForm(true);
// // //   //   };

// // //   //   const handleEdit = (product) => {
// // //   //     setEditProduct(product);
// // //   //     setShowForm(true);
// // //   //   };

// // //   //   const handleSubmit = async (formData) => {
// // //   //     try {
// // //   //       if (editProduct?.id) {
// // //   //         await api.put(`/product/${editProduct.id}`, formData, {
// // //   //           headers: { "Content-Type": "multipart/form-data" },
// // //   //         });
// // //   //         alert("Product updated successfully!");
// // //   //       } else {
// // //   //         await api.post("/product/add", formData, {
// // //   //           headers: { "Content-Type": "multipart/form-data" },
// // //   //         });
// // //   //         alert("Product added successfully!");
// // //   //       }
// // //   //       setShowForm(false);
// // //   //       setEditProduct(null);
// // //   //       await loadProducts();
// // //   //     } catch (err) {
// // //   //       console.error("Error saving product:", err.response?.data || err.message);
// // //   //       alert("Error saving product");
// // //   //     }
// // //   //   };

// // //   //   const handleDelete = async (id) => {
// // //   //     if (!confirm("Delete product?")) return;
// // //   //     try {
// // //   //       await api.delete(`/product/${id}`);
// // //   //       await loadProducts();
// // //   //     } catch (err) {
// // //   //       console.error("Cannot delete product:", err);
// // //   //     }
// // //   //   };

// // //   //   return (
// // //   //     <div className="p-6">
// // //   //       {/* Header */}
// // //   //       <div className="flex justify-between items-center mb-6">
// // //   //         <h1 className="text-3xl font-bold">Products</h1>
// // //   //         <button
// // //   //           onClick={handleAdd}
// // //   //           className="bg-blue-600 text-white px-4 py-2 rounded"
// // //   //         >
// // //   //           Add Product
// // //   //         </button>
// // //   //       </div>

// // //   //       {/* Products Grid */}
// // //   //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
// // //   //         {products.map((p) => (
// // //   //           <div key={p.id} className="bg-white border rounded-xl p-4 shadow">
// // //   //             {p.image && (
// // //   //               <img
// // //   //                 src={`http://localhost:8080/uploads/${p.image}`}
// // //   //                 alt={p.product_name}
// // //   //                 className="h-40 w-full object-cover rounded-xl mb-4 border"
// // //   //               />
// // //   //             )}
// // //   //             <h2 className="text-lg font-semibold">{p.product_name}</h2>
// // //   //             <p className="text-sm text-gray-600">{p.product_description}</p>

// // //   //             {/* Edit / Delete Buttons */}
// // //   //             <div className="mt-4 flex gap-2">
// // //   //               <button
// // //   //                 onClick={() => handleEdit(p)}
// // //   //                 className="flex-1 bg-yellow-500 text-white py-2 rounded"
// // //   //               >
// // //   //                 Edit
// // //   //               </button>
// // //   //               <button
// // //   //                 onClick={() => handleDelete(p.id)}
// // //   //                 className="flex-1 bg-red-600 text-white py-2 rounded"
// // //   //               >
// // //   //                 Delete
// // //   //               </button>
// // //   //             </div>

// // //   //             {/* View / Add Variants */}
// // //   //             <div className="mt-2">
// // //   //               <button
// // //   //                 onClick={() => navigate(`/products/${p.id}`)}
// // //   //                 className="text-blue-600 underline mt-2"
// // //   //               >
// // //   //                 Add / View Variants
// // //   //               </button>
// // //   //             </div>
// // //   //           </div>
// // //   //         ))}
// // //   //       </div>

// // //   //       {/* Product Form Modal */}
// // //   //       {showForm && (
// // //   //         <ProductForm
// // //   //           categories={categories}
// // //   //           formData={editProduct || {}}
// // //   //           isEditing={!!editProduct}
// // //   //           onSubmit={handleSubmit}
// // //   //           onDelete={async (id) => {
// // //   //             await api.delete(`/product/${id}`);
// // //   //             setShowForm(false);
// // //   //             loadProducts();
// // //   //           }}
// // //   //           onClose={() => setShowForm(false)}
// // //   //         />
// // //   //       )}
// // //   //     </div>
// // //   //   );
// // //   // }


// // // import { useEffect, useState } from "react";
// // // import ProductForm from "./productForm";
// // // import api from "../../../api/api";
// // // import { useNavigate } from "react-router-dom";

// // // export default function ProductDashboard() {
// // //   const [products, setProducts] = useState([]);
// // //   const [categories, setCategories] = useState([]);
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [editProduct, setEditProduct] = useState(null);
// // //   const navigate = useNavigate();

// // //   const loadProducts = async () => {
// // //     try {
// // //       const { data } = await api.get("/product");
// // //       setProducts(data || []);
// // //     } catch (err) {
// // //       console.error("Cannot load products:", err);
// // //     }
// // //   };

// // //   const loadCategories = async () => {
// // //     try {
// // //       const { data } = await api.get("/category");
// // //       setCategories(data || []);
// // //     } catch (err) {
// // //       console.error("Cannot load categories:", err);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     loadProducts();
// // //     loadCategories();
// // //   }, []);

// // //   const handleAdd = () => {
// // //     setEditProduct(null);
// // //     setShowForm(true);
// // //   };

// // //   const handleEdit = (product) => {
// // //     setEditProduct(product);
// // //     setShowForm(true);
// // //   };

// // //   const handleSubmit = async (formData) => {
// // //     try {
// // //       if (editProduct?.id) {
// // //         await api.put(`/product/${editProduct.id}`, formData, {
// // //           headers: { "Content-Type": "multipart/form-data" },
// // //         });
// // //         alert("Product updated successfully!");
// // //       } else {
// // //         await api.post("/product/add", formData, {
// // //           headers: { "Content-Type": "multipart/form-data" },
// // //         });
// // //         alert("Product added successfully!");
// // //       }
// // //       setShowForm(false);
// // //       setEditProduct(null);
// // //       await loadProducts();
// // //     } catch (err) {
// // //       console.error("Error saving product:", err.response?.data || err.message);
// // //       alert("Error saving product");
// // //     }
// // //   };

// // //   const handleDelete = async (id) => {
// // //     if (!confirm("Delete product?")) return;
// // //     try {
// // //       await api.delete(`/product/${id}`);
// // //       await loadProducts();
// // //     } catch (err) {
// // //       console.error("Cannot delete product:", err);
// // //     }
// // //   };
  

// // //   return (
// // //     <div className="p-6">
// // //       {/* Header */}
// // //       <div className="flex justify-between items-center mb-6">
// // //         <h1 className="text-3xl font-bold">Products</h1>
// // //         <button
// // //           onClick={handleAdd}
// // //           className="bg-blue-600 text-white px-4 py-2 rounded"
// // //         >
// // //           Add Product
// // //         </button>
// // //       </div>

// // //       {/* Products Grid */}
// // //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
// // //         {products.map((p) => (
// // //           <div key={p.id} className="bg-white border rounded-xl p-4 shadow">
// // //             {p.image && (
// // //               <img
// // //                 src={`http://localhost:8080/uploads/${p.image}`}
// // //                 alt={p.product_name}
// // //                 className="h-40 w-full object-cover rounded-xl mb-4 border"
// // //               />
// // //             )}
// // //             <h2 className="text-lg font-semibold">{p.product_name}</h2>
// // //             <p className="text-sm text-gray-600">{p.product_description}</p>

// // //             {/* Edit / Delete Buttons */}
// // //             <div className="mt-4 flex gap-2">
// // //               <button
// // //                 onClick={() => handleEdit(p)}
// // //                 className="flex-1 bg-yellow-500 text-white py-2 rounded"
// // //               >
// // //                 Edit
// // //               </button>
// // //               <button
// // //                 onClick={() => handleDelete(p.id)}
// // //                 className="flex-1 bg-red-600 text-white py-2 rounded"
// // //               >
// // //                 Delete
// // //               </button>
// // //             </div>

// // //             {/* Add / View Variants */}
// // //             <div className="mt-2">
// // //               <button
// // //                 onClick={() => navigate(`/dashboard/product/${p.id}`)}
// // //                 className="text-blue-600 underline mt-2"
// // //               >
// // //                 Add / View Variants
// // //               </button>
// // //             </div>
// // //           </div>
// // //         ))}
// // //       </div>

// // //       {/* Product Form Modal */}
// // //       {showForm && (
// // //         <ProductForm
// // //           categories={categories}
// // //           formData={editProduct || {}}
// // //           isEditing={!!editProduct}
// // //           onSubmit={handleSubmit}
// // //           onDelete={async (id) => {
// // //             await api.delete(`/product/${id}`);
// // //             setShowForm(false);
// // //             loadProducts();
// // //           }}
// // //           onClose={() => setShowForm(false)}
// // //         />
// // //       )}
// // //     </div>
// // //   );
// // // }
// // import { useEffect, useState } from "react";
// // import ProductForm from "./productForm";
// // import api from "../../../api/api";
// // import { useNavigate } from "react-router-dom";

// // export default function ProductDashboard() {
// //   const [products, setProducts] = useState([]);
// //   const [categories, setCategories] = useState([]);
// //   const [showForm, setShowForm] = useState(false);
// //   const [editProduct, setEditProduct] = useState(null);
// //   const navigate = useNavigate();

// //   // Load products
// //   const loadProducts = async () => {
// //     try {
// //       const { data } = await api.get("/product");
// //       setProducts(data || []);
// //     } catch (err) {
// //       console.error("Cannot load products:", err);
// //     }
// //   };

// //   // Load categories
// //   const loadCategories = async () => {
// //     try {
// //       const { data } = await api.get("/category");
// //       setCategories(data || []);
// //     } catch (err) {
// //       console.error("Cannot load categories:", err);
// //     }
// //   };

// //   useEffect(() => {
// //     loadProducts();
// //     loadCategories();
// //   }, []);

// //   const handleAdd = () => {
// //     setEditProduct(null);
// //     setShowForm(true);
// //   };

// //   const handleEdit = (product) => {
// //     setEditProduct(product);
// //     setShowForm(true);
// //   };

// //   const handleSubmit = async (formData) => {
// //     try {
// //       if (editProduct?.id) {
// //         await api.put(`/product/${editProduct.id}`, formData, {
// //           headers: { "Content-Type": "multipart/form-data" },
// //         });
// //         alert("Product updated successfully!");
// //       } else {
// //         await api.post("/product/add", formData, {
// //           headers: { "Content-Type": "multipart/form-data" },
// //         });
// //         alert("Product added successfully!");
// //       }
// //       setShowForm(false);
// //       setEditProduct(null);
// //       await loadProducts();
// //     } catch (err) {
// //       console.error("Error saving product:", err.response?.data || err.message);
// //       alert("Error saving product");
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     if (!confirm("Delete product?")) return;
// //     try {
// //       await api.delete(`/product/${id}`);
// //       await loadProducts();
// //     } catch (err) {
// //       console.error("Cannot delete product:", err);
// //     }
// //   };

// //   // -----------------------------
// //   // GROUP PRODUCTS BY CATEGORY
// //   // -----------------------------
// //   const groupByCategory = () => {
// //     const grouped = {};

// //     products.forEach((p) => {
// //       const category =
// //         categories.find((c) => c.id === p.category_id)?.name || "Uncategorized";

// //       if (!grouped[category]) grouped[category] = [];
// //       grouped[category].push(p);
// //     });

// //     return grouped;
// //   };

// //   const categorizedProducts = groupByCategory();

// //   return (
// //     <div className="p-6">
// //       {/* Header */}
// //       <div className="flex justify-between items-center mb-6">
// //         <h1 className="text-3xl font-bold">Products</h1>
// //         <button
// //           onClick={handleAdd}
// //           className="bg-blue-600 text-white px-4 py-2 rounded"
// //         >
// //           Add Product
// //         </button>
// //       </div>

// //       {/* Categories */}
// //       {Object.keys(categorizedProducts).map((category) => (
// //         <div key={category} className="mb-8">
// //           <h2 className="text-2xl font-semibold mb-4 border-b pb-1">{category}</h2>

// //           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
// //             {categorizedProducts[category].map((p) => (
// //               <div
// //                 key={p.id}
// //                 className="bg-white border rounded-xl p-4 shadow"
// //               >
// //                 {p.image && (
// //                   <img
// //                     src={`http://localhost:8080/uploads/${p.image}`}
// //                     alt={p.product_name}
// //                     className="h-40 w-full object-cover rounded-xl mb-4 border"
// //                   />
// //                 )}
// //                 <h2 className="text-lg font-semibold">{p.product_name}</h2>
// //                 <p className="text-sm text-gray-600">{p.product_description}</p>

// //                 {/* Edit / Delete Buttons */}
// //                 <div className="mt-4 flex gap-2">
// //                   <button
// //                     onClick={() => handleEdit(p)}
// //                     className="flex-1 bg-yellow-500 text-white py-2 rounded"
// //                   >
// //                     Edit
// //                   </button>
// //                   <button
// //                     onClick={() => handleDelete(p.id)}
// //                     className="flex-1 bg-red-600 text-white py-2 rounded"
// //                   >
// //                     Delete
// //                   </button>
// //                 </div>

// //                 {/* Add / View Variants */}
// //                 <div className="mt-2">
// //                   <button
// //                     onClick={() => navigate(`/dashboard/product/${p.id}`)}
// //                     className="text-blue-600 underline mt-2"
// //                   >
// //                     Add / View Variants
// //                   </button>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       ))}

// //       {/* Product Form Modal */}
// //       {showForm && (
// //         <ProductForm
// //           categories={categories}
// //           formData={editProduct || {}}
// //           isEditing={!!editProduct}
// //           onSubmit={handleSubmit}
// //           onDelete={async (id) => {
// //             await api.delete(`/product/${id}`);
// //             setShowForm(false);
// //             loadProducts();
// //           }}
// //           onClose={() => setShowForm(false)}
// //         />
// //       )}
// //     </div>
// //   );
// // }
// import { useEffect, useState } from "react";
// import ProductForm from "./productForm";
// import api from "../../../api/api";
// import { useNavigate } from "react-router-dom";

// export default function ProductDashboard() {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [editProduct, setEditProduct] = useState(null);
//   const navigate = useNavigate();

//   // Load products
//   const loadProducts = async () => {
//     try {
//       const { data } = await api.get("/product");
//       setProducts(data || []);
//     } catch (err) {
//       console.error("Cannot load products:", err);
//     }
//   };

//   // Load categories
//   const loadCategories = async () => {
//     try {
//       const { data } = await api.get("/category");
//       setCategories(data || []);
//     } catch (err) {
//       console.error("Cannot load categories:", err);
//     }
//   };

//   useEffect(() => {
//     loadProducts();
//     loadCategories();
//   }, []);

//   const handleAdd = () => {
//     setEditProduct(null);
//     setShowForm(true);
//   };

//   const handleEdit = (product) => {
//     setEditProduct(product);
//     setShowForm(true);
//   };

//   const handleSubmit = async (formData) => {
//     try {
//       if (editProduct?.id) {
//         await api.put(`/product/${editProduct.id}`, formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         alert("Product updated successfully!");
//       } else {
//         await api.post("/product/add", formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         alert("Product added successfully!");
//       }
//       setShowForm(false);
//       setEditProduct(null);
//       await loadProducts();
//     } catch (err) {
//       console.error("Error saving product:", err.response?.data || err.message);
//       alert("Error saving product");
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm("Delete product?")) return;
//     try {
//       await api.delete(`/product/${id}`);
//       await loadProducts();
//     } catch (err) {
//       console.error("Cannot delete product:", err);
//     }
//   };

//   // Group products by category
//   const groupByCategory = () => {
//     const grouped = {};
//     products.forEach((p) => {
//       const category =
//         categories.find((c) => c.id === p.category_id)?.name || "Uncategorized";
//       if (!grouped[category]) grouped[category] = [];
//       grouped[category].push(p);
//     });
//     return grouped;
//   };

//   const categorizedProducts = groupByCategory();

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Products</h1>
//         <button
//           onClick={handleAdd}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
//         >
//           Add Product
//         </button>
//       </div>

//       {/* Categories */}
//       {Object.keys(categorizedProducts).map((category) => (
//         <div key={category} className="mb-8">
//           <h2 className="text-2xl font-semibold mb-4 border-b pb-1">{category}</h2>

//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//             {categorizedProducts[category].map((p) => (
//               <div
//                 key={p.id}
//                 className="bg-white border rounded-xl p-3 shadow hover:shadow-lg transition flex flex-col"
//               >
//                 {/* Image */}
//                 <div className="h-32 w-full mb-3 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
//                   {p.image ? (
//                     <img
//                       src={`http://localhost:8080/uploads/${p.image}`}
//                       alt={p.product_name}
//                       className="h-full w-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-gray-400 text-sm">No image</span>
//                   )}
//                 </div>

//                 {/* Product Name */}
//                 <h2 className="text-md font-semibold">{p.product_name}</h2>

//                 {/* Description */}
//                 <p className="text-sm text-gray-500 mt-1">
//                   {p.product_description || "No description"}
//                 </p>

//                 {/* Buttons */}
//                 <div className="mt-3 flex gap-2">
//                   <button
//                     onClick={() => handleEdit(p)}
//                     className="flex-1 bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600 transition text-sm"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(p.id)}
//                     className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700 transition text-sm"
//                   >
//                     Delete
//                   </button>
//                 </div>

//                 {/* Add/View Variants */}
//                 <button
//                   onClick={() => navigate(`/dashboard/product/${p.id}`)}
//                   className="mt-2 text-blue-600 underline text-sm hover:text-blue-800"
//                 >
//                   Add / View Variants
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}

//       {/* Product Form Modal */}
//       {showForm && (
//         <ProductForm
//           categories={categories}
//           formData={editProduct || {}}
//           isEditing={!!editProduct}
//           onSubmit={handleSubmit}
//           onDelete={async (id) => {
//             await api.delete(`/product/${id}`);
//             setShowForm(false);
//             loadProducts();
//           }}
//           onClose={() => setShowForm(false)}
//         />
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import ProductForm from "./productForm";
import api from "../../../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const navigate = useNavigate();

  // Load products
  const loadProducts = async () => {
    try {
      const { data } = await api.get("/product");
      setProducts(data || []);
    } catch (err) {
      console.error("Cannot load products:", err);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const { data } = await api.get("/category");
      setCategories(data || []);
    } catch (err) {
      console.error("Cannot load categories:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleAdd = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editProduct?.id) {
        await api.put(`/product/${editProduct.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product updated successfully!");
      } else {
        await api.post("/product/add", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product added successfully!");
      }
      setShowForm(false);
      setEditProduct(null);
      await loadProducts();
    } catch (err) {
      console.error("Error saving product:", err.response?.data || err.message);
      alert("Error saving product");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete product?")) return;
    try {
      await api.delete(`/product/${id}`);
      await loadProducts();
    } catch (err) {
      console.error("Cannot delete product:", err);
    }
  };

  // Filter products by selected category
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category_id === Number(selectedCategory));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <Link
          // onClick={handleAdd}
          to="/dashboard/product/new"
          className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow hover:bg-blue-700 transition"
        >
          Add Product
        </Link>
      </div>

      {/* Category Filter Dropdown */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="font-semibold text-gray-700">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white border rounded-2xl p-4 shadow-md hover:shadow-xl transition flex flex-col"
          >
            {/* Image */}
            <div className="h-40 w-full mb-3 rounded-2xl overflow-hidden border bg-gray-50 flex items-center justify-center">
              {p.image ? (
                <img
                  src={`http://localhost:8080/uploads/${p.image}`}
                  alt={p.product_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>

            {/* Product Name */}
            <h2 className="text-md font-semibold text-gray-800">{p.product_name}</h2>

            {/* Description */}
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {p.product_description || "No description"}
            </p>

            {/* Buttons */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => handleEdit(p)}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-xl hover:bg-yellow-600 transition text-sm shadow"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition text-sm shadow"
              >
                Delete
              </button>
            </div>

            {/* Add/View Variants */}
            <button
              onClick={() => navigate(`/dashboard/product/${p.id}`)}
              className="mt-3 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm shadow"
            >
              Add / View Variants
            </button>
          </div>
        ))}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          categories={categories}
          formData={editProduct || {}}
          isEditing={!!editProduct}
          onSubmit={handleSubmit}
          onDelete={async (id) => {
            await api.delete(`/product/${id}`);
            setShowForm(false);
            loadProducts();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
