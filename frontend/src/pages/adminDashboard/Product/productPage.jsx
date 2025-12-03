import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import ProductForm from "./productForm";

export default function ProductDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const navigate = useNavigate();

  // Load products with variants and ingredients
  const loadProducts = async () => {
    try {
      const { data } = await api.get("/product"); // new endpoint
      setProducts(data.products || []);
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

  // Filter products by category
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
          to="/dashboard/product/new"
          onClick={handleAdd}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow hover:bg-blue-700 transition"
        >
          Add Product
        </Link>
      </div>

      {/* Category Filter */}
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
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {p.product_description || "No description"}
            </p>

            {/* Variants */}
            {p.variants?.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold text-sm text-gray-700">Variants:</h3>
                {p.variants.map((v) => (
                  <div key={v.id} className="text-sm mt-1 border-t pt-1">
                    <div className="flex justify-between">
                      <span>{v.name}</span>
                      <span className="font-medium">₱{v.price}</span>
                    </div>
                    {v.ingredients?.length > 0 && (
                      <ul className="text-xs text-gray-500 mt-1 list-disc list-inside">
                        {v.ingredients.map((i) => (
                          <li key={i.id}>
                            {i.name} ({i.amount} {i.unit})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

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
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
