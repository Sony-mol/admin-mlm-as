import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://asbackend-production-56a3.up.railway.app';

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

  const fetchCurrentTerms = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/terms/active/all`);
      
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
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/api/terms/versions/${type}`, {
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
      const token = localStorage.getItem('adminToken');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        showMessage('Please login as admin', 'error');
        return;
      }

      const dataToSave = activeTab === 'TERMS' ? termsData : privacyData;

      const response = await axios.post(
        `${API_BASE_URL}/api/terms/admin/update`,
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
      fetchCurrentTerms();
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-yellow-400">Terms & Conditions Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your app's legal documents</p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 py-2 mt-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <p className="text-white text-center">{message.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('TERMS')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'TERMS'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'PRIVACY'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
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
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={currentData.title}
                  onChange={(e) => setCurrentData({ ...currentData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  placeholder="Enter title"
                />
              </div>

              {/* Version */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={currentData.version}
                  onChange={(e) => setCurrentData({ ...currentData, version: e.target.value })}
                  className="w-32 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  placeholder="1.0"
                />
              </div>

              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={currentData.content}
                  onChange={(e) => setCurrentData({ ...currentData, content: e.target.value })}
                  className="w-full h-96 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-yellow-400 resize-none"
                  placeholder="Enter content here..."
                />
                <p className="text-gray-400 text-xs mt-2">
                  Tip: Use line breaks to create paragraphs. Content will be displayed as-is in the mobile app.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    isSaving
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save & Publish'}
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  onClick={fetchCurrentTerms}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-xl mt-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Preview</h3>
                <div className="bg-black rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">{currentData.title}</h2>
                  <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {currentData.content}
                  </div>
                  <p className="text-gray-500 text-sm mt-6 italic">Version {currentData.version}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Current Info */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">Current Version</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p className="text-white font-semibold">{currentData.type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Version</p>
                  <p className="text-white font-semibold">{currentData.version}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Character Count</p>
                  <p className="text-white font-semibold">{currentData.content.length}</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">💡 Tips</h3>
              <ul className="space-y-3 text-sm text-gray-300">
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
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                View Version History
              </button>
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 shadow-xl mt-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Version History</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg ${
                        version.isActive ? 'bg-green-900 border border-green-600' : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">v{version.version}</span>
                        {version.isActive && (
                          <span className="text-xs bg-green-600 px-2 py-1 rounded">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
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
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>💡 All changes are saved with version control. Users will see the latest version automatically.</p>
      </div>
    </div>
  );
}

