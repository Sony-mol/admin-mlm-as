import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import ConfirmationDialog from './ConfirmationDialog';

export default function AddTierModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setConfirmationData({
        type: 'warning',
        title: 'Validation Error',
        message: 'Tier name is required. Please enter a tier name.',
        onConfirm: () => setShowConfirmation(false)
      });
      setShowConfirmation(true);
      return;
    }

    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';

      const response = await fetch(API_ENDPOINTS.CREATE_TIER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim().toUpperCase(),
          description: formData.description.trim()
        }),
      });

      if (response.ok) {
        const newTier = await response.json();
        
        // Show success confirmation
        setConfirmationData({
          type: 'success',
          title: 'Tier Created Successfully!',
          message: `The "${newTier.name}" tier has been created successfully.`,
          onConfirm: () => {
            setShowConfirmation(false);
            onSuccess(newTier);
            handleClose();
          }
        });
        setShowConfirmation(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Show error confirmation
        setConfirmationData({
          type: 'error',
          title: 'Failed to Create Tier',
          message: errorData.error || 'Failed to create tier. Please try again.',
          onConfirm: () => setShowConfirmation(false)
        });
        setShowConfirmation(true);
      }
    } catch (err) {
      // Show error confirmation
      setConfirmationData({
        type: 'error',
        title: 'Network Error',
        message: `Error creating tier: ${err.message}. Please check your connection and try again.`,
        onConfirm: () => setShowConfirmation(false)
      });
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Add New Tier</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[rgba(var(--fg),0.1)] rounded-lg"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
              Tier Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., PLATINUM, DIAMOND"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe this tier..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>


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
              disabled={loading || !formData.name.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Tier
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        {...confirmationData}
      />
    </div>
  );
}
