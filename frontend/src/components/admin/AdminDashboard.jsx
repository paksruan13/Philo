import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement';
import TeamManagement from './TeamManagement';
import ActivityManagement from './ActivityManagement';
import InventoryManagement from './InventoryManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuth();

  const tabs = [
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'teams', label: 'Team Management', icon: '🏆' },
    { id: 'activities', label: 'Activity Management', icon: '🎯' },
    { id: 'inventory', label: 'Inventory Management', icon: '📦' },
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