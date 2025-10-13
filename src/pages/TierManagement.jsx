// src/pages/TierManagement.jsx
import React, { useEffect, useState, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Users,
  Layers,
  BarChart3,
  Crown,
} from 'lucide-react';
import AddTierModal from '../components/AddTierModal';
import AddLevelModal from '../components/AddLevelModal';

// API endpoints
const TIER_STRUCTURE_API = API_ENDPOINTS.TIER_STRUCTURE;    // levels per tier (no id)
const RESET_DEFAULT_API = API_ENDPOINTS.RESET_DEFAULT;
const TIER_STATISTICS_API = API_ENDPOINTS.TIER_STATISTICS;
// Per-level edit endpoints
const UPDATE_LEVEL_API = API_ENDPOINTS.UPDATE_LEVEL_PROPERTIES;
const DELETE_LEVEL_API = API_ENDPOINTS.DELETE_LEVEL;
// TIERS base: supports GET list (with ids) and DELETE /{id}
const TIERS_API_BASE = API_ENDPOINTS.DELETE_TIER;

/* ------------ Helpers: normalize structure (UI shape) ------------ */
function normalizeStructure(structure) {
  const next = {};
  for (const [tier, levels] of Object.entries(structure || {})) {
    next[tier] = (levels || []).map((l, idx) => ({
      levelId: l.levelId ?? l.id ?? l.level_id ?? null,
      level: Number(l.level ?? l.levelNumber ?? idx + 1),
      referrals: num(l.referrals ?? l.requiredReferrals, 0),
      reward: str(l.reward ?? l.rewardName, ''),
      _deleted: false, // local marker when user removes before save
    }));
  }
  return next;
}

function snapshotById(structure) {
  const snap = {};
  for (const levels of Object.values(structure || {})) {
    for (const l of levels) {
      if (l.levelId) {
        snap[l.levelId] = { referrals: l.referrals, reward: l.reward };
      }
    }
  }
  return snap;
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v, d = '') => (v == null ? d : String(v));
const lc = (s) => String(s || '').trim().toLowerCase();

