// src/pages/TierManagement.jsx
import React, { useEffect, useState, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Plus, Trash2, Save, RotateCcw, Loader2, Users, Layers, BarChart3, Crown } from 'lucide-react';
import AddTierModal from '../components/AddTierModal';
import AddLevelModal from '../components/AddLevelModal';

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

  // Modal states
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [showAddLevelModal, setShowAddLevelModal] = useState(false);
  const [selectedTierForLevel, setSelectedTierForLevel] = useState(null);

  // Toast popup (viewport-level)
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const popupTimerRef = useRef(null);

  // Load structure + stats
  useEffect(() => {
    loadData();
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      // Load tier structure
      const structureRes = await fetch(TIER_STRUCTURE_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (structureRes.ok) {
        const structureData = await structureRes.json();
        setTierStructure(structureData);
      } else {
        console.error('Failed to load tier structure:', structureRes.status);
        setTierStructure(null);
      }

      // Load statistics
      const statsRes = await fetch(TIER_STATISTICS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData || {});
      } else {
        console.error('Failed to load statistics:', statsRes.status);
        setStatistics({});
      }
    } catch (e) {
      console.error('TierManagement load error:', e);
      setTierStructure(null);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      const res = await fetch(UPDATE_STRUCTURE_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tierStructure),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.structure) setTierStructure(result.structure);
        alert('Tier structure updated successfully!');
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to save tier structure: ' + (err.error || res.status));
      }
    } catch (e) {
      alert('Error saving tier structure: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefault() {
    if (!window.confirm('Reset to default tier structure? This will overwrite current settings.')) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      const res = await fetch(RESET_DEFAULT_API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Tier structure reset to default!');
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to reset: ' + (err.error || res.status));
      }
    } catch (e) {
      alert('Error resetting structure: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  // Update helpers
  const updateLevel = async (tierName, levelIndex, field, value) => {
    const level = tierStructure[tierName][levelIndex];
    if (!level.levelId) {
      console.warn('Level ID not found, cannot update individual level');
      return;
    }

    try {
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      const updateData = {};
      if (field === 'referrals') {
        updateData.requiredReferrals = value;
      } else if (field === 'reward') {
        updateData.rewardName = value;
      }

      const response = await fetch(`${API_ENDPOINTS.UPDATE_LEVEL_PROPERTIES}/${level.levelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Update local state
        setTierStructure((prev) => {
          const next = { ...prev };
          const levels = [...(next[tierName] || [])];
          levels[levelIndex] = { ...levels[levelIndex], [field]: value };
          next[tierName] = levels;
          return next;
        });
        showToast(`✅ Level ${level.level} updated!`);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to update level: ${error.error || response.status}`);
      }
    } catch (error) {
      console.error('Error updating level:', error);
      alert(`Error updating level: ${error.message}`);
    }
  };

  const addLevel = (tierName) => {
    setTierStructure((prev) => {
      const next = { ...prev };
      const levels = [...(next[tierName] || [])];
      const newLevelNumber = levels.length + 1;
      levels.push({
        level: newLevelNumber,
        referrals: 0,
        reward: 'Custom Reward',
      });
      next[tierName] = levels;
      return next;
    });
  };

  const removeLevel = async (tierName, levelIndex) => {
    const level = tierStructure[tierName][levelIndex];
    if (!level.levelId) {
      console.warn('Level ID not found, cannot delete level');
      return;
    }

    if (!window.confirm('Remove this level?')) return;

    try {
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      const response = await fetch(`${API_ENDPOINTS.DELETE_LEVEL}/${level.levelId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setTierStructure((prev) => {
          const next = { ...prev };
          const levels = [...(next[tierName] || [])];
          levels.splice(levelIndex, 1);
          // Renumber
          levels.forEach((lvl, i) => (lvl.level = i + 1));
          next[tierName] = levels;
          return next;
        });
        showToast(`✅ Level ${level.level} removed!`);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to delete level: ${error.error || response.status}`);
      }
    } catch (error) {
      console.error('Error deleting level:', error);
      alert(`Error deleting level: ${error.message}`);
    }
  };

  // Show toast helper
  const showToast = (message = '✅ Level added!') => {
    setPopupMessage(message);
    setShowPopup(true);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => setShowPopup(false), 2500);
  };

  // Handle tier creation success
  const handleTierCreated = (newTier) => {
    showToast(`✅ ${newTier.name} tier created!`);
    loadData(); // Reload data to show new tier
  };

  // Handle level creation success
  const handleLevelCreated = (newLevel) => {
    showToast(`✅ Level ${newLevel.levelNumber} created!`);
    loadData(); // Reload data to show new level
  };

  // Open add level modal for specific tier
  const openAddLevelModal = (tierName) => {
    setSelectedTierForLevel(tierName);
    setShowAddLevelModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading tier management…</span>
        </div>
      </div>
    );
  }

  if (!tierStructure) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <div className="font-semibold mb-2">Failed to load tier structure</div>
          <button
            onClick={loadData}
            className="rounded-lg px-4 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-[rgb(var(--fg))]">
      {/* Viewport Toast */}
      {showPopup && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999]
                     bg-[rgb(var(--card))] text-[rgb(var(--fg))]
                     border border-[rgb(var(--border))]
                     rounded-xl shadow-2xl px-6 py-3 text-base font-semibold
                     transition-all duration-300 ease-out"
          role="status"
          aria-live="polite"
        >
          {popupMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tier Management</h1>
          <p className="text-sm opacity-70">Manage referral rewards structure and tier levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddTierModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
          >
            <Crown className="w-4 h-4" />
            Add Tier
          </button>
          <button
            onClick={resetToDefault}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title="Total Users"
          value={
            Object.values(statistics || {}).reduce(
              (sum, tierStats) => sum + (tierStats?.totalUsers || 0),
              0
            ) || 0
          }
          accent="text-green-600"
        />
        <StatCard
          icon={Layers}
          title="Tiers"
          value={Object.keys(tierStructure || {}).length}
          accent="text-purple-600"
        />
        <StatCard
          icon={BarChart3}
          title="Total Levels"
          value={Object.values(tierStructure || {}).reduce(
            (sum, levels) => sum + (levels?.length || 0),
            0
          )}
          accent="text-orange-600"
        />
      </div>

      {/* Tier Structure Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(tierStructure).map(([tierName, levels]) => (
          <div key={tierName} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">
                {tierEmoji(tierName)} {tierName} Tier
              </h3>
              <button
                onClick={() => openAddLevelModal(tierName)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
              >
                <Plus className="w-4 h-4" />
                Add Level
              </button>
            </div>

            <div className="space-y-3">
              {levels.map((level, index) => (
                <div
                  key={`${tierName}-${index}`}
                  className="rounded-lg border border-[rgb(var(--border))] p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Level {level.level}</span>
                    <button
                      onClick={() => removeLevel(tierName, index)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgba(220,38,38,0.12)] text-red-700 hover:bg-[rgba(220,38,38,0.2)]"
                      title="Remove level"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Referrals Required"
                      type="number"
                      min={0}
                      value={level.referrals || 0}
                      onChange={async (v) => {
                        const numValue = v ? Number(v) : 0;
                        await updateLevel(tierName, index, 'referrals', isNaN(numValue) ? 0 : numValue);
                      }}
                    />
                    <Field
                      label="Reward"
                      type="text"
                      value={level.reward || ''}
                      onChange={async (v) => {
                        // Don't send empty or whitespace-only reward names
                        if (!v || v.trim() === '') {
                          await updateLevel(tierName, index, 'reward', 'No Reward');
                        } else {
                          await updateLevel(tierName, index, 'reward', v.trim());
                        }
                      }}
                    />
                  </div>

                  {/* Inline stats (if available) */}
                  {statistics &&
                    statistics[tierName] &&
                    statistics[tierName].levels &&
                    statistics[tierName].levels[index] && (
                      <div className="mt-3 text-sm opacity-70">
                        Users at this level:{' '}
                        {statistics[tierName].levels[index]?.userCount || 0}
                      </div>
                    )}
                </div>
              ))}

              {levels.length === 0 && (
                <div className="rounded-lg border border-[rgb(var(--border))] p-4 text-sm opacity-70 text-center">
                  No levels yet. Click <span className="font-medium">Add Level</span> to create one.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Summary */}
      {statistics && Object.keys(statistics).length > 0 && (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="text-lg font-semibold mb-4">Tier Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(statistics).map(([tierName, tierStats]) => (
              <div key={tierName} className="rounded-lg border border-[rgb(var(--border))] p-3">
                <h4 className="font-medium capitalize mb-1">
                  {tierEmoji(tierName)} {tierName} Tier
                </h4>
                <p className="text-sm opacity-70">
                  Total Users: {tierStats.totalUsers || 0}
                </p>
                <div className="mt-2 space-y-1">
                  {(tierStats.levels || []).map((lvl, i) => (
                    <div key={i} className="text-xs opacity-80">
                      Level {lvl.level}: {lvl.userCount || 0} users
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddTierModal
        isOpen={showAddTierModal}
        onClose={() => setShowAddTierModal(false)}
        onSuccess={handleTierCreated}
      />

      <AddLevelModal
        isOpen={showAddLevelModal}
        onClose={() => {
          setShowAddLevelModal(false);
          setSelectedTierForLevel(null);
        }}
        onSuccess={handleLevelCreated}
        tierName={selectedTierForLevel}
      />
    </div>
  );
}

/* ---------- Tiny UI bits ---------- */
function Field({ label, type = 'text', value, onChange, min }) {
  return (
    <label className="block">
      <div className="text-sm opacity-80 mb-1">{label}</div>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </label>
  );
}

function StatCard({ icon: Icon, title, value, accent }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-70">{title}</div>
          <div className={`text-2xl font-semibold ${accent || ''}`}>{value}</div>
        </div>
        {Icon && <Icon className={`w-7 h-7 ${accent || 'text-blue-600'}`} />}
      </div>
    </div>
  );
}

function tierEmoji(name = '') {
  const key = name.toUpperCase();
  if (key.includes('BRONZE')) return '🥉';
  if (key.includes('SILVER')) return '🥈';
  if (key.includes('GOLD')) return '🥇';
  if (key.includes('PLATINUM')) return '💎';
  return '🏷️';
}
