import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, API_ROUTES } from '../../services/api';
import SellProducts from './SellProducts';

const CoachDashboard = ({ onNavigate }) => {
    const { user } = useAuth();
    const [teamData, setTeamData] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [pointsHistory, setPointsHistory] = useState([]);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [showPointsForm, setShowPointsForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({title: '', content: ''});
    const [pointsForm, setPointsForm] = useState({
        userId: '',
        activityDescription: '',
        points: '',
    });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [teams, setTeams] = useState([]);
    const [showAllSubmissions, setShowAllSubmissions] = useState(false);
    const [approvedSubmissions, setApprovedSubmissions] = useState([]);
    const [showAllApprovedSubmissions, setShowAllApprovedSubmissions] = useState(false);

    // Fetch points history
    const fetchPointsHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiEndpoint = API_ROUTES.coach.pointsHistory;
            const response = await fetch(apiEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPointsHistory(data);
            }
        } catch (error) {
            console.error('Error fetching points history:', error);
        }
    };

    // Fetch all students
    const fetchAllStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.students, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAllStudents(data);
            }
        } catch (error) {
            console.error('Error fetching all students:', error);
        }
    };

    // Award manual points
    const handleAwardPoints = async () => {
        if (!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points) {
            alert('Please fill in all required fields');
            return;
            // ...existing code for fetchPointsHistory, handleAwardPoints, etc...
            // ...existing code for fetchCoachTeamData, useEffect, etc...
        }

        if (isNaN(pointsForm.points) || parseInt(pointsForm.points) <= 0) {
            alert('Please enter a valid positive number for points');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const selectedStudent = allStudents.find(s => s.id === pointsForm.userId);
            
            const requestBody = {
                userId: pointsForm.userId,
                activityDescription: pointsForm.activityDescription,
                points: parseInt(pointsForm.points),
            };
            
            const response = await fetch(API_ROUTES.coach.awardPoints, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Successfully awarded ${pointsForm.points} points to ${allStudents.find(s => s.id === pointsForm.userId)?.name}!`);
                setPointsForm({ userId: '', activityDescription: '', points: ''});
                setShowPointsForm(false);
                fetchPointsHistory(); // Refresh history
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to award points');
            }
        } catch (error) {
            console.error('Error awarding points:', error);
            alert('Failed to award points');
        }
    };

    // Delete manual points award
    const handleDeletePoints = async (pointsAwardId) => {
        if (!confirm('Are you sure you want to delete this points award?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.deletePoints(pointsAwardId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                alert('Points award deleted successfully!');
                fetchPointsHistory(); // Refresh history
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete points award');
            }
        } catch (error) {
            console.error('Error deleting points award:', error);
            alert('Failed to delete points award');
        }
    };

    // Create announcement
    const handleCreateAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.announcements.create(teamData.id), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAnnouncement)
            });

            if (response.ok) {
                const announcement = await response.json();
                setAnnouncements(prev => [announcement, ...prev]);
                setNewAnnouncement({ title: '', content: '' });
                setShowAnnouncementForm(false);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to create announcement');
            }
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Failed to create announcement');
        }
    };

    // Delete announcement
    const handleDeleteAnnouncement = async (announcementId) => {
        if (!confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            const response = await fetch(API_ROUTES.announcements.delete(teamData.id, announcementId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error(`Failed to delete announcement: ${responseText}`);
                fetchCoachTeamData();
                alert(`Failed to delete announcement: ${responseText}`);
            } else {
                history.replaceState(null, '', window.location.pathname);
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            fetchCoachTeamData();
            alert('Failed to delete announcement');
        }
    };

    const fetchPendingSubmissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.pendingSubmissions, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setPendingSubmissions(data);
            }
        } catch (error) {
            console.error('Error fetching pending submissions:', error);
        }
    };

    const fetchApprovedSubmissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.approvedSubmissions, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setApprovedSubmissions(data);
            } else {
                const errorText = await response.text();
                setApprovedSubmissions([]);
            }
        } catch (error) {
            console.error('💥 Error fetching approved submissions:', error);
            setApprovedSubmissions([]);
        }
    };

    const handleApproveSubmission = async (submissionId, points) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.approveSubmission(submissionId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pointsAwarded: points,
                    reviewNotes: 'Approved by coach'
                })
            });

            if (response.ok) {
                alert('Submission approved successfully!');
                fetchPendingSubmissions(); // Refresh pending submissions
                fetchApprovedSubmissions(); // Refresh approved submissions
                // Optionally refresh team data to show updated points
                fetchCoachTeamData();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to approve submission');
            }
        } catch (error) {
            console.error('Error approving submission:', error);
            alert('Failed to approve submission');
        }
    };

    const handleRejectSubmission = async (submissionId, reason) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.rejectSubmission(submissionId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reviewNotes: reason
                })
            });

            if (response.ok) {
                alert('Submission rejected');
                fetchPendingSubmissions(); // Refresh submissions
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to reject submission');
            }
        } catch (error) {
            console.error('Error rejecting submission:', error);
            alert('Failed to reject submission');
        }
    };

    const handleUnapproveSubmission = async (submissionId) => {
        if (!confirm('Are you sure you want to unapprove this submission? The points will be removed from the student.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.unapproveSubmission(submissionId), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reviewNotes: 'Unapproved by coach'
                })
            });

            if (response.ok) {
                alert('Submission unapproved successfully! Points have been removed.');
                fetchApprovedSubmissions(); // Refresh approved submissions
                fetchPendingSubmissions(); // Refresh pending (in case it goes back to pending)
                fetchCoachTeamData(); // Refresh team data to show updated points
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to unapprove submission');
            }
        } catch (error) {
            console.error('Error unapproving submission:', error);
            alert('Failed to unapprove submission');
        }
    };

    const handleDeleteSubmission = async (submissionId) => {
        if (!confirm('Are you sure you want to permanently delete this submission? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ROUTES.coach.deleteSubmission(submissionId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                alert('Submission deleted successfully!');
                fetchApprovedSubmissions(); // Refresh approved submissions
                fetchCoachTeamData(); // Refresh team data
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete submission');
            }
        } catch (error) {
            console.error('Error deleting submission:', error);
            alert('Failed to delete submission');
        }
    };

    const fetchCoachTeamData = async () => {
            try {
                if (!user) {
                    setError('User not authenticated');
                    setLoading(false);
                    return;
                }
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                console.log('🔑 Token found:', token.substring(0, 20) + '...');

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Get current user info with coached teams
                const userRes = await fetch(API_ROUTES.auth.me, { headers });
                if (!userRes.ok) {
                    const errorText = await userRes.text();
                    throw new Error(`Failed to fetch user data: ${userRes.status} - ${errorText}`);
                }
                
                const userData = await userRes.json();
                // Check if user has coached teams
                if (!userData.user.coachedTeams || userData.user.coachedTeams.length === 0) {
                    setError('You are not assigned as a coach to any team. Please contact an administrator to assign you to a team.');
                    setLoading(false);
                    return;
                }

                // Get the first coached team
                const coachedTeam = userData.user.coachedTeams[0];
                // Fetch detailed team data from leaderboard
                const leaderboardRes = await fetch(API_ROUTES.leaderboard.list);
                if (!leaderboardRes.ok) {
                    throw new Error('Failed to fetch leaderboard data');
                }
                
                const leaderboardData = await leaderboardRes.json();
                const currentTeam = leaderboardData.find(team => team.id === coachedTeam.id);
                if (!currentTeam) {
                    setError('Team not found in leaderboard');
                    setLoading(false);
                    return;
                }
                setTeamData(currentTeam);

                // Fetch team members
                const memberRes = await fetch(API_ROUTES.teams.members(coachedTeam.id), { headers });
                if (!memberRes.ok) {
                    const errorText = await memberRes.text();
                    setTeamMembers([]);
                } else {
                    const memberData = await memberRes.json();
                    setTeamMembers(memberData);
                }

                // Fetch announcements
                try {
                    const announcementRes = await fetch(API_ROUTES.announcements.forTeam(coachedTeam.id));
                    console.log(`Using team ID: ${coachedTeam.id}`)
                    if (announcementRes.ok) {
                        const response = await announcementRes.json();
                        setAnnouncements(response);
                    } else {
                        const errorText = await announcementRes.text();
                        setAnnouncements([]);
                    }
                } catch (err) {
                    setAnnouncements([]);
                }

                // Fetch points history
                await fetchPointsHistory();

                // Fetch all students
                await fetchAllStudents();

                // Fetch pending submissions
                await fetchPendingSubmissions();

                // Fetch approved submissions
                await fetchApprovedSubmissions();

            } catch (error) {
                console.error('💥 Error in fetchCoachTeamData:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchCoachTeamData();
    }, [user]);
    if (loading) {
        return (
            <div className="text-center p-10">
                <div className="text-lg">Loading Coach Dashboard...</div>
                <div className="text-sm text-gray-500 mt-2">
                  Check browser console for debug info
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h3 className="font-bold">Error:</h3>
                    <p>{error}</p>
                    <div className="mt-4 text-sm">
                        <p>Debug info:</p>
                        <ul className="list-disc list-inside">
                            <li>User role: {user?.role}</li>
                            <li>User authenticated: {user ? 'Yes' : 'No'}</li>
                            <li>Check console for more details</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    if (!teamData) {
        return (
            <div className="text-center p-10">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <h3 className="font-bold">No Team Data</h3>
                    <p>Team data not found. Check console for debug info.</p>
                </div>
            </div>
        );
    }
    const tabs = [
        { id: 'dashboard', label: 'Team Overview', icon: '📊' },
        { id: 'sell', label: 'Sell Products', icon: '🛒' },
        { id: 'points', label: 'Manage Points', icon: '⭐' },
        { id: 'announcements', label: 'Announcements', icon: '📢' },
        { id: 'submissions', label: 'Review Submissions', icon: '📋' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Coach Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Coach Dashboard
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {user?.role === 'STAFF' 
                                        ? 'Manage students and products across all teams'
                                        : `Managing Team: ${teamData.name}`
                                    }
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-500">
                                    Logged in as: <span className="font-medium text-gray-900">{user?.name}</span>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {user?.role || 'COACH'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'dashboard' && (
                    <TeamOverview 
                        teamData={teamData}
                        teamMembers={teamMembers}
                        announcements={announcements.slice(0, 3)}
                        pendingSubmissions={pendingSubmissions.slice(0, 3)}
                        allPendingSubmissions={pendingSubmissions}
                        approvedSubmissions={approvedSubmissions.slice(0, 3)}
                        allApprovedSubmissions={approvedSubmissions}
                        recentPoints={pointsHistory.slice(0, 3)}
                        showAllSubmissions={showAllSubmissions}
                        setShowAllSubmissions={setShowAllSubmissions}
                        showAllApprovedSubmissions={showAllApprovedSubmissions}
                        setShowAllApprovedSubmissions={setShowAllApprovedSubmissions}
                        handleApproveSubmission={handleApproveSubmission}
                        handleRejectSubmission={handleRejectSubmission}
                        handleUnapproveSubmission={handleUnapproveSubmission}
                        handleDeleteSubmission={handleDeleteSubmission}
                    />
                )}
                {activeTab === 'points' && (
                    <PointsManagement 
                        teamMembers={teamMembers}
                        allStudents={allStudents}
                        pointsHistory={pointsHistory}
                        pointsForm={pointsForm}
                        setPointsForm={setPointsForm}
                        showPointsForm={showPointsForm}
                        setShowPointsForm={setShowPointsForm}
                        handleAwardPoints={handleAwardPoints}
                        handleDeletePoints={handleDeletePoints}
                    />
                )}
                {activeTab === 'announcements' && (
                    <AnnouncementsTab 
                        announcements={announcements}
                        newAnnouncement={newAnnouncement}
                        setNewAnnouncement={setNewAnnouncement}
                        showAnnouncementForm={showAnnouncementForm}
                        setShowAnnouncementForm={setShowAnnouncementForm}
                        handleCreateAnnouncement={handleCreateAnnouncement}
                        handleDeleteAnnouncement={handleDeleteAnnouncement}
                    />
                )}
                {activeTab === 'sell' && (
                    <SellProducts />
                )}
                {activeTab === 'submissions' && (
                    <SubmissionsTab 
                        pendingSubmissions={pendingSubmissions}
                        approvedSubmissions={approvedSubmissions}
                        handleApproveSubmission={handleApproveSubmission}
                        handleRejectSubmission={handleRejectSubmission}
                        handleUnapproveSubmission={handleUnapproveSubmission}
                        handleDeleteSubmission={handleDeleteSubmission}
                    />
                )}
            </div>
        </div>
    );
};

// Tab Components
const TeamOverview = ({ 
    teamData, 
    teamMembers, 
    announcements, 
    pendingSubmissions, 
    allPendingSubmissions,
    approvedSubmissions,
    allApprovedSubmissions,
    recentPoints, 
    showAllSubmissions, 
    setShowAllSubmissions,
    showAllApprovedSubmissions,
    setShowAllApprovedSubmissions,
    handleApproveSubmission,
    handleRejectSubmission,
    handleUnapproveSubmission,
    handleDeleteSubmission
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Stats */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Team Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{teamData.memberCount}</p>
                        <p className="text-gray-600">Members</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{teamData.totalScore}</p>
                        <p className="text-gray-600">Total Points</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">${teamData.stats?.totalDonations?.toFixed(2) || '0.00'}</p>
                        <p className="text-gray-600">Donations</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{pendingSubmissions.length}</p>
                        <p className="text-gray-600">Pending</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Points Awarded</h3>
                {recentPoints.length > 0 ? (
                    <div className="space-y-3">
                        {recentPoints.map(entry => (
                            <div key={entry.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                                <div>
                                    <p className="font-medium">{entry.user?.name}</p>
                                    <p className="text-sm text-gray-600">{entry.activityDescription}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">+{entry.points} pts</p>
                                    <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No recent points awarded.</p>
                )}
            </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Team Members ({teamMembers.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teamMembers.map(member => (
                        <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                    {member.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Announcements */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Announcements</h3>
                {announcements.length > 0 ? (
                    <div className="space-y-3">
                        {announcements.map(announcement => (
                            <div key={announcement.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                                <h4 className="font-medium text-blue-800">{announcement.title}</h4>
                                <p className="text-sm text-blue-700 mt-1">{announcement.content.substring(0, 100)}...</p>
                                <p className="text-xs text-blue-600 mt-2">
                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No announcements yet.</p>
                )}
            </div>

            {/* Pending Submissions */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Pending Submissions ({allPendingSubmissions.length})</h3>
                    {allPendingSubmissions.length > 3 && (
                        <button
                            onClick={() => setShowAllSubmissions(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            See All
                        </button>
                    )}
                </div>
                {pendingSubmissions.length > 0 ? (
                    <div className="space-y-3">
                        {pendingSubmissions.map(submission => (
                            <div key={submission.id} className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-orange-800">{submission.activity.title}</h4>
                                        <p className="text-sm text-orange-700 mt-1">
                                            by {submission.user.name} • {submission.activity.points} pts
                                        </p>
                                        <p className="text-xs text-orange-600 mt-1">
                                            {new Date(submission.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                        PENDING
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No pending submissions.</p>
                )}
            </div>

            {/* Approved Submissions History */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Approved History ({allApprovedSubmissions.length})</h3>
                    {allApprovedSubmissions.length > 3 && (
                        <button
                            onClick={() => setShowAllApprovedSubmissions(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            See All
                        </button>
                    )}
                </div>
                {approvedSubmissions.length > 0 ? (
                    <div className="space-y-3">
                        {approvedSubmissions.map(submission => (
                            <div key={submission.id} className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-green-800">{submission.activity.title}</h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            by {submission.user.name} • {submission.activity.points} pts
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Approved: {new Date(submission.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                        APPROVED
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No approved submissions yet.</p>
                )}
            </div>
        </div>

        {/* See All Submissions Modal */}
        {showAllSubmissions && (
            <div 
                className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out"
                onClick={() => setShowAllSubmissions(false)}
            >
                <div 
                    className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-w-4xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 ease-out scale-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">📋 All Pending Submissions</h2>
                                <p className="text-orange-100 text-sm mt-1">{allPendingSubmissions.length} submissions awaiting review</p>
                            </div>
                            <button
                                onClick={() => setShowAllSubmissions(false)}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                        {allPendingSubmissions.length > 0 ? (
                            <div className="space-y-4">
                                {allPendingSubmissions.map(submission => (
                                    <SubmissionCard 
                                        key={submission.id}
                                        submission={submission}
                                        onApprove={(submissionId, points) => {
                                            handleApproveSubmission(submissionId, points);
                                            // Close modal if no more submissions
                                            if (allPendingSubmissions.length === 1) {
                                                setShowAllSubmissions(false);
                                            }
                                        }}
                                        onReject={(submissionId, reason) => {
                                            handleRejectSubmission(submissionId, reason);
                                            // Close modal if no more submissions
                                            if (allPendingSubmissions.length === 1) {
                                                setShowAllSubmissions(false);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg">No pending submissions</p>
                                <p className="text-sm">All submissions have been reviewed.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* See All Approved Submissions Modal */}
        {showAllApprovedSubmissions && (
            <div 
                className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out"
                onClick={() => setShowAllApprovedSubmissions(false)}
            >
                <div 
                    className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-w-4xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 ease-out scale-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">✅ Approved Submissions History</h2>
                                <p className="text-green-100 text-sm mt-1">{allApprovedSubmissions.length} approved submissions</p>
                            </div>
                            <button
                                onClick={() => setShowAllApprovedSubmissions(false)}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                        {allApprovedSubmissions.length > 0 ? (
                            <div className="space-y-4">
                                {allApprovedSubmissions.map(submission => (
                                    <ApprovedSubmissionCard 
                                        key={submission.id}
                                        submission={submission}
                                        onUnapprove={handleUnapproveSubmission}
                                        onDelete={handleDeleteSubmission}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg">No approved submissions</p>
                                <p className="text-sm">No submissions have been approved yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
);

const PointsManagement = ({ 
    teamMembers, allStudents, pointsHistory, pointsForm, setPointsForm, 
    showPointsForm, setShowPointsForm, handleAwardPoints, handleDeletePoints 
}) => (
    <div className="space-y-6">
        {/* Award Points Section */}
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Award Manual Points</h2>
                <button
                    onClick={() => setShowPointsForm(!showPointsForm)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                    {showPointsForm ? 'Cancel' : '+ Award Points'}
                </button>
            </div>
            
            {showPointsForm && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Student *
                        </label>
                        <select
                            value={pointsForm.userId}
                            onChange={(e) => setPointsForm({...pointsForm, userId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Choose a student...</option>
                            {console.log('🔍 All students for dropdown:', allStudents)}
                            {allStudents.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.name} {student.team ? `(${student.team.name})` : '(No Team)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Description *
                        </label>
                        <input
                            type="text"
                            value={pointsForm.activityDescription}
                            onChange={(e) => setPointsForm({...pointsForm, activityDescription: e.target.value})}
                            placeholder="e.g., Helped with fundraising event"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points to Award *
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="number"
                                value={pointsForm.points}
                                onChange={(e) => setPointsForm({...pointsForm, points: e.target.value})}
                                placeholder="Points"
                                min="1"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                onClick={handleAwardPoints}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                            >
                                Award
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Points History */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Points History</h2>
            {pointsHistory.length > 0 ? (
                <div className="space-y-4">
                    {pointsHistory.map(entry => (
                        <div key={entry.id} className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{entry.user?.name}</p>
                                <p className="text-sm text-gray-600">{entry.activityDescription}</p>
                                <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">+{entry.points} pts</p>
                                </div>
                                <button
                                    onClick={() => handleDeletePoints(entry.id)}
                                    className="text-red-600 hover:text-red-800 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                    title="Delete this points award"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No points awarded yet.</p>
            )}
        </div>
    </div>
);

const AnnouncementsTab = ({ 
    announcements, newAnnouncement, setNewAnnouncement, 
    showAnnouncementForm, setShowAnnouncementForm, 
    handleCreateAnnouncement, handleDeleteAnnouncement 
}) => (
    <div className="space-y-6">
        {/* Create Announcement */}
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Team Announcements</h2>
                <button
                    onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    {showAnnouncementForm ? 'Cancel' : '+ New Announcement'}
                </button>
            </div>
            
            {showAnnouncementForm && (
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Announcement title..."
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                        placeholder="Announcement content..."
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleCreateAnnouncement}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                    >
                        Post Announcement
                    </button>
                </div>
            )}
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">All Announcements</h3>
            {announcements.length > 0 ? (
                <div className="space-y-4">
                    {announcements.map(announcement => (
                        <div key={announcement.id} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800">{announcement.title}</h4>
                                    <p className="text-blue-700 mt-2">{announcement.content}</p>
                                    <p className="text-xs text-blue-600 mt-3">
                                        By {announcement.createdBy?.name || 'Coach'} • {new Date(announcement.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    className="text-red-500 hover:text-red-700 ml-4 p-1"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No announcements yet.</p>
            )}
        </div>
    </div>
);

const SubmissionsTab = ({ 
    pendingSubmissions, 
    approvedSubmissions, 
    handleApproveSubmission, 
    handleRejectSubmission, 
    handleUnapproveSubmission, 
    handleDeleteSubmission 
}) => {
    const [showAllPending, setShowAllPending] = useState(false);
    const [showAllApproved, setShowAllApproved] = useState(false);

    // Show first 5 by default
    const displayedPending = showAllPending ? pendingSubmissions : pendingSubmissions.slice(0, 5);
    const displayedApproved = showAllApproved ? approvedSubmissions : approvedSubmissions.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Pending Submissions Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Pending Submissions ({pendingSubmissions.length})</h2>
                    {pendingSubmissions.length > 5 && (
                        <button
                            onClick={() => setShowAllPending(!showAllPending)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            {showAllPending ? 'Show Less' : `See All (${pendingSubmissions.length})`}
                        </button>
                    )}
                </div>
                
                {displayedPending.length > 0 ? (
                    <div className="space-y-6">
                        {displayedPending.map(submission => (
                            <SubmissionCard 
                                key={submission.id}
                                submission={submission}
                                onApprove={handleApproveSubmission}
                                onReject={handleRejectSubmission}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No pending submissions</p>
                        <p className="text-sm">All submissions have been reviewed.</p>
                    </div>
                )}
            </div>

            {/* Approved Submissions History Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Approved Submissions History ({approvedSubmissions.length})</h2>
                    {approvedSubmissions.length > 5 && (
                        <button
                            onClick={() => setShowAllApproved(!showAllApproved)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            {showAllApproved ? 'Show Less' : `See All (${approvedSubmissions.length})`}
                        </button>
                    )}
                </div>
                
                {displayedApproved.length > 0 ? (
                    <div className="space-y-6">
                        {displayedApproved.map(submission => (
                            <ApprovedSubmissionCard 
                                key={submission.id}
                                submission={submission}
                                onUnapprove={handleUnapproveSubmission}
                                onDelete={handleDeleteSubmission}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No approved submissions</p>
                        <p className="text-sm">No submissions have been approved yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add the SubmissionCard component
const SubmissionCard = ({ submission, onApprove, onReject }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    // Add this helper variable to determine if it's a photo submission
    const isPhotoSubmission = submission.submissionData && 
                              (submission.submissionData.photo || submission.submissionData.photoUrl);

    const handleApprove = () => {
        onApprove(submission.id, submission.activity.points);
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        onReject(submission.id, rejectReason);
        setShowRejectForm(false);
        setRejectReason('');
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h4 className="font-semibold text-lg">{submission.activity.title}</h4>
                    <p className="text-sm text-gray-600">
                        by {submission.user.name} • {submission.activity.points} points
                    </p>
                    <p className="text-xs text-gray-500">
                        {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                    PENDING
                </span>
            </div>

            {/* Toggle Details Button */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 text-sm mb-3 hover:underline"
            >
                {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {/* Submission Details */}
            {showDetails && (
                <div className="mb-4 p-3 bg-white rounded border">
                    <p className="text-sm mb-2"><strong>Activity:</strong> {submission.activity.description}</p>
                    
                    {submission.notes && (
                        <p className="text-sm mb-2"><strong>Student Notes:</strong> {submission.notes}</p>
                    )}

                    {/* Photo Submission */}
                    {isPhotoSubmission && (
                        <div className="mt-3">
                            <p className="text-sm mb-2"><strong>Photo Submission:</strong></p>
                            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                                onClick={() => window.open(submission.submissionData.photo || submission.submissionData.photoUrl, '_blank')}>
                                <img 
                                    src={submission.submissionData.photo || submission.submissionData.photoUrl}
                                    alt="Submission Photo"
                                    className="w-full h-auto max-h-64 object-contain transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                        console.error("Image failed to load");
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23eee'/%3E%3Ctext x='200' y='150' font-size='16' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                                        e.target.style.backgroundColor = '#f0f0f0';
                                    }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2">
                                    Click to view full size
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Non-Photo Submission Data */}
                    {!isPhotoSubmission && submission.submissionData && 
                     Object.keys(submission.submissionData).length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm mb-2"><strong>Submission Data:</strong></p>
                            <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(submission.submissionData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Rest of your component remains unchanged */}
            {/* Rejection Form */}
            {showRejectForm && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <label className="block text-sm font-medium text-red-700 mb-2">
                        Reason for rejection:
                    </label>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2 border border-red-300 rounded text-sm"
                        rows="2"
                        placeholder="Please explain why this submission is being rejected..."
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleReject}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                            Confirm Reject
                        </button>
                        <button
                            onClick={() => {
                                setShowRejectForm(false);
                                setRejectReason('');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {!showRejectForm && (
                <div className="flex gap-2">
                    <button
                        onClick={handleApprove}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                        ✅ Approve ({submission.activity.points} pts)
                    </button>
                    <button
                        onClick={() => setShowRejectForm(true)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                        ❌ Reject
                    </button>
                </div>
            )}
        </div>
    );
};

// Approved Submission Card Component
const ApprovedSubmissionCard = ({ submission, onUnapprove, onDelete }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Helper variable to determine if it's a photo submission
    const isPhotoSubmission = submission.submissionData && 
                              (submission.submissionData.photo || submission.submissionData.photoUrl);

    const handleUnapprove = () => {
        onUnapprove(submission.id);
    };

    const handleDelete = () => {
        onDelete(submission.id);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h4 className="font-semibold text-lg text-green-800">{submission.activity.title}</h4>
                    <p className="text-sm text-green-700">
                        by {submission.user.name} • {submission.activity.points} points awarded
                    </p>
                    <p className="text-xs text-green-600">
                        Approved: {new Date(submission.updatedAt).toLocaleDateString()}
                    </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    ✅ APPROVED
                </span>
            </div>

            {/* Toggle Details Button */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 text-sm mb-3 hover:underline"
            >
                {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {/* Submission Details */}
            {showDetails && (
                <div className="mb-4 p-3 bg-white rounded border">
                    <p className="text-sm mb-2"><strong>Activity:</strong> {submission.activity.description}</p>
                    
                    {submission.notes && (
                        <p className="text-sm mb-2"><strong>Student Notes:</strong> {submission.notes}</p>
                    )}

                    {submission.reviewNotes && (
                        <p className="text-sm mb-2"><strong>Review Notes:</strong> {submission.reviewNotes}</p>
                    )}

                    {/* Photo Submission */}
                    {isPhotoSubmission && (
                        <div className="mt-3">
                            <p className="text-sm mb-2"><strong>Photo Submission:</strong></p>
                            <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                                onClick={() => window.open(submission.submissionData.photo || submission.submissionData.photoUrl, '_blank')}>
                                <img 
                                    src={submission.submissionData.photo || submission.submissionData.photoUrl}
                                    alt="Submission Photo"
                                    className="w-full h-auto max-h-64 object-contain transition-transform group-hover:scale-105"
                                    onError={(e) => {
                                        console.error("Image failed to load");
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23eee'/%3E%3Ctext x='200' y='150' font-size='16' text-anchor='middle' alignment-baseline='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                                        e.target.style.backgroundColor = '#f0f0f0';
                                    }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2">
                                    Click to view full size
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Non-Photo Submission Data */}
                    {!isPhotoSubmission && submission.submissionData && 
                     Object.keys(submission.submissionData).length > 0 && (
                        <div className="mt-3">
                            <p className="text-sm mb-2"><strong>Submission Data:</strong></p>
                            <pre className="p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(submission.submissionData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleUnapprove}
                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-yellow-700 transition-colors"
                >
                    ↩️ Unapprove (-{submission.activity.points} pts)
                </button>
                <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                    🗑️ Delete
                </button>
            </div>
        </div>
    );
};

export default CoachDashboard;