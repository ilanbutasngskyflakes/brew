import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/api";

export default function Edit() {
  const isEditing = true;
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    product_name: "",
    product_description: "",
    category_id: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load categories and ingredients
  useEffect(() => {
    const loadData = async () => {
      try {
        const catRes = await api.get("/category");
        setCategories(catRes.data);

        const ingRes = await api.get("/ingredients");
        setIngredients(ingRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // Load product data when editing
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/product/${id}`);
        
        setForm({
          product_name: data.product_name || "",
          product_description: data.product_description || "",
          category_id: data.category_id || "",
          image: data.image || null,
        });

        if (data.image) {
          setImagePreview(`http://localhost:8080/uploads/${data.image}`);
        }

        // Load variants with ingredients
        if (data.variants && data.variants.length > 0) {
          const formattedVariants = data.variants.map(v => ({
            id: v.id,
            variant_name: v.name || v.variant_name || "",
            price: v.price || "",
            ingredients: v.ingredients?.map(i => ({
              ingredient_id: i.ingredient_id || i.id,
              amount: i.amount || i.pivot?.amount || 0
            })) || []
          }));
          setVariants(formattedVariants);
        } else {
          setVariants([{ variant_name: "", price: "", ingredients: [] }]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Cannot load product:", err);
        alert("Error loading product");
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.length > 0) {
      setForm({ ...form, image: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Variant inputs
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Ingredient for variant
  const handleIngredientChange = (
    variantIndex,
    ingredientId,
    amount,
    checked
  ) => {
    const updated = [...variants];
    if (!updated[variantIndex].ingredients)
      updated[variantIndex].ingredients = [];

    const existingIndex = updated[variantIndex].ingredients.findIndex(
      (i) => i.ingredient_id === ingredientId
    );

    if (checked) {
      if (existingIndex === -1) {
        updated[variantIndex].ingredients.push({
          ingredient_id: ingredientId,
          amount,
        });
      } else {
        updated[variantIndex].ingredients[existingIndex].amount = amount;
      }
    } else {
      if (existingIndex !== -1) {
        updated[variantIndex].ingredients.splice(existingIndex, 1);
      }
    }

    setVariants(updated);
  };

  const addVariant = (e) => {
    e.preventDefault();
    setVariants([
      ...variants,
      { variant_name: "", price: 0, ingredients: [] },
    ]);
  };

  const removeVariant = async (index, e) => {
    e.preventDefault();
    const variant = variants[index];
    
    if (variant.id) {
      // Delete from backend if it exists
      if (confirm("Delete this variant?")) {
        try {
          await api.delete(`/variant/${variant.id}`);
          setVariants(variants.filter((_, i) => i !== index));
          alert("Variant deleted successfully!");
        } catch (err) {
          console.error("Error deleting variant:", err);
          alert("Error deleting variant");
        }
      }
    } else {
      // Just remove from state if not saved yet
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append("product_name", form.product_name);
      data.append("product_description", form.product_description || "");
      data.append("category_id", form.category_id);
      if (form.image instanceof File) data.append("image", form.image);
      data.append("variants", JSON.stringify(variants));

      await api.put(`/product/${id}`, data);
      alert("Product updated successfully!");
      navigate("/dashboard/product");
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white w-full rounded-md shadow-sm">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white w-full rounded-md shadow-sm">
      <div className="flex justify-between p-3">
        <h1 className="uppercase text-lg font-medium items-center">
          Edit Product
        </h1>
        <button
          onClick={() => navigate("/dashboard/product")}
          className="text-gray-600 hover:text-gray-800 transition"
        >
          ← Back
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
        {/* Product Name */}
        <div className="flex flex-col gap-1 mb-2">
          <label className="text-sm text-gray-600">Product Name</label>
          <input
            type="text"
            name="product_name"
            value={form.product_name}
            onChange={handleChange}
            placeholder={form.product_name || "Enter product name"}
            className="p-2 border rounded-md shadow bg-white"
            required
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col gap-1 mb-2 col-span-2">
          <label className="text-sm text-gray-600">Product Description</label>
          <textarea
            name="product_description"
            value={form.product_description}
            onChange={handleChange}
            placeholder={form.product_description || "Enter product description"}
            className="p-2 border rounded-md shadow bg-white"
            rows={3}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1 mb-2">
          <label className="text-sm text-gray-600">Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="p-2 border rounded-md shadow bg-white"
            required
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image */}
        <div className="flex flex-col gap-1 mb-2 col-span-2">
          <label className="text-sm text-gray-600">Upload Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          {imagePreview && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Current Image:</p>
              <img
                src={imagePreview}
                className="h-32 w-32 rounded-xl border shadow object-cover"
                alt="Product Preview"
              />
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="col-span-2 border p-3 rounded-md border-gray-300 grid gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-medium text-gray-700">Product Variants</h2>
            <button
              onClick={addVariant}
              className="p-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              + Add Variant
            </button>
          </div>

          {variants.map((v, index) => (
            <div key={index} className="border-b pb-3 bg-gray-50 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700">
                  Variant {index + 1}
                  {v.variant_name && (
                    <span className="text-sm text-gray-500 ml-2">({v.variant_name})</span>
                  )}
                </h3>
                <button
                  onClick={(e) => removeVariant(index, e)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder={v.variant_name || "Variant Name (e.g., Small, Medium)"}
                  value={v.variant_name}
                  onChange={(e) =>
                    handleVariantChange(index, "variant_name", e.target.value)
                  }
                  className="p-2 border rounded-md bg-white"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder={v.price || "Price"}
                  value={v.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", Number(e.target.value))
                  }
                  onWheel={(e) => e.target.blur()}
                  className="p-2 border rounded-md bg-white"
                  required
                />
              </div>

              {/* Ingredients checkboxes */}
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-600 block mb-2">
                  Select Ingredients:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-white p-2 rounded border">
                  {ingredients.map((ing) => {
                    const selected = v.ingredients?.find(
                      (i) => i.ingredient_id === ing.id
                    );
                    return (
                      <div key={ing.id} className="flex items-center gap-2 p-1">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              ing.id,
                              selected?.amount || 0,
                              e.target.checked
                            )
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">
                          {ing.ingredient_name} ({ing.unit})
                        </span>
                        {selected && (
                          <input
                            type="number"
                            step="0.01"
                            value={selected.amount}
                            onChange={(e) =>
                              handleIngredientChange(
                                index,
                                ing.id,
                                Number(e.target.value),
                                true
                              )
                            }
                            onWheel={(e) => e.target.blur()}
                            placeholder="Amount"
                            className="w-20 p-1 border rounded text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="col-span-2 mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/product")}
            className="border border-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 flex-1 rounded-xl shadow hover:bg-blue-700"
          >
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
}