import React, {useState, useEffect} from "react";
import { useAuth } from '../../contexts/AuthContext';
import ActivitySubmission from "./ActivitySubmission";

const StudentDashboard = () => {
    const [teamData, setTeamData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('dashboard'); 
    const { token } = useAuth();

    useEffect(() => {
        fetchTeamDashboard();
        fetchTeamActivities();
    }, []);

    const fetchTeamDashboard = async () => {
        try {
            const response = await fetch('http://localhost:4243/api/teams/my-team', {
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
            const response = await fetch('http://localhost:4243/api/teams/my-team/activities', {
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
      setCurrentView(`activity-submission-${activityId}`);
    }
 
    if (loading) return <div className= "flex justify-center p-8">Loading...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    if(!teamData) return <div className="p-4">No team assigned</div>

    if(currentView.startsWith('activity-submission-')) {
      const activityId = currentView.replace('activity-submission-', '');
      return (
        <ActivitySubmission 
          activityId={activityId} 
          onBack={() => setCurrentView('dashboard')} 
        />
      )
    }

    return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Team Dashboard</h1>
      
      {/* Team Overview */}
      <TeamOverviewCard team={teamData.team} stats={teamData.stats} />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FinancialSummary stats={teamData.stats} recentDonations={teamData.recentDonations} />
        <ActivitySummary activities={activities} stats={teamData.stats} onActivitySubmit={handleActivitySubmission} />
        <TeamMembersCard members={teamData.team?.members} />
        <PhotoGallery photos={teamData.photos} />
      </div>
    </div>
  );
};


const TeamOverviewCard = ({ team, stats }) => (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl mb-6">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold">{team.name}</h2>
        <p className="text-blue-100">Code: {team.teamCode}</p>
        {team.coach && <p className="text-blue-100">Coach: {team.coach.name}</p>}
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold">{stats.totalPoints}</div>
        <div className="text-blue-100">Total Points</div>
        <div className="text-lg">Rank #{stats.rank} of {stats.totalTeams}</div>
      </div>
    </div>
  </div>
);

const PhotoGallery = ({ photos }) => {
  const validPhotos = photos?.filter(p => p.url) || [];
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">📸 Recent Photos</h3>
      <div className="text-3xl font-bold text-blue-600 mb-2">
        {validPhotos.length}
      </div>
      <p className="text-gray-600 mb-4">Team Photos</p>
      
      {validPhotos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {validPhotos.slice(0, 4).map((photo, index) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square bg-gray-100"
              onClick={() => window.open(photo.url, '_blank')}
            >
              <img
                src={photo.url}
                alt={`Team photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-300 text-4xl mb-2">📷</div>
          <p className="text-gray-500 text-sm">No photos uploaded yet</p>
        </div>
      )}
    </div>
  );
};

const FinancialSummary = ({ stats, recentDonations }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h3 className="text-xl font-bold mb-4">💰 Donations</h3>
    <div className="text-3xl font-bold text-green-600 mb-2">
      ${stats.totalDonations.toFixed(2)}
    </div>
    <p className="text-gray-600 mb-4">Total Raised</p>
    
    {recentDonations.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Recent Donations:</h4>
        {recentDonations.map(donation => (
          <div key={donation.id} className="text-sm text-gray-600">
            ${donation.amount} from {donation.user ? `from ${donation.user.name}` : 'Anonymous'} 
          </div>
        ))}
      </div>
    )}
  </div>
);

const ActivitySummary = ({ activities, stats, onActivitySubmit }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h3 className="text-xl font-bold mb-4">📋 Activities</h3>
    <div className="text-3xl font-bold text-purple-600 mb-2">
      {stats.activityCount}
    </div>
    <p className="text-gray-600 mb-4">Completed</p>
    
    {activities.length > 0 && (
      <div>
        <h4 className="font-semibold mb-2">Available Activities:</h4>
        <div className="space-y-2">
          {activities.slice(0, 3).map(activity => (
            <div key={activity.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-sm">{activity.title}</div>
                <div className="text-xs text-gray-500">{activity.points} pts</div>
              </div>
              <button
                onClick={() => onActivitySubmit(activity.id)} // ← Changed from Link to button
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  activity.submissionStatus === 'NOT_SUBMITTED' 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : activity.submissionStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : activity.submissionStatus === 'APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {activity.submissionStatus === 'NOT_SUBMITTED' ? 'Submit' : activity.submissionStatus}
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const TeamMembersCard = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">👥 Team Members</h3>
        <p className="text-gray-500">No team members to display</p>
      </div>
    );
  }
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">👥 Team Members</h3>
      <div className="space-y-2">
      {members.map(member => (
        <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <div>
            <div className="font-semibold">{member.name}</div>
            <div className="text-sm text-gray-600">{member.email}</div>
          </div>
          {member.role === 'COACH' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Coach
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);
}

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

  const isPurchaseActivity = activity.category?.name?.toLowerCase() === 'purchase';
  const isDonationActivity = activity.category?.name?.toLowerCase() === 'donation';
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
                {activity.category.name}
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