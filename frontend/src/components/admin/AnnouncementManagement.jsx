import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

const AnnouncementManagement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ROUTES.announcements.global);
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            } else {
                console.error('Failed to fetch announcements');
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const createAnnouncement = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch(API_ROUTES.announcements.createGlobal, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAnnouncement)
            });

            if (response.ok) {
                const createdAnnouncement = await response.json();
                setAnnouncements(prev => [createdAnnouncement, ...prev]);
                setNewAnnouncement({ title: '', content: '' });
                setShowCreateForm(false);
                alert('Global announcement created successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to create announcement: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Error creating announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteAnnouncement = async (announcementId) => {
        if (!confirm('Are you sure you want to delete this global announcement?')) {
            return;
        }

        try {
            const response = await fetch(API_ROUTES.announcements.deleteGlobal(announcementId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
                alert('Announcement deleted successfully');
            } else {
                const errorData = await response.json();
                alert(`Failed to delete announcement: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            alert('Error deleting announcement');
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading announcements...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Global Announcements</h2>
                    <p className="text-gray-600">Manage announcements visible to all users</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                    <span>📢</span>
                    <span>Create Global Announcement</span>
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Global Announcement</h3>
                    <form onSubmit={createAnnouncement} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter announcement title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Content
                            </label>
                            <textarea
                                value={newAnnouncement.content}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Enter announcement content"
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewAnnouncement({ title: '', content: '' });
                                }}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Creating...' : 'Create Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <div className="text-4xl mb-4">📢</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Global Announcements</h3>
                        <p className="text-gray-500 mb-4">Create the first global announcement to get started.</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Create Announcement
                        </button>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <div key={announcement.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                            Global
                                        </span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed mb-3">{announcement.content}</p>
                                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                                        <span>🕐 {new Date(announcement.createdAt).toLocaleString()}</span>
                                        <span>👤 {announcement.createdBy.name} ({announcement.createdBy.role})</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteAnnouncement(announcement.id)}
                                    className="ml-4 text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                                    title="Delete announcement"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AnnouncementManagement;
