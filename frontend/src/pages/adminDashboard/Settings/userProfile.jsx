/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import api from "../../../api/api";
import { FiEdit, FiTrash2, FiLock, FiUser, FiUserPlus, FiX, FiCheck } from "react-icons/fi";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", first_name: "", last_name: "", role: "", password: "" });
  const [editingId, setEditingId] = useState(null);
  const [passwordChange, setPasswordChange] = useState({ id: null, current_password: "", new_password: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/user");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch users");
    }
  };

  const handleAddOrEdit = async () => {
    try {
      if (!form.name || !form.first_name || !form.last_name || !form.role) {
        alert("Please fill in all required fields");
        return;
      }

      if (!editingId && !form.password) {
        alert("Password is required for new users");
        return;
      }

      if (editingId) {
        const updateData = {
          name: form.name,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role
        };
        await api.put(`/user/${editingId}`, updateData);
        alert("User updated successfully");
      } else {
        await api.post("/user", form);
        alert("User added successfully");
      }
      
      setForm({ name: "", first_name: "", last_name: "", role: "", password: "" });
      setEditingId(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await api.delete(`/user/${id}`);
      alert("User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordChange.current_password || !passwordChange.new_password) {
        alert("Please fill in both password fields");
        return;
      }

      if (passwordChange.new_password.length < 8) {
        alert("New password must be at least 8 characters");
        return;
      }

      await api.put(`/user/change-password/${passwordChange.id}`, {
        current_password: passwordChange.current_password,
        new_password: passwordChange.new_password
      });
      
      alert("Password changed successfully");
      setPasswordChange({ id: null, current_password: "", new_password: "" });
      setShowPasswordModal(false);
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
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", first_name: "", last_name: "", role: "", password: "" });
    setShowForm(false);
  };

  const openPasswordModal = (userId) => {
    setPasswordChange({ id: userId, current_password: "", new_password: "" });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setPasswordChange({ id: null, current_password: "", new_password: "" });
    setShowPasswordModal(false);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'cashier': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiUser className="text-white text-xl" />
                </div>
                User Management
              </h1>
              <p className="text-slate-600 mt-1 text-sm">Manage your team members and their access</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm"
              >
                <FiUserPlus size={18} />
                Add New User
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingId ? <FiEdit className="text-[#073dbe]" size={18} /> : <FiUserPlus className="text-[#073dbe]" size={18} />}
                {editingId ? "Edit User" : "Add New User"}
              </h3>
              <button
                onClick={cancelEdit}
                className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white cursor-pointer text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                >
                  <option value="">Select a role</option>
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>

              {!editingId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password (minimum 8 characters)"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleAddOrEdit}
                className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
              >
                <FiCheck size={16} />
                {editingId ? "Update User" : "Add User"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiUser size={16} />
              All Users ({users.length})
            </h3>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-slate-400 text-2xl" />
              </div>
              <p className="text-base font-semibold text-slate-900 mb-1">No users found</p>
              <p className="text-slate-600 text-sm">Click "Add New User" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">User Info</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#073dbe] rounded-lg text-white font-bold text-sm">
                          {user.id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {user.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startEdit(user)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-all"
                            title="Edit user"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => openPasswordModal(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-all"
                            title="Change password"
                          >
                            <FiLock size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                            title="Delete user"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && passwordChange.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
              <div className="bg-[#073dbe] px-4 py-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiLock size={18} />
                    Change Password
                  </h3>
                  <button
                    onClick={closePasswordModal}
                    className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    value={passwordChange.current_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                    value={passwordChange.new_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 px-4 pb-4">
                <button
                  onClick={closePasswordModal}
                  className="flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <FiCheck size={16} />
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
