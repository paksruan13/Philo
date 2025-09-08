import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

const ActivityManagement = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
    fetchActivities();
}, []);

const fetchActivities = async () => {
    try {
        const response = await fetch(API_ROUTES.admin.activities, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if(response.ok) {
            const data =await response.json();
            setActivities(data);
        } else {
            setError('Failed to fetch activities');
        }
    } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Error fetching activities');
    } finally {
        setLoading(false);
    }
}

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

const deleteActivity = async (activityId) => {
  if (!confirm('Are you sure you want to delete this activity? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(API_ROUTES.activities.delete(activityId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Activity deleted successfully');
      fetchActivities(); // Refresh the list
    } else {
      const data = await response.json();
      setError(data.error || 'Failed to delete activity');
    }
  } catch (error) {
    console.error('Error deleting activity:', error);
    setError('Error deleting activity');
  }
};

return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Management</h2>
          <p className="text-gray-600">Create and manage activities for students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Activity
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
          <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Published</h3>
          <p className="text-2xl font-bold text-green-600">
            {activities.filter(a => a.isPublished).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Drafts</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {activities.filter(a => !a.isPublished).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Categories</h3>
          <p className="text-2xl font-bold text-blue-600">{ACTIVITY_CATEGORIES.length}</p>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {activity.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {activity.categoryType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.points} pts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                          activity.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.isPublished ? 'Published' : 'Draft'}
                        </span>

                        {/* Show online purchase option if applicable */}
                        {activity.allowOnlinePurchase && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              🌐 Online
                          </span>
                        )}

                        {/* Show photo upload option if applicable */}
                        {activity.allowPhotoUpload && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                              📸 Photo Upload
                          </span>
                        )}

                        {/* Show submission enabled indicator */}
                        {activity.allowSubmission && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              ✍️ Submittable
                          </span>
                        )}

                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <span className="text-green-600">{activity.approvedCount} ✓</span>
                      <span className="text-yellow-600">{activity.pendingCount} ⏳</span>
                      <span className="text-gray-500">{activity.submissionCount} total</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingActivity(activity)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Activity Modal */}
      {(showCreateForm || editingActivity) && (
        <ActivityForm
          activity={editingActivity}
          categories={ACTIVITY_CATEGORIES}
          onClose={() => {
            setShowCreateForm(false);
            setEditingActivity(null);
          }}
          onSave={() => {
            fetchActivities();
            setShowCreateForm(false);
            setEditingActivity(null);
          }}
          token={token}
        />
      )}
    </div>
  );
};

const ACTIVITY_CATEGORIES = [
  { value: 'PHOTO', label: 'Photo'},
  { value: 'PURCHASE', label: 'Purchase'},
  { value: 'DONATION', label: 'Donation'},
  { value: 'OTHER', label: 'OTHER'},
]

const ActivityForm = ({ activity, categories, onClose, onSave, token }) => {
    const [formData, setFormData] = useState({
        title: activity ? activity.title : '',
        description: activity?.description || '',
        points: activity?.points || 100,
        categoryType: activity?.categoryType || 'OTHER',
        requirements: activity?.requirements || {},
        isPublished: activity?.isPublished || false,
        allowOnlinePurchase: activity?.allowOnlinePurchase || false,
        allowPhotoUpload: activity?.allowPhotoUpload || false,
        allowSubmission: activity?.allowSubmission || false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = activity
            ? API_ROUTES.admin.activityDetail(activity.id)
            : API_ROUTES.admin.activities;

            const method = activity ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if(response.ok) {
                onSave();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to save activity');
            }
        } catch (error) {
            console.error('Error saving activity:', error);
            setError('Error saving activity');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const isPurchaseOrDonation = selectedCategory?.name?.toLowerCase().includes('purchase') ||
        selectedCategory?.name?.toLowerCase().includes('donation');

    return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {activity ? 'Edit Activity' : 'Create Activity'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.categoryType}
              onChange={(e) => setFormData({...formData, categoryType: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {ACTIVITY_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
              Make Visible Now!
            </label>
          </div>

          {/* Allow Online Purchase Option */}
          {isPurchaseOrDonation && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowOnlinePurchase"
                checked={formData.allowOnlinePurchase}
                onChange={(e) => setFormData({...formData, allowOnlinePurchase: e.target.checked})}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
                />
                <label htmlFor="allowOnlinePurchase" className="ml-2 block text-sm text-gray-900">
                  Allow Online {selectedCategory?.name?.toLowerCase().includes('purchase') ? 'Purchase' : 'Donation'  }
                  <span className="text-gray-500 ml-1">
                    (shows online button to students)
                  </span>
                </label>
            </div>
          )}

          {/*Allow Photo Upload Option */}
          <div className="flex items-center">
              <input
                type="checkbox"
                id="allowPhotoUpload"
                checked={formData.allowPhotoUpload}
                onChange={(e) => setFormData({...formData, allowPhotoUpload: e.target.checked})}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
                />
                <label htmlFor="allowPhotoUpload" className="ml-2 block text-sm text-gray-900">
                  Allow Photo Upload
                  <span className="text-gray-500 ml-1">
                    (shows upload button to students)
                  </span>
                </label>
            </div>

          {/* Allow Submission Option */}
          <div className="flex items-center">
              <input
                type="checkbox"
                id="allowSubmission"
                checked={formData.allowSubmission}
                onChange={(e) => setFormData({...formData, allowSubmission: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                />
                <label htmlFor="allowSubmission" className="ml-2 block text-sm text-gray-900">
                  Allow Student Submission
                  <span className="text-gray-500 ml-1">
                    (enables submission forms and buttons)
                  </span>
                </label>
            </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (activity ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityManagement;

