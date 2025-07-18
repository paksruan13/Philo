import React, {useState, useEffect} from "react";
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard = () => {
    const [teamData, setTeamData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    if (loading) return <div className= "flex justify-center p-8">Loading...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    if(!teamData) return <div className="p-4">No team assigned</div>

    return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Team Dashboard</h1>
      
      {/* Team Overview */}
      <TeamOverviewCard team={teamData.team} stats={teamData.stats} />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <FinancialSummary stats={teamData.stats} recentDonations={teamData.recentDonations} />
        <ActivitySummary activities={activities} stats={teamData.stats} />
        <TeamMembersCard members={teamData.members} />
      </div>
      
      {/* Activities Feed */}
      <ActivitiesFeed activities={activities} />
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

const ActivitySummary = ({ activities, stats }) => {
  const completedCount = activities.filter(a => a.submissionStatus === 'APPROVED').length;
  const pendingCount = activities.filter(a => a.submissionStatus === 'PENDING').length;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">🎯 Activities</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Completed:</span>
          <span className="font-bold text-green-600">{completedCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Pending:</span>
          <span className="font-bold text-yellow-600">{pendingCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Available:</span>
          <span className="font-bold text-blue-600">{activities.length}</span>
        </div>
      </div>
    </div>
  );
};

const TeamMembersCard = ({ members }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h3 className="text-xl font-bold mb-4">👥 Team Members</h3>
    <div className="space-y-2">
      {members.map(member => (
        <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <div>
            <div className="font-semibold">{member.name}</div>
            <div className="text-sm text-gray-600">{member.contributions.points} pts</div>
          </div>
          <div className="text-sm">
            ${member.contributions.donations.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ActivitiesFeed = ({ activities }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h3 className="text-xl font-bold mb-4">📋 Available Activities</h3>
    <div className="space-y-4">
      {activities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  </div>
);

const ActivityCard = ({ activity }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="border p-4 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg">{activity.title}</h4>
          <p className="text-gray-600">{activity.description}</p>
          <div className="text-sm text-gray-500 mt-2">
    
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{activity.points} pts</div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.submissionStatus)}`}>
            {activity.submissionStatus.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;