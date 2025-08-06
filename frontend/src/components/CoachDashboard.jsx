import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CoachDashboard = ({onNavigate}) => {
    const { user } = useAuth();
    const [teamData, setTeamData] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
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
        notes: ''
    });

    console.log('🏆 CoachDashboard rendering with user:', user);

    // Fetch points history
    const fetchPointsHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:4243/coach/manual-points-history', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Points history received:', data);
                setPointsHistory(data);
            }
        } catch (error) {
            console.error('Error fetching points history:', error);
        }
    };

    // Award manual points
    const handleAwardPoints = async () => {
        if (!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points) {
            alert('Please fill in all required fields');
            return;
        }

        if (isNaN(pointsForm.points) || parseInt(pointsForm.points) <= 0) {
            alert('Please enter a valid positive number for points');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:4243/coach/manual-points', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: pointsForm.userId,
                    activityDescription: pointsForm.activityDescription,
                    points: parseInt(pointsForm.points),
                    notes: pointsForm.notes
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Successfully awarded ${pointsForm.points} points to ${teamMembers.find(m => m.id === pointsForm.userId)?.name}!`);
                setPointsForm({ userId: '', activityDescription: '', points: '', notes: '' });
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

    // Create announcement
    const handleCreateAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4243/api/teams/${teamData.id}/announcements`, {
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
            const response = await fetch(`http://localhost:4243/api/announcements/${announcementId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to delete announcement');
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            alert('Failed to delete announcement');
        }
    };

    const fetchPendingSubmissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:4243/api/coach/pending-submissions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Pending submissions received:', data);
                setPendingSubmissions(data);
            }
        } catch (error) {
            console.error('Error fetching pending submissions:', error);
        }
    };

    const handleApproveSubmission = async (submissionId, points) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4243/api/coach/submissions/${submissionId}/approve`, {
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
                fetchPendingSubmissions(); // Refresh submissions
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
            const response = await fetch(`http://localhost:4243/api/coach/submissions/${submissionId}/reject`, {
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

    useEffect(() => {
        const fetchCoachTeamData = async () => {
            console.log('🔍 Starting fetchCoachTeamData...');
            
            try {
                if (!user) {
                    console.log('❌ No user found');
                    setError('User not authenticated');
                    setLoading(false);
                    return;
                }

                console.log('👤 Current user:', user);
                console.log('🎯 User role:', user.role);

                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('❌ No token found');
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
                console.log('📡 Fetching user info from /auth/me...');
                const userRes = await fetch(`http://localhost:4243/api/auth/me`, { headers });
                console.log('📡 User response status:', userRes.status);
                
                if (!userRes.ok) {
                    const errorText = await userRes.text();
                    console.log('❌ User fetch failed:', errorText);
                    throw new Error(`Failed to fetch user data: ${userRes.status} - ${errorText}`);
                }
                
                const userData = await userRes.json();
                console.log('✅ User data received:', userData);

                // Check if user has coached teams
                if (!userData.user.coachedTeams || userData.user.coachedTeams.length === 0) {
                    console.log('⚠️ No coached teams found for user');
                    setError('You are not assigned as a coach to any team. Please contact an administrator to assign you to a team.');
                    setLoading(false);
                    return;
                }

                // Get the first coached team
                const coachedTeam = userData.user.coachedTeams[0];
                console.log('🏆 Coached team found:', coachedTeam);
                
                // Fetch detailed team data from leaderboard
                console.log('📡 Fetching leaderboard data...');
                const leaderboardRes = await fetch(`http://localhost:4243/api/leaderboard`);
                console.log('📡 Leaderboard response status:', leaderboardRes.status);
                
                if (!leaderboardRes.ok) {
                    throw new Error('Failed to fetch leaderboard data');
                }
                
                const leaderboardData = await leaderboardRes.json();
                console.log('✅ Leaderboard data received:', leaderboardData.length, 'teams');
                
                const currentTeam = leaderboardData.find(team => team.id === coachedTeam.id);
                console.log('🔍 Found team in leaderboard:', currentTeam);
                
                if (!currentTeam) {
                    console.log('❌ Team not found in leaderboard');
                    setError('Team not found in leaderboard');
                    setLoading(false);
                    return;
                }
                
                console.log('✅ Setting team data:', currentTeam);
                setTeamData(currentTeam);

                // Fetch team members
                console.log('📡 Fetching team members...');
                const memberRes = await fetch(`http://localhost:4243/api/teams/${coachedTeam.id}/members`, { headers });
                console.log('📡 Members response status:', memberRes.status);
                
                if (!memberRes.ok) {
                    const errorText = await memberRes.text();
                    console.log('⚠️ Members fetch failed:', errorText);
                    setTeamMembers([]);
                } else {
                    const memberData = await memberRes.json();
                    console.log('✅ Team members received:', memberData);
                    setTeamMembers(memberData);
                }

                // Fetch announcements
                console.log('📡 Fetching announcements...');
                try {
                    const announcementRes = await fetch(`http://localhost:4243/api/teams/${coachedTeam.id}/announcements`);
                    if (announcementRes.ok) {
                        const announcementData = await announcementRes.json();
                        console.log('✅ Announcements received:', announcementData);
                        setAnnouncements(announcementData);
                    }
                } catch (err) {
                    console.log('⚠️ Failed to fetch announcements:', err);
                }

                // Fetch points history
                await fetchPointsHistory();

                // Fetch pending submissions
                await fetchPendingSubmissions();

                console.log('🎉 Coach dashboard data loaded successfully');

            } catch (error) {
                console.error('💥 Error in fetchCoachTeamData:', error);
                setError(error.message);
            } finally {
                console.log('🏁 Setting loading to false');
                setLoading(false);
            }
        };

        fetchCoachTeamData();
    }, [user]);

    console.log('🖼️ Rendering with state:', { loading, error, teamData: !!teamData, teamMembers: teamMembers.length });

    if (loading) {
        console.log('⏳ Showing loading...');
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
        console.log('❌ Showing error:', error);
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
        console.log('❌ No team data');
        return (
            <div className="text-center p-10">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <h3 className="font-bold">No Team Data</h3>
                    <p>Team data not found. Check console for debug info.</p>
                </div>
            </div>
        );
    }

    console.log('✅ Rendering full dashboard');
    return (
        <div className="bg-gray-50 min-h-screen">
          <main className="container mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
              
                {/* Left Column: Team Members */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Team Members ({teamMembers.length})</h2>
                  <ul className="space-y-4 max-h-96 overflow-y-auto">
                    {teamMembers.length > 0 ? teamMembers.map(member => (
                      <li key={member.id} className="border-b border-gray-200 pb-2">
                        <p className="font-semibold text-gray-700">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-blue-600">{member.role || 'STUDENT'}</p>
                      </li>
                    )) : (
                      <p className="text-gray-500">No members found.</p>
                    )}
                  </ul>
                </div>
    
                {/* Middle Column: Team Stats and Actions */}
                <div className="lg:col-span-1 space-y-8">
                
                  {/* Team Information Box */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Team: {teamData.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">Team Code: {teamData.teamCode || 'N/A'}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <p className="text-lg font-semibold text-blue-600">{teamData.memberCount}</p>
                          <p className="text-gray-600">Members</p>
                      </div>
                      <div>
                          <p className="text-lg font-semibold text-blue-600">{teamData.totalScore}</p>
                          <p className="text-gray-600">Total Points</p>
                      </div>
                      <div>
                          <p className="text-lg font-semibold text-green-600">${teamData.totalDonations?.toFixed(2) || '0.00'}</p>
                          <p className="text-gray-600">Donations Raised</p>
                      </div>
                      <div>
                          <p className="text-lg font-semibold text-yellow-600">{teamData.donationCount || 0}</p>
                          <p className="text-gray-600">Number of Donations</p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Points Award Section */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Award Points</h3>
                      <button
                        onClick={() => setShowPointsForm(!showPointsForm)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        {showPointsForm ? 'Cancel' : '+ Award Points'}
                      </button>
                    </div>
                    
                    {showPointsForm && (
                      <div className="space-y-4">
                        {/* Student Selection */}
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
                            {teamMembers.filter(member => member.role === 'STUDENT').map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Activity Description */}
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

                        {/* Points */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points to Award *
                          </label>
                          <input
                            type="number"
                            value={pointsForm.points}
                            onChange={(e) => setPointsForm({...pointsForm, points: e.target.value})}
                            placeholder="Enter points (e.g., 25)"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        {/* Notes (Optional) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes (Optional)
                          </label>
                          <textarea
                            value={pointsForm.notes}
                            onChange={(e) => setPointsForm({...pointsForm, notes: e.target.value})}
                            placeholder="Any additional details..."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <button
                          onClick={handleAwardPoints}
                          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-medium"
                        >
                          Award Points
                        </button>
                      </div>
                    )}

                    {/* Recent Points History */}
                    {pointsHistory.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Points Awarded</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {pointsHistory.slice(0, 3).map(entry => (
                            <div key={entry.id} className="text-xs bg-green-50 p-2 rounded">
                              <div className="font-medium">{entry.user.name} - {entry.points} pts</div>
                              <div className="text-gray-600">{entry.activityDescription}</div>
                              <div className="text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
    
                  {/* Photo Approval Section */}
                  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Photo Approval</h2>
                    <p className="text-gray-600 mb-4">
                      Review photos submitted by your team members.
                    </p>
                    <button
                      onClick={() => onNavigate('photo-approval')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Manage Photos
                    </button>
                  </div>

                  {/* Activity Submissions Review Section */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">
                        📋 Pending Submissions ({pendingSubmissions.length})
                    </h2>
                    
                    {pendingSubmissions.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {pendingSubmissions.map(submission => (
                                <SubmissionCard 
                                    key={submission.id}
                                    submission={submission}
                                    onApprove={handleApproveSubmission}
                                    onReject={handleRejectSubmission}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No pending submissions</p>
                        </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Announcements */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
                            <button
                                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                                {showAnnouncementForm ? 'Cancel' : '+ Add'}
                            </button>
                        </div>

                        {/* Announcement Form */}
                        {showAnnouncementForm && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Announcement title..."
                                        value={newAnnouncement.title}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <textarea
                                        placeholder="Announcement content..."
                                        value={newAnnouncement.content}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleCreateAnnouncement}
                                        className="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700"
                                    >
                                        Post Announcement
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Announcements List */}
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {announcements.length > 0 ? announcements.map(announcement => (
                                <div key={announcement.id} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-blue-800">{announcement.title}</h3>
                                            <p className="text-sm text-blue-700 mt-1">{announcement.content}</p>
                                            <p className="text-xs text-blue-600 mt-2">
                                                By {announcement.createdBy?.name || 'Coach'} • {new Date(announcement.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                                            className="text-red-500 hover:text-red-700 text-sm ml-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-4 bg-gray-100 rounded-lg">
                                    <p className="text-sm text-gray-600">No announcements yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
          </main>
        </div>
      );
};

// Add the SubmissionCard component
const SubmissionCard = ({ submission, onApprove, onReject }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

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

                    {submission.submissionData && (
                        <div className="text-sm">
                            <strong>Submission Data:</strong>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(submission.submissionData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

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

export default CoachDashboard;