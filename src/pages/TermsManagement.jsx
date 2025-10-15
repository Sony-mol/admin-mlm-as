import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

export default function TermsManagement() {
  const [activeTab, setActiveTab] = useState('TERMS');
  const [termsData, setTermsData] = useState({
    type: 'TERMS',
    title: 'Terms & Conditions',
    content: '',
    version: '1.0'
  });
  const [privacyData, setPrivacyData] = useState({
    type: 'PRIVACY',
    title: 'Privacy Policy',
    content: '',
    version: '1.0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [versions, setVersions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCurrentTerms();
  }, []);

  // Helper to read token/userId from the unified auth storage
  function getAuthInfo() {
    try {
      const raw = localStorage.getItem('auth');
      const parsed = raw ? JSON.parse(raw) : null;
      const token = parsed?.accessToken || '';
      const userId = parsed?.user?.userId || localStorage.getItem('userId') || '';
      return { token, userId };
    } catch {
      return { token: '', userId: '' };
    }
  }

  const fetchCurrentTerms = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(getApiUrl('/api/terms/active/all'));
      
      if (response.data.terms) {
        setTermsData({
          type: 'TERMS',
          title: response.data.terms.title || 'Terms & Conditions',
          content: response.data.terms.content || '',
          version: response.data.terms.version || '1.0'
        });
      }
      
      if (response.data.privacy) {
        setPrivacyData({
          type: 'PRIVACY',
          title: response.data.privacy.title || 'Privacy Policy',
          content: response.data.privacy.content || '',
          version: response.data.privacy.version || '1.0'
        });
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      showMessage('Error loading terms', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersionHistory = async (type) => {
    try {
      const { token } = getAuthInfo();
      const response = await axios.get(getApiUrl(`/api/terms/versions/${type}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVersions(response.data);
    } catch (error) {
      console.error('Error fetching version history:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { token, userId } = getAuthInfo();
      
      if (!token || !userId) {
        showMessage('Please login as admin', 'error');
        return;
      }

      const dataToSave = activeTab === 'TERMS' ? termsData : privacyData;

      const response = await axios.post(
        getApiUrl('/api/terms/admin/update'),
        dataToSave,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Id': userId,
            'Content-Type': 'application/json'
          }
        }
      );

      showMessage('Saved successfully!', 'success');
      // Keep the editor text intact; if backend returned normalized data, use it
      const saved = response?.data?.[activeTab === 'TERMS' ? 'terms' : 'privacy'];
      if (saved) {
        if (activeTab === 'TERMS') setTermsData((prev) => ({ ...prev, ...saved }));
        else setPrivacyData((prev) => ({ ...prev, ...saved }));
      }
      // Refresh version history in the background
      fetchVersionHistory(activeTab);
    } catch (error) {
      console.error('Error saving:', error);
      showMessage(error.response?.data?.error || 'Error saving changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  const currentData = activeTab === 'TERMS' ? termsData : privacyData;
  const setCurrentData = activeTab === 'TERMS' ? setTermsData : setPrivacyData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[rgb(var(--bg))]">
        <div className="text-[rgb(var(--fg))] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Header */}
      <div className="bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold">Terms & Conditions Management</h1>
          <p className="opacity-70 text-sm mt-1">Manage your app's legal documents</p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 py-2 mt-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/15 border border-green-600' : 'bg-red-500/15 border border-red-600'
        }`}>
          <p className="text-center">{message.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex space-x-2 border-b border-[rgb(var(--border))]">
          <button
            onClick={() => setActiveTab('TERMS')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'TERMS' ? 'border-b-2' : 'opacity-70 hover:opacity-100'
            } border-[rgb(var(--border))]`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'PRIVACY' ? 'border-b-2' : 'opacity-70 hover:opacity-100'
            } border-[rgb(var(--border))]`}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 border border-[rgb(var(--border))] shadow">
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 opacity-80">
                  Title
                </label>
                <input
                  type="text"
                  value={currentData.title}
                  onChange={(e) => setCurrentData({ ...currentData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                  placeholder="Enter title"
                />
              </div>

              {/* Version */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 opacity-80">
                  Version
                </label>
                <input
                  type="text"
                  value={currentData.version}
                  onChange={(e) => setCurrentData({ ...currentData, version: e.target.value })}
                  className="w-32 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                  placeholder="1.0"
                />
              </div>

              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 opacity-80">
                  Content
                </label>
                <textarea
                  value={currentData.content}
                  onChange={(e) => setCurrentData({ ...currentData, content: e.target.value })}
                  className="w-full h-96 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] font-mono text-sm resize-none"
                  placeholder="Enter content here..."
                />
                <p className="opacity-70 text-xs mt-2">
                  Tip: Use line breaks to create paragraphs. Content will be displayed as-is in the mobile app.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors border border-[rgb(var(--border))] ${
                    isSaving ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  style={{ background: 'rgb(var(--fg))', color: 'rgb(var(--bg))' }}
                >
                  {isSaving ? 'Saving...' : 'Save & Publish'}
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-3 rounded-lg font-medium transition-colors border border-[rgb(var(--border))]"
                >
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  onClick={fetchCurrentTerms}
                  className="px-6 py-3 rounded-lg font-medium transition-colors border border-[rgb(var(--border))]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-[rgb(var(--card))] rounded-2xl p-6 border border-[rgb(var(--border))] shadow mt-6">
                <h3 className="text-xl font-semibold mb-4">Preview</h3>
                <div className="rounded-lg p-6 border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
                  <h2 className="text-2xl font-semibold mb-4">{currentData.title}</h2>
                  <div className="opacity-90 whitespace-pre-line leading-relaxed">
                    {currentData.content}
                  </div>
                  <p className="opacity-70 text-sm mt-6 italic">Version {currentData.version}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Current Info */}
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 border border-[rgb(var(--border))] shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">Current Version</h3>
              <div className="space-y-3">
                <div>
                  <p className="opacity-70 text-sm">Type</p>
                  <p className="font-medium">{currentData.type}</p>
                </div>
                <div>
                  <p className="opacity-70 text-sm">Version</p>
                  <p className="font-medium">{currentData.version}</p>
                </div>
                <div>
                  <p className="opacity-70 text-sm">Character Count</p>
                  <p className="font-medium">{currentData.content.length}</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 border border-[rgb(var(--border))] shadow">
              <h3 className="text-lg font-semibold mb-4">💡 Tips</h3>
              <ul className="space-y-3 text-sm opacity-90">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Changes are published immediately after saving</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Use clear, simple language</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Increment version number for major changes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Preview before publishing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Previous versions are saved automatically</span>
                </li>
              </ul>
            </div>

            {/* Version History Button */}
            <div className="mt-6">
              <button
                onClick={() => fetchVersionHistory(activeTab)}
                className="w-full py-3 rounded-lg font-medium transition-colors border border-[rgb(var(--border))]"
              >
                View Version History
              </button>
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div className="bg-[rgb(var(--card))] rounded-2xl p-6 border border-[rgb(var(--border))] shadow mt-6">
                <h3 className="text-lg font-semibold mb-4">Version History</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border ${
                        version.isActive ? 'border-green-600/60 bg-green-500/10' : 'border-[rgb(var(--border))] bg-[rgb(var(--bg))]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">v{version.version}</span>
                        {version.isActive && (
                          <span className="text-xs bg-green-500/20 border border-green-600/60 px-2 py-1 rounded">Active</span>
                        )}
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(version.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8 text-center opacity-70 text-sm">
        <p>💡 All changes are saved with version control. Users will see the latest version automatically.</p>
      </div>
    </div>
  );
}

