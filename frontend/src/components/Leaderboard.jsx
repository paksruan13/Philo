import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";

const Leaderboard = () => {
    const [teams, setTeams] = useState([]);
    const [teamAnnouncements, setTeamAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const { socket, connected } = useSocket();
    const { user } = useAuth();

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('http://localhost:4243/api/leaderboard');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setTeams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamAnnouncements = async () => {
        const teamId = user?.team?.id || user?.teamId;
        if (!teamId) {
            setTeamAnnouncements([]);
            return;
        }
        try {
            const response = await fetch(`http://localhost:4243/api/announcements/teams/${teamId}`);
            console.log(`Id being used: ${teamId}`);
            if (response.ok) {
                const announcements = await response.json();
                setTeamAnnouncements(announcements);
            }
        } catch (error) {
            console.error('Error fetching team announcements:', error);
            setTeamAnnouncements([]);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        fetchTeamAnnouncements();
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        const handleLeaderboardUpdate = (data) => {
            if (Array.isArray(data)) {
                setTeams(data);
                setLastUpdated(new Date());
            } else {
                fetchLeaderboard();
            }
        };

        socket.on('leaderboard-update', handleLeaderboardUpdate);
        socket.on('new-donation', fetchLeaderboard);
        socket.on('photo-approved', fetchLeaderboard);

        return () => {
            socket.off('leaderboard-update');
            socket.off('new-donation');
            socket.off('photo-approved');
        };
    }, [socket]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className={`grid grid-cols-1 ${user && user.team ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8 justify-center`}>
                {/* Left/Main Section */}
                <div className="lg:col-span-2">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
                            Project Phi Leaderboard
                        </h1>
                        <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
                            <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{connected ? 'Live Updates' : 'Disconnected'}</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">({teams.length} teams)</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {teams.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No Teams Found...Event not ready</p>
                                <p className="text-xs text-gray-400 mt-2">Check console for debug info</p>
                            </div>
                        ) : (
                            teams.map((team, index) => (
                                <LeaderboardItem
                                    key={team.id}
                                    team={team}
                                    rank={index + 1}
                                    isTop3={index < 3}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Only show if user is logged in and has a team */}
                {user && (user.team?.id || user.teamId) && (
                    <div className="hidden lg:block">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold mb-4">
                                {user.team?.name || "Team"} Announcements
                            </h2>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {teamAnnouncements.length > 0 ? (
                                    teamAnnouncements.map((announcement) => (
                                        <div key={announcement.id} className="p-4 bg-blue-50 rounded border-l-4 border-blue-400">
                                            <h3 className="font-semibold text-blue-800 text-sm">{announcement.title}</h3>
                                            <p className="text-sm text-blue-700 mt-1">{announcement.content}</p>
                                            <p className="text-xs text-blue-600 mt-2">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-600">No announcements yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LeaderboardItem = ({ team, rank, isTop3 }) => {
    const getRankBadge = (rank) => {
        const badges = {
            1: { emoji: '🥇', color: 'from-yellow-400 to-yellow-600' },
            2: { emoji: '🥈', color: 'from-gray-300 to-gray-500' },
            3: { emoji: '🥉', color: 'from-amber-600 to-amber-800' }
        };
        return badges[rank] || { emoji: rank, color: 'from-blue-500 to-blue-700' };
    };

    const badge = getRankBadge(rank);

    return (
        <div className={`
            p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105
            ${isTop3 
                ? `bg-gradient-to-r ${badge.color} text-white` 
                : 'bg-white border-2 border-gray-200'
            }
        `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <div className={`
                        text-2xl font-bold w-16 h-16 rounded-full flex items-center justify-center
                        ${isTop3 ? 'bg-white bg-opacity-20' : 'bg-blue-600 text-white'}
                    `}>
                        {badge.emoji}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{team.name}</h3>
                        <div className="text-sm opacity-90">
                            💰 ${team.totalDonations?.toFixed(2) || '0.00'} | 
                            📸 {team.photoCount || 0} photos | 
                            👥 {team.memberCount || 0} members
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold">{team.totalScore || 0}</div>
                    <div className="text-sm opacity-90">points</div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
