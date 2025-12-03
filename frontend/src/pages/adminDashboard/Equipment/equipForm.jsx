import { useState, useEffect } from "react";
import api from "../../../api/api"; // your axios instance

export default function EquipmentForm({ formData = {}, isEditing, onSubmit, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: "",
    qty: 0,
    ...formData,
  });

  // Update form when editing
  useEffect(() => {
    setForm({
      name: formData.name || "",
      qty: formData.qty || 0,
    });
  }, [formData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "qty" ? parseInt(value) : value,
    });
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name) {
      alert("Equipment name is required");
      return;
    }

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
        <button
          className="absolute top-3 right-3 text-gray-500 text-3xl hover:text-gray-700 transition"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          {isEditing ? "Edit Equipment" : "Add Equipment"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Equipment name */}
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Equipment Name"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            required
          />

          {/* Quantity */}
          <input
            type="number"
            name="qty"
            value={form.qty}
            onChange={handleChange}
            placeholder="Quantity"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            min={0}
            required
          />

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              {isEditing ? "Update" : "Add"} Equipment
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => onDelete(formData.id)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition shadow-md"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
