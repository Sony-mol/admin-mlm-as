import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Search, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState({
    rewardName: '',
    rewardType: 'GIFT',
    rewardValue: 0,
    description: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.GET_ALL_REWARDS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }

      const data = await response.json();
      setRewards(data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      alert('Failed to fetch rewards: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingReward ? `${API_ENDPOINTS.UPDATE_REWARD}/${editingReward.id}` : API_ENDPOINTS.CREATE_REWARD;
      const method = editingReward ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reward');
      }

      await fetchRewards();
      setShowModal(false);
      setEditingReward(null);
      setFormData({
        rewardName: '',
        rewardType: 'GIFT',
        rewardValue: 0,
        description: ''
      });
      
      alert(editingReward ? 'Reward updated successfully!' : 'Reward created successfully!');
    } catch (error) {
      console.error('Error saving reward:', error);
      alert('Failed to save reward: ' + error.message);
    }
  };

  const handleEdit = (reward) => {
    setEditingReward(reward);
    setFormData({
      rewardName: reward.rewardName || '',
      rewardType: reward.rewardType || 'GIFT',
      rewardValue: reward.rewardValue || 0,
      description: reward.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (rewardId, rewardName) => {
    if (!confirm(`Are you sure you want to delete the reward "${rewardName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.DELETE_REWARD}/${rewardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reward');
      }

      await fetchRewards();
      alert('Reward deleted successfully!');
    } catch (error) {
      console.error('Error deleting reward:', error);
      alert('Failed to delete reward: ' + error.message);
    }
  };

  const openCreateModal = () => {
    setEditingReward(null);
    setFormData({
      rewardName: '',
      rewardType: 'GIFT',
      rewardValue: 0,
      description: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReward(null);
    setFormData({
      rewardName: '',
      rewardType: 'GIFT',
      rewardValue: 0,
      description: ''
    });
  };

  const filteredRewards = rewards.filter(reward =>
    reward.rewardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reward.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reward.rewardType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRewardTypeColor = (type) => {
    switch (type) {
      case 'CASH': return 'bg-green-100 text-green-800';
      case 'GIFT': return 'bg-blue-100 text-blue-800';
      case 'DISCOUNT': return 'bg-yellow-100 text-yellow-800';
      case 'POINTS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Rewards Management</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Manage system rewards and incentives</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Reward
        </button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search rewards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={fetchRewards}
            className="flex items-center gap-2 px-3 py-2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--fg))] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="text-sm text-[rgb(var(--muted-foreground))]">
            {filteredRewards.length} of {rewards.length} rewards
          </div>
        </div>
      </div>

      {/* Rewards Table */}
      <div className="bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgb(var(--muted))] border-b border-[rgb(var(--border))]">
              <tr>
                <th className="text-left p-4 font-medium text-[rgb(var(--fg))]">ID</th>
                <th className="text-left p-4 font-medium text-[rgb(var(--fg))]">Reward Name</th>
                <th className="text-left p-4 font-medium text-[rgb(var(--fg))]">Type</th>
                <th className="text-left p-4 font-medium text-[rgb(var(--fg))]">Value</th>
                <th className="text-left p-4 font-medium text-[rgb(var(--fg))]">Description</th>
                <th className="text-left p-4 font-medium text-[rgb(var(--fg))]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRewards.map((reward) => (
                <tr key={reward.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]">
                  <td className="p-4 text-[rgb(var(--muted-foreground))]">#{reward.id}</td>
                  <td className="p-4 font-medium text-[rgb(var(--fg))]">{reward.rewardName || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRewardTypeColor(reward.rewardType)}`}>
                      {reward.rewardType}
                    </span>
                  </td>
                  <td className="p-4 text-[rgb(var(--fg))]">
                    {reward.rewardValue ? `₹${reward.rewardValue.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="p-4 text-[rgb(var(--muted-foreground))] max-w-xs truncate">
                    {reward.description || 'No description'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(reward)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Reward"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id, reward.rewardName)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[rgb(var(--muted-foreground))]">
              {searchTerm ? 'No rewards found matching your search.' : 'No rewards available.'}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[rgb(var(--card))] rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-4">
              {editingReward ? 'Edit Reward' : 'Create New Reward'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                  Reward Name *
                </label>
                <input
                  type="text"
                  value={formData.rewardName}
                  onChange={(e) => handleInputChange('rewardName', e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                  Reward Type *
                </label>
                <select
                  value={formData.rewardType}
                  onChange={(e) => handleInputChange('rewardType', e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="GIFT">Gift</option>
                  <option value="CASH">Cash</option>
                  <option value="DISCOUNT">Discount</option>
                  <option value="POINTS">Points</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                  Reward Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rewardValue}
                  onChange={(e) => handleInputChange('rewardValue', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--fg))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingReward ? 'Update Reward' : 'Create Reward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
