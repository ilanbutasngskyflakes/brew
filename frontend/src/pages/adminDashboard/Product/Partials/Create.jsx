import { useState, useEffect } from "react";
import api from "../../../../api/api";

export default function Create({ formData = {}, isEditing, onSubmit, onDelete, onClose }) {
  const [form, setForm] = useState(formData);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);

  // NEW: Variants
  const [variants, setVariants] = useState(formData.variants || [
    { name: "", price: "", qty: "" }
  ]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/category");
        setCategories(data);
      } catch (err) {
        console.error("Cannot fetch categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Update when editing
  useEffect(() => {
    setForm(formData);

    // Set variants if editing
    setVariants(formData.variants || [
      { name: "", price: "", qty: "" }
    ]);

    setImagePreview(
      formData?.image
        ? typeof formData.image === "string"
          ? `http://localhost:8080/uploads/${formData.image}`
          : URL.createObjectURL(formData.image)
        : ""
    );
  }, [formData]);


  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files?.length > 0) {
      setForm({ ...form, image: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle Variant Change
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Add Variant
  const addVariant = (e) => {
    e.preventDefault();
    setVariants([...variants, { name: "", price: "", qty: "" }]);
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("category_id", form.category_id);
    data.append("product_name", form.product_name);

    if (form.product_description?.trim()) {
      data.append("product_description", form.product_description.trim());
    }

    if (form.image instanceof File) {
      data.append("image", form.image);
    }

    // IMPORTANT: Include variants
    data.append("variants", JSON.stringify(variants));

    onSubmit(data); // Send to backend
  };

  return (
    <>
      <div className="w-full h-scree">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 p-4">

          {/* Product Name */}
          <div className="flex flex-col gap-1 mb-2">
            <label className="text-sm text-gray-600">Product Name</label>
            <input
              type="text"
              name="product_name"
              value={form.product_name || ""}
              onChange={handleChange}
              placeholder="Product Name"
              className="p-2 border rounded-md text-gray-700 shadow-md bg-white"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1 mb-2">
            <label className="text-sm text-gray-600">Category</label>
            <select
              name="category_id"
              value={form.category_id || ""}
              onChange={handleChange}
              className="p-2 border rounded-md text-gray-700 shadow-md bg-white"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1 mb-2 col-span-2">
            <label className="text-sm text-gray-600">
              Upload Image <span className="text-red-700 font-bold">*</span>
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="p-2 border rounded-md text-gray-700 shadow-md bg-white"
            />

            {imagePreview && (
              <img
                src={imagePreview}
                className="h-32 w-32 mt-2 rounded-xl border shadow"
              />
            )}
          </div>

          {/* VARIANTS */}
          <div className="w-full border col-span-2 border-gray-300 rounded-md p-3 grid grid-cols-3 gap-3">

            <button
              className="p-3 bg-white rounded-md text-gray-700 col-span-3 shadow"
              onClick={addVariant}
            >
              Add Variant
            </button>

            {/* Variant Inputs */}
            {variants.map((v, index) => (
              <div key={index} className="grid grid-cols-3 col-span-3 gap-3 border-b pb-3">

                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Name</label>
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) =>
                      handleVariantChange(index, "name", e.target.value)
                    }
                    className="p-2 border rounded-md shadow bg-white"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Price</label>
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) =>
                      handleVariantChange(index, "price", e.target.value)
                    }
                    className="p-2 border rounded-md shadow bg-white"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Qty</label>
                  <input
                    type="number"
                    value={v.qty}
                    onChange={(e) =>
                      handleVariantChange(index, "qty", e.target.value)
                    }
                    className="p-2 border rounded-md shadow bg-white"
                  />
                </div>

              </div>
            ))}

          </div>

          {/* SUBMIT BUTTON */}
          <div className="col-span-2 mt-3 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 flex-1 rounded-xl shadow hover:bg-blue-700"
            >
              {isEditing ? "Update Product" : "Add Product"}
            </button>

            {isEditing && (
              <button
                type="button"
                className="bg-red-600 text-white py-2 flex-1 rounded-xl shadow hover:bg-red-700"
                onClick={() => onDelete(form.id)}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
