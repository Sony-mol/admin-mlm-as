// RewardSelector.jsx - Searchable dropdown for selecting rewards
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, ChevronDown } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export default function RewardSelector({ value, onChange, placeholder = 'Select or type reward...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Load rewards from backend
  useEffect(() => {
    loadRewards();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadRewards() {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(API_ENDPOINTS.GET_ALL_REWARDS, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extract unique reward names
        const rewardNames = [...new Set(data.map(r => r.rewardName || r.name).filter(Boolean))];
        setRewards(rewardNames.sort());
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter rewards based on search term
  const filteredRewards = rewards.filter(reward =>
    reward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term is a new reward (not in list)
  const isNewReward = searchTerm.trim() && 
    !rewards.some(r => r.toLowerCase() === searchTerm.trim().toLowerCase());

  const handleSelect = (rewardName) => {
    onChange(rewardName);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (searchTerm.trim()) {
      onChange(searchTerm.trim());
      setRewards(prev => [...prev, searchTerm.trim()].sort());
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block">
        <div className="text-sm opacity-80 mb-1">Reward</div>
        
        {/* Main Input/Display */}
        <div 
          className="relative w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={value ? '' : 'opacity-50'}>
              {value || placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1 hover:bg-[rgba(var(--fg),0.1)] rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
      </label>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-[rgb(var(--border))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rewards..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Rewards List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm opacity-70">
                Loading rewards...
              </div>
            ) : filteredRewards.length > 0 ? (
              filteredRewards.map((reward) => (
                <button
                  key={reward}
                  type="button"
                  onClick={() => handleSelect(reward)}
                  className={`w-full text-left px-4 py-2 hover:bg-[rgba(var(--accent-1),0.1)] transition-colors ${
                    value === reward ? 'bg-[rgba(var(--accent-1),0.15)] text-[rgb(var(--accent-1))]' : ''
                  }`}
                >
                  {reward}
                </button>
              ))
            ) : searchTerm ? (
              <div className="p-4 text-center text-sm opacity-70">
                No rewards found matching "{searchTerm}"
              </div>
            ) : (
              <div className="p-4 text-center text-sm opacity-70">
                No rewards available
              </div>
            )}
          </div>

          {/* Create New Option */}
          {isNewReward && (
            <>
              <div className="border-t border-[rgb(var(--border))]" />
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[rgba(var(--accent-1),0.1)] text-blue-600 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create new reward: "{searchTerm.trim()}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getToken() {
  try {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw).accessToken : '';
  } catch {
    return '';
  }
}

