import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/api";

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ingredient_name: "",
    quantity: "",
    unit: "ml",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredient = async () => {
      try {
        const res = await api.get(`/ingredients/${id}`);
        setFormData({
          ingredient_name: res.data.ingredient_name,
          quantity: res.data.quantity,
          unit: res.data.unit,
        });
      } catch (error) {
        console.error("Error fetching ingredient:", error);
        alert("Failed to fetch ingredient data");
        navigate("/dashboard/ingredients");
      } finally {
        setLoading(false);
      }
    };

    fetchIngredient();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/ingredients/${id}`, formData); 
      alert("Ingredient updated!");
      navigate("/dashboard/ingredients");
    } catch (error) {
      console.error(error);
      alert("Error updating ingredient");
    }
  };

  if (loading) return <p className="p-4 text-gray-500">Loading ingredient...</p>;

  return (
    <div className="p-6 bg-white w-full rounded-md shadow-sm">
      <div className="flex justify-between p-3">
        <h1 className="uppercase text-lg font-medium items-center">
          Update Ingredient
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Ingredient Name</label>
          <input
            type="text"
            name="ingredient_name"
            value={formData.ingredient_name}
            onChange={handleChange}
            placeholder="Enter ingredient"
            className="p-2 border rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-blue-300"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter Quantity"
            className="p-2 border rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-blue-300"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Unit</label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="p-2 border rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-300"
          >
            <option value="ml">ml (milliliters)</option>
            <option value="g">g (grams)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="col-span-3 mt-3 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 flex-1 rounded-xl shadow hover:bg-blue-700"
          >
            Update Ingredient
          </button>
        </div>
      </form>
    </div>
  );
}
