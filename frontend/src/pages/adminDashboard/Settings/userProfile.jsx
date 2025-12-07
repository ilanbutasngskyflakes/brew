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
      // Validate required fields
      if (!form.name || !form.first_name || !form.last_name || !form.role) {
        alert("Please fill in all required fields");
        return;
      }

      if (!editingId && !form.password) {
        alert("Password is required for new users");
        return;
      }

      if (editingId) {
        // Update existing user (don't send password)
        const updateData = {
          name: form.name,
          first_name: form.first_name,
          last_name: form.last_name,
          role: form.role
        };
        await api.put(`/user/${editingId}`, updateData);
        alert("User updated successfully! ✅");
      } else {
        // Add new user (include password)
        await api.post("/user", form);
        alert("User added successfully! 🎉");
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
    if (!window.confirm("⚠️ Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await api.delete(`/user/${id}`);
      alert("User deleted successfully! 🗑️");
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
      
      alert("Password changed successfully! 🔐");
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
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'cashier': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                  <FiUser className="text-white text-2xl" />
                </div>
                User Management
              </h1>
              <p className="text-gray-600 mt-2 ml-1">Manage your team members and their access</p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-semibold"
              >
                <FiUserPlus className="text-xl" />
                <span className="hidden sm:inline">Add New User</span>
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-xl p-6 lg:p-8 mb-8 border-2 border-gray-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingId ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  {editingId ? <FiEdit className="text-yellow-600 text-xl" /> : <FiUserPlus className="text-green-600 text-xl" />}
                </div>
                {editingId ? "Edit User" : "Add New User"}
              </h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none appearance-none bg-white cursor-pointer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                >
                  <option value="">Select a role</option>
                  <option value="admin">👑 Admin</option>
                  <option value="cashier">💰 Cashier</option>
                </select>
              </div>

              {!editingId && (
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password (minimum 8 characters)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleAddOrEdit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2"
              >
                <FiCheck className="text-xl" />
                {editingId ? "Update User" : "Add User"}
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-gray-100">
          <div className="bg-indigo-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FiUser />
              All Users ({users.length})
            </h3>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-4xl text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-500">No users found</p>
              <p className="text-gray-400 mt-2">Click "Add New User" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg text-white font-bold shadow-md">
                          {user.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-gray-800 text-base">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <FiUser className="text-xs" />
                            {user.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'admin' ? '👑' : '💰'} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startEdit(user)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1.5 font-medium"
                            title="Edit user"
                          >
                            <FiEdit className="text-base" />
                            <span className="hidden lg:inline text-sm">Edit</span>
                          </button>
                          <button
                            onClick={() => openPasswordModal(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1.5 font-medium"
                            title="Change password"
                          >
                            <FiLock className="text-base" />
                            <span className="hidden lg:inline text-sm">Password</span>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1.5 font-medium"
                            title="Delete user"
                          >
                            <FiTrash2 className="text-base" />
                            <span className="hidden lg:inline text-sm">Delete</span>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform animate-slideUp">
              <div className="bg-green-600 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiLock className="text-2xl" />
                    Change Password
                  </h3>
                  <button
                    onClick={closePasswordModal}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    value={passwordChange.current_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    value={passwordChange.new_password}
                    onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={closePasswordModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  <FiCheck />
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
