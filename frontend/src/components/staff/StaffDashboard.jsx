import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

// Import reusable components from coach dashboard
import SellProducts from '../coach/SellProducts';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sell');
  const [allStudents, setAllStudents] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Award Points Form State
  const [pointsForm, setPointsForm] = useState({
    userId: '',
    activityDescription: '',
    points: ''
  });

  useEffect(() => {
    if (activeTab === 'points') {
      fetchStudentsAndHistory();
    }
  }, [activeTab]);

  const fetchStudentsAndHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const studentsResponse = await fetch(API_ROUTES.coach.students, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setAllStudents(studentsData);
      }

      // Fetch points history
      const historyResponse = await fetch(API_ROUTES.coach.pointsHistory, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPointsHistory(historyData);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    
    if (!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points || pointsForm.points <= 0) {
      setError('Please fill in all fields with valid values');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ROUTES.coach.awardPoints, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: pointsForm.userId,
          activityDescription: pointsForm.activityDescription,
          points: parseInt(pointsForm.points)
        })
      });

      if (response.ok) {
        const selectedStudent = allStudents.find(s => s.id === pointsForm.userId);
        alert(`Successfully awarded ${pointsForm.points} points to ${selectedStudent?.name}!`);
        
        // Reset form
        setPointsForm({
          userId: '',
          activityDescription: '',
          points: ''
        });

        // Refresh points history
        await fetchStudentsAndHistory();
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to award points');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sell', label: 'Sell Products', icon: '🛒' },
    { id: 'points', label: 'Award Points', icon: '⭐' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Manage products and points across all teams
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Logged in as: <span className="font-medium text-gray-900">{user?.name}</span>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                  {user?.role || 'STAFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'sell' && <SellProducts />}
        {activeTab === 'points' && (
          <div className="p-6 max-w-7xl mx-auto">
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Award Points Form */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Award Manual Points</h2>
                
                <form onSubmit={handleAwardPoints} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student
                    </label>
                    <select
                      value={pointsForm.userId}
                      onChange={(e) => setPointsForm({...pointsForm, userId: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a student</option>
                      {allStudents.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.team?.name || 'No Team'})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Description
                    </label>
                    <input
                      type="text"
                      value={pointsForm.activityDescription}
                      onChange={(e) => setPointsForm({...pointsForm, activityDescription: e.target.value})}
                      placeholder="Describe what this is for..."
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pointsForm.points}
                      onChange={(e) => setPointsForm({...pointsForm, points: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Awarding...' : 'Award Points'}
                  </button>
                </form>
              </div>

              {/* Points History */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Recent Points Awards</h2>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading && pointsHistory.length === 0 ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : pointsHistory.length === 0 ? (
                    <p className="text-gray-500">No points awarded yet</p>
                  ) : (
                    pointsHistory.map(entry => (
                      <div key={entry.id} className="border border-gray-200 rounded p-3">
                        <div className="font-medium">{entry.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-600">{entry.activityDescription}</div>
                        <div className="text-sm text-blue-600">+{entry.points} points</div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;