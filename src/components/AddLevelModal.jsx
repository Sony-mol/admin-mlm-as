import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function AddLevelModal({ isOpen, onClose, onSuccess, tierName }) {
  const [formData, setFormData] = useState({
    levelNumber: 1,
    requiredReferrals: 0,
    rewardName: '',
    rewardType: 'GIFT'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tiers, setTiers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load tiers and rewards when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      // Load tiers
      const tiersRes = await fetch(API_ENDPOINTS.GET_ALL_TIERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData);
        
        // Set default tier if tierName is provided
        if (tierName && tiersData.length > 0) {
          const selectedTier = tiersData.find(tier => 
            tier.name.toLowerCase() === tierName.toLowerCase()
          );
          if (selectedTier) {
            setFormData(prev => ({ ...prev, tierId: selectedTier.id }));
          }
        }
      }

      // Load rewards
      const rewardsRes = await fetch(API_ENDPOINTS.GET_ALL_REWARDS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load tiers and rewards');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tierId) {
      setError('Please select a tier');
      return;
    }
    if (!formData.levelNumber || formData.levelNumber < 1) {
      setError('Level number must be at least 1');
      return;
    }
    if (!formData.requiredReferrals || formData.requiredReferrals < 0) {
      setError('Required referrals must be 0 or greater');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      // First, create or find the reward if provided
      let rewardId = null;
      if (formData.rewardName.trim()) {
        const existingReward = rewards.find(r => 
          r.rewardName.toLowerCase() === formData.rewardName.trim().toLowerCase()
        );
        
        if (existingReward) {
          rewardId = existingReward.id;
        } else {
          // Create new reward
          const rewardRes = await fetch(API_ENDPOINTS.CREATE_REWARD, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              rewardName: formData.rewardName.trim(),
              rewardType: formData.rewardType,
              description: `Reward for ${tierName} tier level ${formData.levelNumber}`
            }),
          });
          
          if (rewardRes.ok) {
            const newReward = await rewardRes.json();
            rewardId = newReward.id;
          }
        }
      }

      // Get the selected tier
      const selectedTier = tiers.find(tier => tier.id === formData.tierId);
      if (!selectedTier) {
        setError('Selected tier not found');
        return;
      }

      // Create the level
      const levelRes = await fetch(API_ENDPOINTS.CREATE_LEVEL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          levelNumber: formData.levelNumber,
          requiredReferrals: formData.requiredReferrals,
          tierId: selectedTier.id,
          rewardId: rewardId
        }),
      });

      if (levelRes.ok) {
        const newLevel = await levelRes.json();
        onSuccess(newLevel);
        handleClose();
      } else {
        const errorData = await levelRes.json().catch(() => ({}));
        setError(errorData.error || 'Failed to create level');
      }
    } catch (err) {
      setError('Error creating level: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      levelNumber: 1,
      requiredReferrals: 0,
      rewardName: '',
      rewardType: 'GIFT'
    });
    setError('');
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">
            Add New Level {tierName && `to ${tierName} Tier`}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[rgba(var(--fg),0.1)] rounded-lg"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                Tier *
              </label>
              <select
                value={formData.tierId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('tierId', value ? parseInt(value) : null);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="">Select a tier</option>
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name} {tier.description && `- ${tier.description}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                  Level Number *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.levelNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('levelNumber', value ? parseInt(value) : 1);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                  Required Referrals *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.requiredReferrals}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('requiredReferrals', value ? parseInt(value) : 0);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                Reward Name
              </label>
              <input
                type="text"
                value={formData.rewardName}
                onChange={(e) => handleInputChange('rewardName', e.target.value)}
                placeholder="e.g., iPhone, Cash Prize, etc."
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
                Reward Type
              </label>
              <select
                value={formData.rewardType}
                onChange={(e) => handleInputChange('rewardType', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="GIFT">Gift</option>
                <option value="CASH">Cash</option>
                <option value="DISCOUNT">Discount</option>
                <option value="POINTS">Points</option>
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.tierId}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Level
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
