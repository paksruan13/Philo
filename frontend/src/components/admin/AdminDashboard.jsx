import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import UserManagement from './UserManagement';
import TeamManagement from './TeamManagement';
import ActivityManagement from './ActivityManagement';
import InventoryManagement from './InventoryManagement';
import AnnouncementManagement from './AnnouncementManagement';

// Settings Management Component
const SettingsManagement = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(API_ROUTES.admin.config, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDonationGoal = async (newGoal) => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(API_ROUTES.admin.config, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'donationGoal',
          value: newGoal
        }),
      });

      if (response.ok) {
        setConfig(prev => ({ ...prev, donationGoal: newGoal }));
        setMessage('Donation goal updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to update donation goal');
      }
    } catch (error) {
      console.error('Error updating donation goal:', error);
      setMessage('Failed to update donation goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newGoal = formData.get('donationGoal');
    if (newGoal && !isNaN(newGoal) && parseFloat(newGoal) > 0) {
      updateDonationGoal(newGoal);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
        <p className="text-gray-600">Configure system-wide settings and parameters.</p>
      </div>

      {/* Donation Goal Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fundraising Settings</h3>
          <p className="text-gray-600">Set the overall fundraising goal for Project Phi.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="donationGoal" className="block text-sm font-medium text-gray-700 mb-2">
              Donation Goal ($)
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="donationGoal"
                  id="donationGoal"
                  defaultValue={config.donationGoal || '50000'}
                  min="1"
                  step="1"
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                  placeholder="50000"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Goal</span>
                )}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Current Goal:</strong> ${(config.donationGoal || 50000).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This goal will be displayed on the main dashboard and used to calculate progress percentages.
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuth();

  const tabs = [
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'teams', label: 'Team Management', icon: '🏆' },
    { id: 'activities', label: 'Activity Management', icon: '🎯' },
    { id: 'inventory', label: 'Inventory Management', icon: '📦' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage users, teams, and system settings
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Admin: {user?.firstName} {user?.lastName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'teams' && <TeamManagement />}
            {activeTab === 'activities' && <ActivityManagement />}
            {activeTab === 'inventory' && <InventoryManagement />}
            {activeTab === 'announcements' && <AnnouncementManagement />}
            {activeTab === 'settings' && <SettingsManagement />}
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500">Advanced analytics and reporting features will be available here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;