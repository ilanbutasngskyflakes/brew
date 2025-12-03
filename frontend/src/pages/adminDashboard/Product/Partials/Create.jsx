import { useState, useEffect } from "react";
import api from "../../../../api/api";

export default function Create({ formData = {}, isEditing }) {
  const [form, setForm] = useState({
    product_name: "",
    product_description: "",
    category_id: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([
    { variant_name: "", price: 0, ingredients: [] },
  ]);
  const [ingredients, setIngredients] = useState([]);

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

  // Update form data if editing
  useEffect(() => {
    if (formData.product_name) setForm({ ...formData });
    if (formData.variants) setVariants(formData.variants);
  }, [formData]);

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

      const res = await api.post("/product/add", data);
      alert("Product added successfully!");
      // Optionally redirect or clear form
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add product");
    }
  };

  return (
    <div className="p-6 bg-white w-full rounded-md shadow-sm">
      <div className="flex justify-between p-3">
        <h1 className="uppercase text-lg font-medium items-center">
          Register Product
        </h1>
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
            <img
              src={imagePreview}
              className="h-32 w-32 mt-2 rounded-xl border shadow"
            />
          )}
        </div>

        {/* Variants */}
        <div className="col-span-2 border p-3 rounded-md border-gray-300 grid gap-3">
          <button
            onClick={addVariant}
            className="p-2 bg-gray-100 rounded shadow col-span-2"
          >
            Add Variant
          </button>

          {variants.map((v, index) => (
            <div key={index} className="border-b pb-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Variant Name"
                  value={v.variant_name}
                  onChange={(e) =>
                    handleVariantChange(index, "variant_name", e.target.value)
                  }
                  className="p-2 border rounded-md"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", Number(e.target.value))
                  }
                  className="p-2 border rounded-md"
                  required
                />
              </div>

              {/* Ingredients checkboxes */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ingredients.map((ing) => {
                  const selected = v.ingredients?.find(
                    (i) => i.ingredient_id === ing.id
                  );
                  return (
                    <div key={ing.id} className="flex items-center gap-2">
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
                      />
                      <span>
                        {ing.ingredient_name} ({ing.unit})
                      </span>
                      {selected && (
                        <input
                          type="number"
                          value={selected.amount}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              ing.id,
                              Number(e.target.value),
                              true
                            )
                          }
                          className="w-16 p-1 border rounded"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="col-span-2 mt-3 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 flex-1 rounded-xl shadow hover:bg-blue-700"
          >
            {isEditing ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
