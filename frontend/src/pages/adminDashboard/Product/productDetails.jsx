import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ name: "", quantity: "", price: "", status: "active" });
  const [editVariantId, setEditVariantId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data } = await api.get(`/product/${id}`);
      setProduct(data.product);
      setVariants(data.variants || []);
    } catch (err) {
      console.error("Cannot load product:", err);
    }
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitVariant = async (e) => {
    e.preventDefault();
    try {
      if (editVariantId) {
        await api.put(`/variants/${editVariantId}`, { ...variantForm });
        setEditVariantId(null);
      } else {
        await api.post("/variants/add", { product_id: id, ...variantForm });
      }
      setVariantForm({ name: "", quantity: 0, price: 0, status: "active" });
      await loadProduct();
    } catch (err) {
      console.error("Error saving variant:", err);
      alert("Error saving variant");
    }
  };

  const editVariant = (v) => {
    setEditVariantId(v.id);
    setVariantForm({ name: v.name, quantity: v.quantity, price: v.price, status: v.status });
  };

  const deleteVariant = async (vId) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await api.delete(`/variants/${vId}`);
      await loadProduct();
    } catch (err) {
      console.error("Cannot delete variant:", err);
      alert("Cannot delete variant");
    }
  };

  if (!product) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="text-blue-600 hover:underline font-medium mb-2"
      >
        &larr; Back
      </button>

      {/* Product Info */}
      <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row gap-6 items-center">
        <img
          src={`http://localhost:8080/uploads/${product.image}`}
          alt={product.product_name}
          className="w-full sm:w-48 h-48 object-cover rounded-xl border"
        />
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">{product.product_name}</h2>
          <p className="text-gray-600">{product.product_description}</p>
        </div>
      </div>

      {/* Variants Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Variants</h3>

        {/* Variant List */}
        {variants.length === 0 ? (
          <p className="text-gray-500">No variants yet.</p>
        ) : (
          <ul className="space-y-2">
            {variants.map((v) => (
              <li
                key={v.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-xl hover:bg-gray-50 transition"
              >
                <div>
                  <div className="font-medium text-gray-700">{v.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    ₱{v.price} • qty: {v.quantity} • {v.status}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => editVariant(v)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteVariant(v.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add / Update Variant Form */}
        <form onSubmit={submitVariant} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <input
            name="name"
            value={variantForm.name}
            onChange={handleVariantChange}
            placeholder="Variant name (e.g., 12 oz)"
            className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            name="price"
            type="number"
            value={variantForm.price}
            onChange={handleVariantChange}
            placeholder="Price"
            className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            name="quantity"
            type="number"
            value={variantForm.quantity}
            onChange={handleVariantChange}
            placeholder="Quantity"
            className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <select
            name="status"
            value={variantForm.status}
            onChange={handleVariantChange}
            className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="submit"
            className="sm:col-span-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-2xl transition"
          >
            {editVariantId ? "Update Variant" : "Add Variant"}
          </button>
        </form>
      </div>
    </div>
  );
}
