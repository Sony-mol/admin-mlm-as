import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_ENDPOINTS } from '../config/api';

// Real backend API endpoints
const COMMISSION_CONFIGS_API = API_ENDPOINTS.COMMISSION_CONFIGS;
const BULK_UPDATE_API = API_ENDPOINTS.BULK_UPDATE_CONFIGS;
const INITIALIZE_API = API_ENDPOINTS.INITIALIZE;
const SYSTEM_STATS_API = API_ENDPOINTS.SYSTEM_STATS;

/* ---------- Small UI helpers ---------- */
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] transition-colors ${className}`}>
    {children}
  </div>
);

const NumberInput = ({ label, value, onChange, min = 0, step = 1, suffix = "₹" }) => (
  <label className="block">
    <div className="text-sm opacity-80 mb-1">{label}</div>
    <div className="relative">
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] pr-10 transition-colors hover:border-[rgba(var(--accent-1),0.5)] text-[rgb(var(--fg))]"
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 text-sm">{suffix}</span>}
    </div>
  </label>
);

const TextBadge = ({ children }) => (
  <span className="rounded-full px-2 py-0.5 border border-[rgb(var(--border))] text-xs">{children}</span>
);

function Tabs({ value, onChange, items }) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-xl border border-[rgb(var(--border))] p-1 bg-[rgb(var(--card))]">
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition border
              ${active
                ? "bg-[rgba(var(--accent-1),0.15)] text-[rgb(var(--accent-1))] border-[rgba(var(--accent-1),0.35)] shadow-sm"
                : "hover:bg-[rgba(var(--fg),0.05)] border-transparent"
              }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Page ---------- */
export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("commissions");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Real backend data state
  const [commissionConfigs, setCommissionConfigs] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState(new Map());

  // snapshot of values after successful load/save
  const initialRef = useRef(null);

  // read ?tab on mount
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "commissions" || t === "levels") setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // write ?tab whenever it changes
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch commission configurations
      const configsRes = await fetch(COMMISSION_CONFIGS_API, { headers });
      if (configsRes.ok) {
        const configsJson = await configsRes.json();
        setCommissionConfigs(configsJson.configurations || {});
        initialRef.current = configsJson.configurations || {};
      } else {
        // Try to initialize if no configs exist
        if (configsRes.status === 404 || configsRes.status === 500) {
          const initRes = await fetch(INITIALIZE_API, { 
            method: 'POST', 
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
          if (initRes.ok) {
            const reloadRes = await fetch(COMMISSION_CONFIGS_API, { headers });
            if (reloadRes.ok) {
              const reloadJson = await reloadRes.json();
              setCommissionConfigs(reloadJson.configurations || {});
              initialRef.current = reloadJson.configurations || {};
            }
          }
        }
      }

      // Fetch system statistics
      const statsRes = await fetch(SYSTEM_STATS_API, { headers });
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setSystemStats(statsJson);
      }
      setErr(null);
    } catch (e) {
      setErr(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const dirty = useMemo(() => pendingUpdates.size > 0, [pendingUpdates]);

  async function save() {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const updates = Array.from(pendingUpdates.entries()).map(([configId, changes]) => ({
        configId: parseInt(configId),
        ...changes
      }));

      const response = await fetch(BULK_UPDATE_API, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setPendingUpdates(new Map());
      await load();
      alert(`Settings saved successfully! ${result.successCount} configurations updated.`);
    } catch (e) {
      alert("Save failed: " + (e.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setPendingUpdates(new Map());
  }

  const updateCommissionConfig = (configId, field, value) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(configId) || {};
      newMap.set(configId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const getCurrentValue = (configId, field, originalValue) =>
    (pendingUpdates.get(configId)?.[field] ?? originalValue);

  if (loading) {
    return <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 animate-pulse">Loading settings…</div>;
  }
  if (err) {
    return (
      <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]">
        <div className="font-semibold mb-1">Couldn’t load settings</div>
        <div className="text-sm opacity-80">{err}</div>
        <button onClick={load} className="mt-3 rounded px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[rgb(var(--fg))]">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <div className="flex items-center justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "commissions", label: "Commission Settings" },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={!dirty}
            className="rounded-lg px-3 py-2 border border-[rgb(var(--border))] disabled:opacity-40 hover:bg-[rgba(var(--fg),0.05)]"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-lg px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {tab === "commissions" && (
        <div className="space-y-6">
          {/* System Statistics */}
          {Object.keys(systemStats).length > 0 && (
            <Card className="p-5">
              <div className="text-lg font-semibold mb-4">📊 System Statistics</div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{systemStats.totalConfigurations || 0}</div>
                  <div className="text-sm opacity-70">Total Configurations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemStats.tierCounts ? Object.keys(systemStats.tierCounts).length : 0}</div>
                  <div className="text-sm opacity-70">Tiers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{systemStats.levelCounts ? Object.keys(systemStats.levelCounts).length : 0}</div>
                  <div className="text-sm opacity-70">Levels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{systemStats.averagePercentage ? systemStats.averagePercentage.toFixed(1) : 0}%</div>
                  <div className="text-sm opacity-70">Avg Commission</div>
                </div>
              </div>
            </Card>
          )}

          {/* Commission Configurations by Tier */}
          {Object.keys(commissionConfigs).map(tierName => (
            <Card key={tierName} className="p-5">
              <div className="text-lg font-semibold mb-4">
                {tierName === 'BRONZE' ? '🥉' : tierName === 'SILVER' ? '🥈' : '🥇'} {tierName} Tier Commission Structure
              </div>

              {Object.keys(commissionConfigs[tierName]).map(levelKey => (
                <div key={levelKey} className="mb-6">
                  <div className="text-md font-medium mb-3 opacity-90">{levelKey}</div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {commissionConfigs[tierName][levelKey].map(config => (
                      <div key={config.id} className="border border-[rgb(var(--border))] rounded-lg p-4">
                        <div className="text-sm font-medium mb-2">
                          Commission Level {config.commissionLevel}
                        </div>
                        <NumberInput 
                          label="Commission %" 
                          value={getCurrentValue(config.id, 'commissionPercentage', config.commissionPercentage)} 
                          onChange={(value) => updateCommissionConfig(config.id, 'commissionPercentage', value)}
                          suffix="%"
                          step={0.1}
                        />
                        <NumberInput 
                          label="Max Levels" 
                          value={getCurrentValue(config.id, 'maxCommissionLevels', config.maxCommissionLevels)} 
                          onChange={(value) => updateCommissionConfig(config.id, 'maxCommissionLevels', value)}
                          suffix=""
                          min={1}
                        />
                        <div className="mt-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={getCurrentValue(config.id, 'isActive', config.isActive)}
                              onChange={(e) => updateCommissionConfig(config.id, 'isActive', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Active</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          ))}

          {/* Initialize Button */}
          {Object.keys(commissionConfigs).length === 0 && (
            <Card className="p-5 text-center">
              <div className="text-lg font-semibold mb-4">No Commission Configurations Found</div>
              <p className="opacity-70 mb-4">Initialize the default MLM commission structure to get started.</p>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
                    const response = await fetch(INITIALIZE_API, {
                      method: 'POST',
                      headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    if (response.ok) {
                      alert('Commission configurations initialized successfully!');
                      await load();
                    } else {
                      alert('Failed to initialize configurations');
                    }
                  } catch (e) {
                    alert('Error initializing configurations: ' + e.message);
                  }
                }}
                className="rounded-lg px-4 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
              >
                Initialize Defaults
              </button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
