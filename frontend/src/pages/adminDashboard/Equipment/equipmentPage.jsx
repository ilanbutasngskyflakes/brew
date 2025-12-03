import { useEffect, useState } from "react";
import EquipmentForm from "./equipForm"; // Create a form similar to ProductForm but for equipment
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";

export default function EquipmentDashboard() {
  const [equipments, setEquipments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editEquipment, setEditEquipment] = useState(null);
  const navigate = useNavigate();

  // Load equipments
  const loadEquipments = async () => {
    try {
      const { data } = await api.get("/equipment"); // Make sure your backend route is /equipment
      setEquipments(data || []);
    } catch (err) {
      console.error("Cannot load equipments:", err);
    }
  };

  useEffect(() => {
    loadEquipments();
  }, []);

  const handleAdd = () => {
    setEditEquipment(null);
    setShowForm(true);
  };

  const handleEdit = (equipment) => {
    setEditEquipment(equipment);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editEquipment?.id) {
        await api.put(`/equipment/${editEquipment.id}`, formData);
        alert("Equipment updated successfully!");
      } else {
        await api.post("/equipment/add", formData);
        alert("Equipment added successfully!");
      }
      setShowForm(false);
      setEditEquipment(null);
      await loadEquipments();
    } catch (err) {
      console.error("Error saving equipment:", err.response?.data || err.message);
      alert("Error saving equipment");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete equipment?")) return;
    try {
      await api.delete(`/equipment/${id}`);
      await loadEquipments();
    } catch (err) {
      console.error("Cannot delete equipment:", err);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Equipments</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow hover:bg-blue-700 transition"
        >
          Add Equipment
        </button>
      </div>

      {/* Equipments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {equipments.map((e) => (
          <div
            key={e.id}
            className="bg-white border rounded-2xl p-4 shadow-md hover:shadow-xl transition flex flex-col"
          >
            {/* Equipment Name */}
            <h2 className="text-md font-semibold text-gray-800">{e.name}</h2>

            {/* Quantity */}
            <p className="text-sm text-gray-500 mt-1">Quantity: {e.qty}</p>

            {/* Created / Updated */}
            <p className="text-xs text-gray-400 mt-1">
              Created: {new Date(e.created_at).toLocaleDateString()} <br />
              Updated: {new Date(e.updated_at).toLocaleDateString()}
            </p>

            {/* Buttons */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => handleEdit(e)}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-xl hover:bg-yellow-600 transition text-sm shadow"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition text-sm shadow"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Form Modal */}
      {showForm && (
        <EquipmentForm
          formData={editEquipment || {}}
          isEditing={!!editEquipment}
          onSubmit={handleSubmit}
          onDelete={async (id) => {
            await api.delete(`/equipment/${id}`);
            setShowForm(false);
            loadEquipments();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
