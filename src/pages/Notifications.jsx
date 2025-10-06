import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  Bell, 
  Send, 
  Settings, 
  Users, 
  DollarSign, 
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

// Notification Templates
const notificationTemplates = [
  {
    id: 1,
    name: "Welcome Email",
    subject: "Welcome to CAMGO MLM!",
    type: "user_registration",
    template: `Dear {{userName}},

Welcome to CAMGO MLM! Your account has been successfully created.

Your Referral Code: {{referralCode}}
Your Tier: {{tier}}

Start earning commissions by referring friends and family!

Best regards,
CAMGO Team`,
    active: true
  },
  {
    id: 2,
    name: "Commission Earned",
    subject: "Commission Payment Received!",
    type: "commission_payment",
    template: `Dear {{userName}},

Congratulations! You have earned a commission of ₹{{amount}}.

Commission Details:
- Amount: ₹{{amount}}
- From: {{referrerName}}
- Level: {{level}}
- Date: {{date}}

Your total earnings: ₹{{totalEarnings}}

Keep up the great work!
CAMGO Team`,
    active: true
  },
  {
    id: 3,
    name: "Withdrawal Request",
    subject: "Withdrawal Request Status Update",
    type: "withdrawal_status",
    template: `Dear {{userName}},

Your withdrawal request has been {{status}}.

Details:
- Amount: ₹{{amount}}
- Request Date: {{requestDate}}
- Status: {{status}}
- {{#if approved}}Expected Processing: {{processingDate}}{{/if}}

{{#if rejected}}Reason: {{reason}}{{/if}}

Thank you for using CAMGO!
CAMGO Team`,
    active: true
  },
  {
    id: 4,
    name: "Tier Upgrade",
    subject: "Congratulations! Tier Upgrade",
    type: "tier_upgrade",
    template: `Dear {{userName}},

Congratulations! You have been upgraded to {{newTier}} tier!

New Benefits:
- Higher commission rates
- Exclusive rewards
- Priority support

Keep referring to unlock even more benefits!

Best regards,
CAMGO Team`,
    active: true
  }
];

// Notification Settings Component
const NotificationSettings = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key) => {
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-600">Send email notifications to users</p>
          </div>
          <button
            onClick={() => handleToggle('emailEnabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.emailEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">SMS Notifications</h4>
            <p className="text-sm text-gray-600">Send SMS notifications (coming soon)</p>
          </div>
          <button
            onClick={() => handleToggle('smsEnabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.smsEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.smsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Push Notifications</h4>
            <p className="text-sm text-gray-600">Send push notifications to mobile app</p>
          </div>
          <button
            onClick={() => handleToggle('pushEnabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.pushEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// Template Editor Component
const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [editedTemplate, setEditedTemplate] = useState(template);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSave(editedTemplate)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
          <input
            type="text"
            value={editedTemplate.name}
            onChange={(e) => setEditedTemplate({...editedTemplate, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            value={editedTemplate.subject}
            onChange={(e) => setEditedTemplate({...editedTemplate, subject: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
          <textarea
            value={editedTemplate.template}
            onChange={(e) => setEditedTemplate({...editedTemplate, template: e.target.value})}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email template here..."
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Available Variables:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div><code>{'{{userName}}'}</code> - User's name</div>
            <div><code>{'{{referralCode}}'}</code> - User's referral code</div>
            <div><code>{'{{tier}}'}</code> - User's tier level</div>
            <div><code>{'{{amount}}'}</code> - Commission amount</div>
            <div><code>{'{{date}}'}</code> - Current date</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Notifications() {
  const [templates, setTemplates] = useState(notificationTemplates);
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true
  });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const handleSendTest = async (templateId) => {
    setLoading(true);
    // Simulate sending test email
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    alert('Test email sent successfully!');
  };

  const handleSaveTemplate = (updatedTemplate) => {
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    setEditingTemplate(null);
  };

  const handleToggleTemplate = (templateId) => {
    setTemplates(templates.map(t => 
      t.id === templateId ? { ...t, active: !t.active } : t
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">Manage email templates and notification settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Send className="w-4 h-4" />
                <span>Send Broadcast</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'templates', label: 'Email Templates', icon: Mail },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'history', label: 'Send History', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {editingTemplate ? (
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => setEditingTemplate(null)}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${template.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleTemplate(template.id)}
                          className={`p-2 rounded-lg hover:bg-gray-100 ${
                            template.active ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {template.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Subject:</h4>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Template:</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {template.template.substring(0, 200)}...
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleSendTest(template.id)}
                        disabled={loading}
                        className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>Send Test</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <NotificationSettings settings={settings} onUpdate={setSettings} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Send History</h3>
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div className="text-sm text-gray-500">No send history available yet</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