export default function TierManagement() {
  const [tierStructure, setTierStructure] = useState(null);
  const [tierInfo, setTierInfo] = useState({}); // { [tierName]: { id } } <- from TIERS_API_BASE GET
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [showAddLevelModal, setShowAddLevelModal] = useState(false);
  const [selectedTierForLevel, setSelectedTierForLevel] = useState(null);

  // Toast
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const popupTimerRef = useRef(null);

  // Keep an original snapshot to compute diffs on Save
  const originalRef = useRef({}); // { [levelId]: { referrals, reward } }

  useEffect(() => {
    loadData();
    return () => { if (popupTimerRef.current) clearTimeout(popupTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all needed data (structure has NO ids; tiers list has ids)
      const [structureRes, tiersRes, statsRes] = await Promise.all([
        fetch(TIER_STRUCTURE_API, { headers }),
        fetch(TIERS_API_BASE, { headers }),                // <-- source of tier ids
        fetch(TIER_STATISTICS_API, { headers }),
      ]);

      // Structure
      if (structureRes.ok) {
        const structureData = await structureRes.json();
        const normalized = normalizeStructure(structureData);
        setTierStructure(normalized);
        originalRef.current = snapshotById(normalized);
      } else {
        console.error('Failed to load tier structure:', structureRes.status);
        setTierStructure(null);
      }

      // Tier IDs from TIERS_API_BASE (array expected)
      if (tiersRes.ok) {
        const tiersList = (await tiersRes.json().catch(() => [])) || [];
        // Build { nameLc -> id } map, then map to { [displayNameFromStructure]: { id } }
        const idByNameLc = new Map(
          Array.isArray(tiersList)
            ? tiersList.map((t) => [lc(t.name || t.tierName), t.id ?? t.tierId ?? null])
            : []
        );

        // If we already have structure, build info keyed by structure's names
        setTierInfo((prev) => {
          const info = {};
          if (tierStructure) {
            for (const tierName of Object.keys(tierStructure)) {
              info[tierName] = { id: idByNameLc.get(lc(tierName)) || null };
            }
          }
          return info;
        });
      } else {
        console.warn('Failed to load tiers (for ids):', tiersRes.status);
        setTierInfo({});
      }

      // Stats
      setStatistics(statsRes.ok ? (await statsRes.json()) || {} : {});
    } catch (e) {
      console.error('TierManagement load error:', e);
      setTierStructure(null);
      setTierInfo({});
      setStatistics({});
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    if (!tierStructure) return;

    try {
      setSaving(true);
      const token = getToken();

      // Build ops
      const deletes = [];
      const patches = [];

      for (const levels of Object.values(tierStructure)) {
        levels.forEach((l) => {
          if (l.levelId) {
            if (l._deleted) {
              deletes.push(l.levelId);
            } else {
              const orig = originalRef.current[l.levelId] || {};
              const changed = {};
              if (l.referrals !== orig.referrals) changed.requiredReferrals = num(l.referrals, 0);
              if (str(l.reward).trim() !== str(orig.reward).trim()) changed.rewardName = str(l.reward).trim();
              if (Object.keys(changed).length > 0) {
                patches.push({ id: l.levelId, body: changed });
              }
            }
          }
        });
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      if (deletes.length) {
        await Promise.allSettled(
          deletes.map((id) => fetch(`${DELETE_LEVEL_API}/${id}`, { method: 'DELETE', headers }))
        );
      }

      if (patches.length) {
        await Promise.allSettled(
          patches.map(({ id, body }) =>
            fetch(`${UPDATE_LEVEL_API}/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
          )
        );
      }

      await loadData();
      alert('Changes saved successfully!');
    } catch (e) {
      console.error('Save error:', e);
      alert('Error saving changes: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefault() {
    if (!window.confirm('Reset to default tier structure? This will overwrite current settings.')) return;
    try {
      setSaving(true);
      const token = getToken();
      const res = await fetch(RESET_DEFAULT_API, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
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

  /* ---------------- Delete Tier (ids from TIERS_API_BASE) ---------------- */
  const handleDeleteTier = async (tierName) => {
    const tierId = tierInfo?.[tierName]?.id;
    if (!tierId) {
      alert('Tier id not found for this tier.');
      return;
    }
    if (!window.confirm(`Delete the "${tierName}" tier? This will remove the entire tier.`)) return;

    try {
      setSaving(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${TIERS_API_BASE}/${tierId}`, { method: 'DELETE', headers });

      if ([200, 202, 204].includes(res.status)) {
        // Update UI immediately
        setTierStructure((prev) => {
          const next = { ...prev };
          delete next[tierName];
          return next;
        });
        setTierInfo((prev) => {
          const next = { ...prev };
          delete next[tierName];
          return next;
        });
        setStatistics((prev) => {
          if (!prev || !prev[tierName]) return prev;
          const nxt = { ...prev };
          delete nxt[tierName];
          return nxt;
        });
        showToast(`🗑️ "${tierName}" tier deleted`);
      } else {
        let msg = `Failed to delete tier (HTTP ${res.status})`;
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const j = await res.json();
            msg = j.error || j.message || msg;
          } else {
            const t = await res.text();
            if (t) msg = t;
          }
        } catch {}
        alert(msg);
      }
    } catch (e) {
      alert(`Error deleting tier: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Local-only UI edits ---------------- */
  const addLevel = (tierName) => {
    setTierStructure((prev) => {
      const next = { ...prev };
      const levels = [...(next[tierName] || [])];
      const newLevelNumber = levels.length + 1;
      levels.push({
        levelId: null, // not persisted
        level: newLevelNumber,
        referrals: 0,
        reward: '',
        _deleted: false,
      });
      next[tierName] = levels;
      return next;
    });
    showToast('Level added locally (use Add Level modal to persist).');
  };

  const removeLevel = (tierName, levelIndex) => {
    if (!window.confirm('Remove this level?')) return;

    setTierStructure((prev) => {
      const next = { ...prev };
      const levels = [...(next[tierName] || [])];
      const l = levels[levelIndex];

      if (l.levelId) {
        levels[levelIndex] = { ...l, _deleted: true };
      } else {
        levels.splice(levelIndex, 1);
      }

      const visible = levels.filter((x) => !x._deleted);
      const renumbered = visible.map((lvl, i) => ({ ...lvl, level: i + 1 }));
      const deletedOnes = levels.filter((x) => x._deleted);
      next[tierName] = [...renumbered, ...deletedOnes];
      return next;
    });

    showToast('Level removed (pending Save)');
  };

  const updateLocalLevelField = (tierName, index, field, rawValue) => {
    setTierStructure((prev) => {
      const next = { ...prev };
      const levels = [...(next[tierName] || [])];
      const lvl = { ...levels[index] };

      if (lvl._deleted) return prev;

      if (field === 'reward') {
        lvl.reward = rawValue;
      } else if (field === 'referrals') {
        const n = Number(rawValue);
        lvl.referrals = Number.isFinite(n) ? n : 0;
      }

      levels[index] = lvl;
      next[tierName] = levels;
      return next;
    });
  };

  const handleTierCreated = () => { showToast('✅ Tier created!'); loadData(); };
  const handleLevelCreated = () => { showToast('✅ Level created!'); loadData(); };

  const showToast = (message = '✅ Done') => {
    setPopupMessage(message);
    setShowPopup(true);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => setShowPopup(false), 2200);
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
      {/* Toast */}
      {showPopup && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999]
                     bg-[rgb(var(--card))] text-[rgb(var(--fg))]
                     border border-[rgb(var(--border))]
                     rounded-xl shadow-2xl px-6 py-3 text-base font-semibold"
          role="status" aria-live="polite"
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
            (s, lvls) => s + (lvls?.length || 0),
            0
          )}
          accent="text-orange-600"
        />
      </div>

      {/* Tier Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(tierStructure).map(([tierName, levels]) => (
          <div key={tierName} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">
                {tierEmoji(tierName)} {tierName} Tier
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddLevelModal(tierName, setSelectedTierForLevel, setShowAddLevelModal)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
                >
                  <Plus className="w-4 h-4" /> Add Level
                </button>
                <button
                  onClick={() => handleDeleteTier(tierName)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-rose-700 hover:bg-[rgba(244,63,94,0.08)] disabled:opacity-50"
                  title="Delete Tier"
                >
                  <Trash2 className="w-4 h-4" />

                </button>
              </div>
            </div>

            <div className="space-y-3">
              {levels.filter(l => !l._deleted).map((level, index) => (
                <div key={`${tierName}-${index}`} className="rounded-lg border border-[rgb(var(--border))] p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Level {level.level}</span>
                    <button
                      onClick={() => removeLevel(tierName, index)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgba(220,38,38,0.12)] text-red-700 hover:bg-[rgba(220,38,38,0.2)]"
                      title="Remove level"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Referrals Required"
                      type="number"
                      min={0}
                      value={level.referrals}
                      selectOnFocus
                      onChange={(v) => updateLocalLevelField(tierName, index, 'referrals', v)}
                    />
                    <Field
                      label="Reward"
                      type="text"
                      value={level.reward}
                      placeholder="No Reward"
                      onChange={(v) => updateLocalLevelField(tierName, index, 'reward', v)}
                    />
                  </div>

                  {statistics && statistics[tierName]?.levels?.[index] && (
                    <div className="mt-3 text-sm opacity-70">
                      Users at this level: {statistics[tierName].levels[index]?.userCount || 0}
                    </div>
                  )}
                </div>
              ))}

              {levels.filter(l => !l._deleted).length === 0 && (
                <div className="rounded-lg border border-[rgb(var(--border))] p-4 text-sm opacity-70 text-center">
                  No levels yet. Click <span className="font-medium">Add Level</span> to create one.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      {statistics && Object.keys(statistics).length > 0 && (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="text-lg font-semibold mb-4">Tier Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(statistics).map(([tierName, tierStats]) => (
              <div key={tierName} className="rounded-lg border border-[rgb(var(--border))] p-3">
                <h4 className="font-medium capitalize">{tierEmoji(tierName)} {tierName} Tier</h4>
                <p className="text-sm opacity-70">Total Users: {tierStats.totalUsers || 0}</p>
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
        onClose={() => { setShowAddLevelModal(false); setSelectedTierForLevel(null); }}
        onSuccess={handleLevelCreated}
        tierName={selectedTierForLevel}
      />
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, min, placeholder, selectOnFocus = false }) {
  return (
    <label className="block">
      <div className="text-sm opacity-80 mb-1">{label}</div>
      <input
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if (selectOnFocus) {
            requestAnimationFrame(() => e.target.select());
          }
        }}
        onWheel={(e) => type === 'number' && e.target.blur()}
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

function getToken() {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw).accessToken : '';
  } catch {
    return '';
  }
}

/* ---------------- Util for opening the AddLevel modal ---------------- */
function openAddLevelModal(tierName, setSelectedTierForLevel, setShowAddLevelModal) {
  setSelectedTierForLevel(tierName);
  setShowAddLevelModal(true);
}
