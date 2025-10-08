import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Key, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';

import { API_ENDPOINTS } from '../config/api';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN'
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.ADMINS);
      if (response.ok) {
        const data = await response.json();
        setAdmins(Array.isArray(data) ? data : []);
      } else {
        // mock fallback
        setAdmins([{
          id: 1,
          name: 'Super Admin',
          email: 'admin@camgo.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }]);
      }
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      setActionLoading(true);
      setError(null);
      if (!formData.name || !formData.email || !formData.password) {
        setError('All fields are required'); return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match'); return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters'); return;
      }
      const response = await fetch(API_ENDPOINTS.CREATE_ADMIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });
      if (response.ok) {
        await response.json();
        setSuccess('Admin created successfully!');
        setShowCreateModal(false);
        resetForm();
        await fetchAdmins();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to create admin');
      }
    } catch {
      setError('Failed to create admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const response = await fetch(`${API_ENDPOINTS.USERS}/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role
        }),
      });
      if (response.ok) {
        setSuccess('Admin updated successfully!');
        setShowEditModal(false);
        resetForm();
        await fetchAdmins();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update admin');
      }
    } catch {
      setError('Failed to update admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setActionLoading(true);
      setError(null);
      if (!formData.password || formData.password !== formData.confirmPassword) {
        setError('Passwords do not match'); return;
      }
      const response = await fetch(`${API_ENDPOINTS.USERS}/${selectedAdmin.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: formData.password }),
      });
      if (response.ok) {
        setSuccess('Password changed successfully!');
        setShowPasswordModal(false);
        resetForm();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to change password');
      }
    } catch {
      setError('Failed to change password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      setActionLoading(true);
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const response = await fetch(`${API_ENDPOINTS.USERS}/${adminId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setSuccess(`Admin ${newStatus.toLowerCase()} successfully!`);
        await fetchAdmins();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update status');
      }
    } catch {
      setError('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'ADMIN' });
    setSelectedAdmin(null);
    setError(null);
    setSuccess(null);
  };

  const openCreateModal = () => { resetForm(); setShowCreateModal(true); };
  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({ name: admin.name, email: admin.email, password: '', confirmPassword: '', role: admin.role });
    setShowEditModal(true);
  };
  const openPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', role: '' });
    setShowPasswordModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-[rgb(var(--fg))]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-2">Admin Management</h1>
        <p className="opacity-70">Manage admin users and their credentials</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgba(34,197,94,0.12)]">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgba(239,68,68,0.12)]">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[rgb(var(--border))]">
            <thead className="bg-[rgba(var(--fg),0.05)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center opacity-70">
                    No admins found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[rgba(var(--fg),0.03)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{admin.name}</div>
                          <div className="text-sm opacity-70">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(admin.role)}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(admin.status)}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Admin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(admin)}
                          className="text-green-600 hover:text-green-900"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.status)}
                          className={admin.status === 'ACTIVE' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={admin.status === 'ACTIVE' ? 'Suspend Admin' : 'Activate Admin'}
                        >
                          {admin.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4 border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Admin</h3>
              <button onClick={() => setShowCreateModal(false)} className="opacity-60 hover:opacity-90">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                  placeholder="Enter admin email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.password ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, password: !showPasswords.password})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-80"
                  >
                    {showPasswords.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirmPassword: !showPasswords.confirmPassword})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-80"
                  >
                    {showPasswords.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                >
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-md border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.06)] hover:bg-[rgba(var(--fg),0.1)]">Cancel</button>
              <button onClick={handleCreateAdmin} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:opacity-90 disabled:opacity-50">
                {actionLoading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4 border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Admin</h3>
              <button onClick={() => setShowEditModal(false)} className="opacity-60 hover:opacity-90">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                >
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-md border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.06)] hover:bg-[rgba(var(--fg),0.1)]">Cancel</button>
              <button onClick={handleUpdateAdmin} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:opacity-90 disabled:opacity-50">
                {actionLoading ? 'Updating...' : 'Update Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4 border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="opacity-60 hover:opacity-90">✕</button>
            </div>

            <div className="mb-4">
              <p className="text-sm opacity-70">
                Changing password for: <strong>{selectedAdmin.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.password ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, password: !showPasswords.password})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-80"
                  >
                    {showPasswords.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium opacity-70 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirmPassword: !showPasswords.confirmPassword})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-80"
                  >
                    {showPasswords.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-md border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.06)] hover:bg-[rgba(var(--fg),0.1)]">
                Cancel
              </button>
              <button onClick={handleChangePassword} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:opacity-90 disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
