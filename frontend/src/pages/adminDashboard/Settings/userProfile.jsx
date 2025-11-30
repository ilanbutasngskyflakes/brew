
import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiLock } from "react-icons/fi";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", first_name: "", last_name: "", role: "", password: "" });
  const [editingId, setEditingId] = useState(null);
  const [passwordChange, setPasswordChange] = useState({ id: null, current_password: "", new_password: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8080/user");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrEdit = async () => {
    try {
      if (editingId) {
        await axios.put(`http://localhost:8080/user/${editingId}`, form);
        alert("User updated successfully");
      } else {
        await axios.post("http://localhost:8080/user", form);
        alert("User added successfully");
      }
      setForm({ name: "", first_name: "", last_name: "", role: "", password: "" });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:8080/user/${id}`);
      alert("User deleted");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const handleChangePassword = async () => {
    try {
      await axios.put(`http://localhost:8080/user/change-password/${passwordChange.id}`, passwordChange);
      alert("Password changed successfully");
      setPasswordChange({ id: null, current_password: "", new_password: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to change password");
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: "",
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">User Management</h2>

      {/* Add/Edit Form */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-6 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">{editingId ? "Edit User" : "Add User"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Username"
            className="border p-2 rounded-lg w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="First Name"
            className="border p-2 rounded-lg w-full"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="border p-2 rounded-lg w-full"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          <select
            className="border p-2 rounded-lg w-full"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
          </select>
          {!editingId && (
            <input
              type="password"
              placeholder="Password"
              className="border p-2 rounded-lg w-full md:col-span-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </div>
        <button
          onClick={handleAddOrEdit}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {editingId ? "Update User" : "Add User"}
        </button>
        {editingId && (
          <button
            onClick={() => { setEditingId(null); setForm({ name: "", first_name: "", last_name: "", role: "", password: "" }) }}
            className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow-md overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">First Name</th>
              <th className="px-4 py-2 text-left">Last Name</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                <td className="px-4 py-2">{user.id}</td>
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.first_name}</td>
                <td className="px-4 py-2">{user.last_name}</td>
                <td className="px-4 py-2 capitalize">{user.role}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => startEdit(user)}
                    className="bg-yellow-400 text-white p-2 rounded-lg hover:bg-yellow-500 transition flex items-center gap-1"
                  >
                    <FiEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                  >
                    <FiTrash2 /> Delete
                  </button>
                  <button
                    onClick={() => setPasswordChange({ ...passwordChange, id: user.id })}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                  >
                    <FiLock /> Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change Password Modal */}
      {passwordChange.id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <input
              type="password"
              placeholder="Current Password"
              className="border p-2 rounded-lg w-full mb-2"
              value={passwordChange.current_password}
              onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
            />
            <input
              type="password"
              placeholder="New Password"
              className="border p-2 rounded-lg w-full mb-4"
              value={passwordChange.new_password}
              onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPasswordChange({ id: null, current_password: "", new_password: "" })}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
