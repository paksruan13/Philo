import React, {useState, useEffect} from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES } from '../../services/api';

const StudentDashboard = () => {
    const [teamData, setTeamData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTeamDashboard();
        fetchTeamActivities();
    }, []);

    const fetchTeamDashboard = async () => {
        try {
            const response = await fetch(API_ROUTES.teams.myTeam, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if(response.ok) {
                const data = await response.json();
                setTeamData(data);
            } else {
                setError('Failed to fetch team data');
            }
        } catch (err) {
            setError('Error fetching team data');
            console.error('Error', err);
        }
    };

    const fetchTeamActivities = async () => {
        try {
            const response = await fetch(API_ROUTES.teams.activities(), {
                headers: { 'Authorization': `Bearer ${token}`}
            });

            if(response.ok) {
                const data = await response.json();
                setActivities(data);
            } 
        } catch (error) {
            console.error('Error fetching team activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivitySubmission = (activityId) => {
        navigate(`/dashboard/student/activity/${activityId}`);
    };
 
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="card-base p-8 text-center space-y-4 pulse-glow">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto animate-pulse"></div>
                    <h3 className="text-xl font-semibold text-foreground">Loading your dashboard...</h3>
                    <p className="text-muted-foreground">Gathering your team's latest data</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="card-base p-8 text-center space-y-4 max-w-md">
                    <div className="text-6xl">⚠️</div>
                    <h3 className="text-xl font-semibold text-destructive">Dashboard Error</h3>
                    <p className="text-muted-foreground">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-primary px-6 py-3"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!teamData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="card-base p-8 text-center space-y-4 max-w-md">
                    <div className="text-6xl">👥</div>
                    <h3 className="text-xl font-semibold text-foreground">No Team Assigned</h3>
                    <p className="text-muted-foreground">You haven't been assigned to a team yet. Please contact your coach.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-primary/5 border-b border-border/30">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-2xl text-primary-foreground">🎯</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gradient-primary">Team Dashboard</h1>
                            <p className="text-muted-foreground">Track your progress and team achievements</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 space-y-8">
                {/* Team Overview */}
                <TeamOverviewCard team={teamData.team} stats={teamData.stats} />
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FinancialSummary stats={teamData.stats} recentDonations={teamData.recentDonations} />
                    <ShirtSummary stats={teamData.stats} />
                    <ActivitySummary activities={activities} stats={teamData.stats} onActivitySubmit={handleActivitySubmission} />
                    <TeamMembersCard members={teamData.team?.members} />
                </div>
                
                {/* Photo Gallery */}
                <PhotoGallery photos={teamData.photos} />
            </div>
        </div>
    );
};

const TeamOverviewCard = ({ team, stats }) => (
    <div className="relative overflow-hidden card-base border-2 border-primary/20 hover-lift group">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        
        {/* Content */}
        <div className="relative p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Team Info */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl text-primary-foreground">🏆</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gradient-primary">{team.name}</h2>
                            <div className="flex items-center space-x-4 text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                    <span>🔑</span>
                                    <span className="font-medium">Code: {team.teamCode}</span>
                                </div>
                                {team.coach && (
                                    <div className="flex items-center space-x-2">
                                        <span>👨‍🏫</span>
                                        <span className="font-medium">Coach: {team.coach.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-secondary/30 rounded-xl p-6 text-center space-y-3">
                    <div className="text-4xl font-bold text-gradient-primary">{stats.totalPoints}</div>
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Points</div>
                    <div className="badge-base bg-gradient-accent text-accent-foreground">
                        🥇 Rank #{stats.rank} of {stats.totalTeams}
                    </div>
                </div>
            </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none"></div>
    </div>
);

const PhotoGallery = ({ photos }) => {
    const validPhotos = photos?.filter(p => p.url) || [];
    
    return (
        <div className="card-base hover-lift group">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-xl text-white">📸</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Team Photos</h3>
                            <p className="text-sm text-muted-foreground">
                                {validPhotos.length} {validPhotos.length === 1 ? 'photo' : 'photos'} uploaded
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gradient-primary">
                            {validPhotos.length}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Photos
                        </div>
                    </div>
                </div>
                
                {/* Photo Grid */}
                {validPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {validPhotos.slice(0, 8).map((photo, index) => (
                            <div
                                key={photo.id}
                                className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square bg-secondary/30 hover-lift"
                                onClick={() => window.open(photo.url, '_blank')}
                            >
                                <img
                                    src={photo.url}
                                    alt={`Team photo ${index + 1}`}
                                    className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                                    loading="lazy"
                                />
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth">
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="text-white text-xs font-medium">
                                            Photo #{index + 1}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-4">
                        <div className="text-6xl">📷</div>
                        <div>
                            <h4 className="text-lg font-semibold text-foreground">No Photos Yet</h4>
                            <p className="text-muted-foreground">Upload photos to share your team's journey</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const FinancialSummary = ({ stats, recentDonations }) => (
    <div className="card-base hover-lift group">
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl text-white">💰</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Donations</h3>
                    <p className="text-sm text-muted-foreground">Total raised by your team</p>
                </div>
            </div>

            {/* Amount */}
            <div className="text-center py-4">
                <div className="text-4xl font-bold text-gradient-primary">
                    ${stats.totalDonations.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                    Total Raised
                </div>
            </div>
            
            {/* Recent Donations */}
            {recentDonations?.length > 0 ? (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                        <span>📈</span>
                        <span>Recent Donations</span>
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {recentDonations.map(donation => (
                            <div key={donation.id} className="bg-secondary/30 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">
                                        ${donation.amount}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {donation.user ? donation.user.name : 'Anonymous'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="text-2xl">🎯</div>
                    <p className="text-xs text-muted-foreground">No donations yet</p>
                </div>
            )}
        </div>
    </div>
);

const ShirtSummary = ({ stats }) => {
    const totalContributed = (stats.totalDonations || 0) + (stats.totalShirtRevenue || 0) + (stats.totalProductRevenue || 0);
    
    return (
        <div className="card-base hover-lift group">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-xl text-white">�️</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Total Contribution</h3>
                        <p className="text-sm text-muted-foreground">All team contributions</p>
                    </div>
                </div>

                {/* Total Amount */}
                <div className="text-center py-4">
                    <div className="text-4xl font-bold text-gradient-primary">
                        ${totalContributed.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                        Total Contributed
                    </div>
                </div>
                
                {/* Breakdown */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                        <span>📊</span>
                        <span>Breakdown</span>
                    </h4>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-secondary/30 rounded-lg">
                            <span className="text-sm text-muted-foreground flex items-center space-x-2">
                                <span>💰</span>
                                <span>Donations</span>
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                ${(stats.totalDonations || 0).toFixed(2)}
                            </span>
                        </div>
                        
                        {stats.totalShirtRevenue > 0 && (
                            <div className="flex justify-between items-center p-2 bg-secondary/30 rounded-lg">
                                <span className="text-sm text-muted-foreground flex items-center space-x-2">
                                    <span>👕</span>
                                    <span>Shirts</span>
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    ${(stats.totalShirtRevenue || 0).toFixed(2)}
                                </span>
                            </div>
                        )}
                        
                        {stats.totalProductRevenue > 0 && (
                            <div className="flex justify-between items-center p-2 bg-secondary/30 rounded-lg">
                                <span className="text-sm text-muted-foreground flex items-center space-x-2">
                                    <span>🛒</span>
                                    <span>Products</span>
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    ${(stats.totalProductRevenue || 0).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivitySummary = ({ activities, stats, onActivitySubmit }) => (
    <div className="card-base hover-lift group">
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl text-white">📋</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Activities</h3>
                    <p className="text-sm text-muted-foreground">Track your submissions</p>
                </div>
            </div>

            {/* Count */}
            <div className="text-center py-4">
                <div className="text-4xl font-bold text-gradient-primary">
                    {stats.activityCount}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                    Completed
                </div>
            </div>
            
            {/* Activities List */}
            {activities?.length > 0 ? (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                        <span>⚡</span>
                        <span>Available Activities</span>
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {activities.slice(0, 3).map((activity, index) => {
                            const colorSchemes = [
                                'from-blue-400/20 to-cyan-400/20 border-blue-300/30',
                                'from-green-400/20 to-emerald-400/20 border-green-300/30',
                                'from-purple-400/20 to-pink-400/20 border-purple-300/30'
                            ];
                            const currentScheme = colorSchemes[index % colorSchemes.length];
                            
                            return (
                                <div key={activity.id} className={`bg-gradient-to-r ${currentScheme} border rounded-lg p-3 space-y-2 hover:shadow-md transition-smooth`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {activity.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center space-x-1">
                                                <span>⭐</span>
                                                <span>{activity.points} points</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onActivitySubmit(activity.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-smooth shadow-sm ${
                                                activity.submissionStatus === 'NOT_SUBMITTED' 
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' 
                                                    : activity.submissionStatus === 'PENDING'
                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                                                    : activity.submissionStatus === 'APPROVED'
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                            }`}
                                        >
                                            {activity.submissionStatus === 'NOT_SUBMITTED' ? 'Submit' : activity.submissionStatus}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="text-2xl">📝</div>
                    <p className="text-xs text-muted-foreground">No activities available</p>
                </div>
            )}
        </div>
    </div>
);

const TeamMembersCard = ({ members }) => {
    if (!members || members.length === 0) {
        return (
            <div className="card-base hover-lift">
                <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-xl text-white">👥</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Team Members</h3>
                            <p className="text-sm text-muted-foreground">Your teammates</p>
                        </div>
                    </div>
                    <div className="text-center py-8">
                        <div className="text-3xl">👋</div>
                        <p className="text-muted-foreground">No team members to display</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card-base hover-lift group">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-xl text-white">👥</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Team Members</h3>
                        <p className="text-sm text-muted-foreground">{members.length} teammates</p>
                    </div>
                </div>

                {/* Members List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {members.map(member => (
                        <div key={member.id} className="bg-secondary/30 rounded-lg p-4 hover:bg-secondary/40 transition-smooth">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="font-semibold text-foreground flex items-center space-x-2">
                                        <span className="text-base">
                                            {member.role === 'STUDENT' ? '👨‍🎓' : member.role === 'COACH' ? '👨‍🏫' : '👤'}
                                        </span>
                                        <span>{member.name}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                        {member.role.toLowerCase()}
                                    </div>
                                </div>
                                
                                {member.contributions && (
                                    <div className="text-right space-y-1">
                                        <div className="badge-base bg-primary/20 text-primary text-xs">
                                            {(member.contributions.totalPoints || member.contributions.activityPoints || member.contributions.points || 0)} pts
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ${((member.contributions.donations || 0) + 
                                               (member.contributions.totalPurchasesSpent || member.contributions.shirtSpent || 0)
                                             ).toFixed(2)} contributed
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Replace your ActivityCard component with this fixed version
const ActivityCard = ({ activity, onActivitySubmit }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const isPurchaseActivity = activity.categoryType === 'PURCHASE';
  const isPhotoActivity = activity.categoryType === 'PHOTO';
  const isDonationActivity = activity.categoryType === 'DONATION'
  const hasOnlinePurchase = activity.allowOnlinePurchase === true;

  const handleOnlineAction = (activity) => {
    const isPurchaseActivity = activity.category?.name?.toLowerCase() === 'purchase';
    const url = isPurchaseActivity ? 'https://your-school-store.com' : 'https://your-donation-platform.com';
    
    window.open(url, '_blank');
    
    alert(`After completing your ${isPurchaseActivity ? 'purchase' : 'donation'}, return here to submit your ${isPurchaseActivity ? 'receipt' : 'confirmation'} for "${activity.title}"`);
  };

  return (
    <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-lg">{activity.title}</h4>
            {activity.category && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {activity.categoryType}
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-2">{activity.description}</p>
          
          {activity.createdBy && (
            <div className="text-sm text-gray-500 mb-2">
              Created by {activity.createdBy.name}
            </div>
          )}
        </div>
        
        <div className="text-right ml-4">
          <div className="font-bold text-lg text-purple-600">{activity.points} pts</div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.submissionStatus)}`}>
            {activity.submissionStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Purchase/Donation Activity with Online Option */}
      {(isPurchaseActivity || isDonationActivity) && hasOnlinePurchase && (
        <div className="bg-blue-50 p-3 rounded-lg mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold">
              {isPurchaseActivity ? '🛒 Purchase Activity' : '💰 Donation Activity'}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              🌐 Online Available
            </span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            {isPurchaseActivity 
              ? 'This activity supports online purchasing. You can buy online or submit a receipt from elsewhere.'
              : 'This activity supports online donations. You can donate online or submit confirmation from elsewhere.'
            }
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleOnlineAction(activity)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              {isPurchaseActivity ? '🛒 Purchase Online' : '💰 Donate Online'}
            </button>
            
            {activity.submissionStatus === 'NOT_SUBMITTED' && (
              <button
                onClick={() => onActivitySubmit(activity.id)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                📄 Submit {isPurchaseActivity ? 'Receipt' : 'Confirmation'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Purchase/Donation Activity WITHOUT Online Option */}
      {(isPurchaseActivity || isDonationActivity) && !hasOnlinePurchase && (
        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-600 font-semibold">
              {isPurchaseActivity ? '🛒 Purchase Activity' : '💰 Donation Activity'}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
              In-Person Only
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {isPurchaseActivity 
              ? 'Complete your purchase through other means and upload your receipt.'
              : 'Complete your donation through other means and upload your confirmation.'
            }
          </p>
          
          {activity.submissionStatus === 'NOT_SUBMITTED' && (
            <button
              onClick={() => onActivitySubmit(activity.id)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              📄 Submit {isPurchaseActivity ? 'Receipt' : 'Confirmation'}
            </button>
          )}
        </div>
      )}

      {/* Regular Activity UI */}
      {!isPurchaseActivity && !isDonationActivity && activity.submissionStatus === 'NOT_SUBMITTED' && (
        <div className="mt-3">
          <button
            onClick={() => onActivitySubmit(activity.id)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            📝 Submit Activity
          </button>
        </div>
      )}

      {/* Show submission status for completed activities */}
      {activity.submissionStatus !== 'NOT_SUBMITTED' && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-semibold ${getStatusColor(activity.submissionStatus).split(' ')[0]}`}>
              {activity.submissionStatus}
            </span>
          </div>
          {activity.submittedAt && (
            <div className="flex justify-between">
              <span>Submitted:</span>
              <span>{new Date(activity.submittedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add the handleOnlineAction function to your StudentDashboard component
const handleOnlineAction = (activity) => {
  const isPurchaseActivity = activity.category?.name?.toLowerCase() === 'purchase';
  const url = isPurchaseActivity ? 'https://your-school-store.com' : 'https://your-donation-platform.com';
  
  window.open(url, '_blank');
  
  alert(`After completing your ${isPurchaseActivity ? 'purchase' : 'donation'}, return here to submit your ${isPurchaseActivity ? 'receipt' : 'confirmation'} for "${activity.title}"`);
};

export default StudentDashboard;