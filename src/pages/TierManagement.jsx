import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

// API endpoints
const TIER_STRUCTURE_API = API_ENDPOINTS.TIER_STRUCTURE;
const UPDATE_STRUCTURE_API = API_ENDPOINTS.UPDATE_STRUCTURE;
const RESET_DEFAULT_API = API_ENDPOINTS.RESET_DEFAULT;
const TIER_STATISTICS_API = API_ENDPOINTS.TIER_STATISTICS;

export default function TierManagement() {
  const [tierStructure, setTierStructure] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading tier management data...');
      
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      
      // Load tier structure
      const structureRes = await fetch(TIER_STRUCTURE_API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (structureRes.ok) {
        const structureData = await structureRes.json();
        console.log('✅ Tier structure loaded:', structureData);
        setTierStructure(structureData);
      } else {
        console.error('❌ Failed to load tier structure:', structureRes.status);
      }

      // Load statistics
      const statsRes = await fetch(TIER_STATISTICS_API, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('✅ Tier statistics loaded:', statsData);
        setStatistics(statsData);
      } else {
        console.error('❌ Failed to load tier statistics:', statsRes.status);
      }
      
    } catch (error) {
      console.error('💥 Error loading tier management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving tier structure changes...');
      
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      
      const response = await fetch(UPDATE_STRUCTURE_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tierStructure)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tier structure saved successfully:', result);
        
        // Update local state with the saved structure
        if (result.structure) {
          setTierStructure(result.structure);
          console.log('✅ Local state updated with saved structure');
        }
        
        alert('Tier structure updated successfully!');
        await loadData(); // Reload data
      } else {
        const error = await response.json();
        console.error('❌ Failed to save tier structure:', error);
        alert('Failed to save tier structure: ' + (error.error || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('💥 Error saving tier structure:', error);
      alert('Error saving tier structure: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!confirm('Are you sure you want to reset to default tier structure? This will overwrite all current settings.')) {
      return;
    }

    try {
      setSaving(true);
      console.log('🔄 Resetting to default tier structure...');
      
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      
      const response = await fetch(RESET_DEFAULT_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tier structure reset successfully:', result);
        alert('Tier structure reset to default!');
        await loadData(); // Reload data
      } else {
        const error = await response.json();
        console.error('❌ Failed to reset tier structure:', error);
        alert('Failed to reset tier structure: ' + (error.error || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('💥 Error resetting tier structure:', error);
      alert('Error resetting tier structure: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateLevel = (tierName, levelIndex, field, value) => {
    setTierStructure(prev => {
      const newStructure = { ...prev };
      const tier = [...newStructure[tierName]];
      tier[levelIndex] = { ...tier[levelIndex], [field]: value };
      newStructure[tierName] = tier;
      return newStructure;
    });
  };

  const addLevel = (tierName) => {
    setTierStructure(prev => {
      const newStructure = { ...prev };
      const tier = [...newStructure[tierName]];
      const newLevelNumber = tier.length + 1;
      tier.push({
        level: newLevelNumber,
        referrals: 0,
        reward: 'New Reward'
      });
      newStructure[tierName] = tier;
      return newStructure;
    });
  };

  const removeLevel = (tierName, levelIndex) => {
    if (!confirm('Are you sure you want to remove this level?')) {
      return;
    }

    setTierStructure(prev => {
      const newStructure = { ...prev };
      const tier = [...newStructure[tierName]];
      tier.splice(levelIndex, 1);
      // Renumber levels
      tier.forEach((level, index) => {
        level.level = index + 1;
      });
      newStructure[tierName] = tier;
      return newStructure;
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading tier management...</div>
      </div>
    );
  }

  if (!tierStructure) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Failed to load tier structure</div>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Tier Management</h1>
          <p className="text-sm opacity-70">Manage referral rewards structure and tier levels</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Reset to Default
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tier Structure Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(tierStructure).map(([tierName, levels]) => (
          <div key={tierName} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold capitalize">{tierName} Tier</h3>
              <button
                onClick={() => addLevel(tierName)}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Add Level
              </button>
            </div>

            <div className="space-y-3">
              {levels.map((level, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Level {level.level}</span>
                    <button
                      onClick={() => removeLevel(tierName, index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Referrals Required</label>
                    <input
                      type="number"
                      value={level.referrals}
                      onChange={(e) => updateLevel(tierName, index, 'referrals', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Reward</label>
                    <input
                      type="text"
                      value={level.reward}
                      onChange={(e) => updateLevel(tierName, index, 'reward', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {statistics && statistics[tierName] && statistics[tierName].levels && (
                    <div className="text-sm text-gray-600">
                      Users at this level: {statistics[tierName].levels[index]?.userCount || 0}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Tier Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(statistics).map(([tierName, tierStats]) => (
              <div key={tierName} className="border rounded p-3">
                <h4 className="font-medium capitalize">{tierName} Tier</h4>
                <p className="text-sm text-gray-600">Total Users: {tierStats.totalUsers || 0}</p>
                <div className="mt-2 space-y-1">
                  {tierStats.levels?.map((level, index) => (
                    <div key={index} className="text-xs">
                      Level {level.level}: {level.userCount || 0} users
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
