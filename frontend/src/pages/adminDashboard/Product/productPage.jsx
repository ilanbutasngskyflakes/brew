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

  //   const loadProducts = async () => {
  //     try {
  //       const { data } = await api.get("/product");
  //       setProducts(data || []);
  //     } catch (err) {
  //       console.error("Cannot load products:", err);
  //     }
  //   };

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

  //   return (
  //     <div className="p-6">
  //       {/* Header */}
  //       <div className="flex justify-between items-center mb-6">
  //         <h1 className="text-3xl font-bold">Products</h1>
  //         <button
  //           onClick={handleAdd}
  //           className="bg-blue-600 text-white px-4 py-2 rounded"
  //         >
  //           Add Product
  //         </button>
  //       </div>

  //       {/* Products Grid */}
  //       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  //         {products.map((p) => (
  //           <div key={p.id} className="bg-white border rounded-xl p-4 shadow">
  //             {p.image && (
  //               <img
  //                 src={`http://localhost:8080/uploads/${p.image}`}
  //                 alt={p.product_name}
  //                 className="h-40 w-full object-cover rounded-xl mb-4 border"
  //               />
  //             )}
  //             <h2 className="text-lg font-semibold">{p.product_name}</h2>
  //             <p className="text-sm text-gray-600">{p.product_description}</p>

  //             {/* Edit / Delete Buttons */}
  //             <div className="mt-4 flex gap-2">
  //               <button
  //                 onClick={() => handleEdit(p)}
  //                 className="flex-1 bg-yellow-500 text-white py-2 rounded"
  //               >
  //                 Edit
  //               </button>
  //               <button
  //                 onClick={() => handleDelete(p.id)}
  //                 className="flex-1 bg-red-600 text-white py-2 rounded"
  //               >
  //                 Delete
  //               </button>
  //             </div>

  //             {/* View / Add Variants */}
  //             <div className="mt-2">
  //               <button
  //                 onClick={() => navigate(`/products/${p.id}`)}
  //                 className="text-blue-600 underline mt-2"
  //               >
  //                 Add / View Variants
  //               </button>
  //             </div>
  //           </div>
  //         ))}
  //       </div>

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
import { useNavigate } from "react-router-dom";

export default function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      const { data } = await api.get("/product");
      setProducts(data || []);
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white border rounded-xl p-4 shadow">
            {p.image && (
              <img
                src={`http://localhost:8080/uploads/${p.image}`}
                alt={p.product_name}
                className="h-40 w-full object-cover rounded-xl mb-4 border"
              />
            )}
            <h2 className="text-lg font-semibold">{p.product_name}</h2>
            <p className="text-sm text-gray-600">{p.product_description}</p>

            {/* Edit / Delete Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(p)}
                className="flex-1 bg-yellow-500 text-white py-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded"
              >
                Delete
              </button>
            </div>

            {/* Add / View Variants */}
            <div className="mt-2">
              <button
                onClick={() => navigate(`/dashboard/product/${p.id}`)}
                className="text-blue-600 underline mt-2"
              >
                Add / View Variants
              </button>
            </div>
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
