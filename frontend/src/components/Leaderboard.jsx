import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";
import { API_ROUTES } from "../services/api";

const Leaderboard = () => {
    const [teams, setTeams] = useState([]);
    const [teamAnnouncements, setTeamAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const { socket, connected } = useSocket();
    const { user } = useAuth();

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(API_ROUTES.leaderboard.list);
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
            const response = await fetch(API_ROUTES.announcements.forTeam(teamId));
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
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <Hero connected={connected} teams={teams} lastUpdated={lastUpdated} />
            
            <main className="container mx-auto px-6 py-12 space-y-12">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Announcements />
                    </div>
                    <div>
                        <LeaderboardSidebar 
                            teams={teams} 
                            loading={loading} 
                            user={user}
                            teamAnnouncements={teamAnnouncements}
                        />
                    </div>
                </div>
                
                <FeaturedSection />
            </main>
        </div>
    );
};

// Hero Component
const Hero = ({ connected, teams, lastUpdated }) => (
    <div className="relative overflow-hidden bg-gradient-primary/5 border-b border-border/30">
        <div className="absolute inset-0 bg-gradient-secondary opacity-30"></div>
        <div className="container mx-auto px-6 py-16 relative z-10">
            <div className="text-center space-y-6">
                <div className="inline-flex items-center space-x-4 bg-card/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-card">
                    <div className={`w-3 h-3 rounded-full transition-smooth ${connected ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
                    <span className="text-sm font-medium text-foreground">
                        {connected ? '🔴 Live Updates' : '⚫ Disconnected'}
                    </span>
                    <span className="badge-base bg-primary text-primary-foreground">
                        {teams.length} Teams
                    </span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-gradient-primary">
                    Welcome to Project Phi
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join the movement to make a difference. Track progress, celebrate achievements, and build community.
                </p>
                
                <div className="text-sm text-muted-foreground">
                    Last Updated: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>
        </div>
    </div>
);

// Announcements Component
const Announcements = () => (
    <div className="space-y-8">
        <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl text-primary-foreground">📢</span>
            </div>
            <div>
                <h2 className="text-3xl font-bold text-gradient-primary">Latest Updates</h2>
                <p className="text-muted-foreground">Stay informed about Project Phi activities and events</p>
            </div>
        </div>

        <div className="space-y-6">
            {/* Featured Announcement */}
            <div className="card-base border-2 border-primary/20 p-8 hover-lift">
                <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl text-white">🎉</span>
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                            <h3 className="text-2xl font-bold text-foreground">Project Phi 2025 Kickoff!</h3>
                            <span className="badge-base bg-gradient-primary text-primary-foreground">Featured</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                            Welcome to the most exciting fundraising competition of the year! Teams from across the region 
                            are competing to make the biggest impact in their communities. Join us in raising funds, 
                            completing activities, and building stronger connections with your peers.
                        </p>
                        <div className="text-sm text-muted-foreground">
                            Posted on September 1, 2025
                        </div>
                    </div>
                </div>
            </div>

            {/* Regular Announcements */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="card-base p-6 hover-lift">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🏆</span>
                            <h4 className="text-xl font-semibold text-foreground">Leaderboard Updates</h4>
                        </div>
                        <p className="text-muted-foreground">
                            Team rankings are updated in real-time! Check the leaderboard to see how your team 
                            is performing against others. Every donation, activity, and photo submission counts!
                        </p>
                        <div className="text-sm text-muted-foreground">September 5, 2025</div>
                    </div>
                </div>

                <div className="card-base p-6 hover-lift">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">📸</span>
                            <h4 className="text-xl font-semibold text-foreground">Photo Contest</h4>
                        </div>
                        <p className="text-muted-foreground">
                            Share your team's journey! Upload photos of your fundraising activities and 
                            community service projects. The most creative submissions earn bonus points!
                        </p>
                        <div className="text-sm text-muted-foreground">September 3, 2025</div>
                    </div>
                </div>

                <div className="card-base p-6 hover-lift">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">💰</span>
                            <h4 className="text-xl font-semibold text-foreground">Donation Milestones</h4>
                        </div>
                        <p className="text-muted-foreground">
                            We've reached amazing milestones! Every dollar donated goes directly to supporting 
                            local community programs and educational initiatives.
                        </p>
                        <div className="text-sm text-muted-foreground">September 4, 2025</div>
                    </div>
                </div>

                <div className="card-base p-6 hover-lift">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🎯</span>
                            <h4 className="text-xl font-semibold text-foreground">Activity Challenges</h4>
                        </div>
                        <p className="text-muted-foreground">
                            New activities are available! Complete challenges to earn points for your team 
                            and make a meaningful impact in your community.
                        </p>
                        <div className="text-sm text-muted-foreground">September 6, 2025</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Leaderboard Sidebar Component
const LeaderboardSidebar = ({ teams, loading, user, teamAnnouncements }) => (
    <div className="space-y-6">
        {/* Compact Leaderboard */}
        <div className="card-base p-6 space-y-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg text-white">🏆</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground">Top Teams</h3>
                    <p className="text-sm text-muted-foreground">Current rankings</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg animate-pulse">
                            <div className="w-8 h-8 bg-secondary rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-secondary rounded"></div>
                                <div className="h-3 bg-secondary/60 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : teams.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                    <div className="text-3xl">🎯</div>
                    <p className="text-sm text-muted-foreground">No teams yet</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {teams.slice(0, 10).map((team, index) => (
                        <CompactLeaderboardItem
                            key={team.id}
                            team={team}
                            rank={index + 1}
                            isTop3={index < 3}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Team Announcements */}
        {user && (user.team?.id || user.teamId) && (
            <div className="card-base p-6 space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-lg text-primary-foreground">📋</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Your Team</h3>
                        <p className="text-sm text-muted-foreground">
                            {user.team?.name || "Team Updates"}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                    {teamAnnouncements.length > 0 ? (
                        teamAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="bg-secondary/30 border border-border/30 rounded-lg p-3 space-y-2">
                                <h4 className="font-semibold text-foreground text-sm">
                                    {announcement.title}
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {announcement.content}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 space-y-2">
                            <div className="text-2xl">📭</div>
                            <p className="text-xs text-muted-foreground">No team updates</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
);

// Compact Leaderboard Item for Sidebar
const CompactLeaderboardItem = ({ team, rank, isTop3 }) => {
    const getRankIcon = (rank) => {
        const icons = { 1: "🥇", 2: "🥈", 3: "🥉" };
        return icons[rank] || `#${rank}`;
    };

    return (
        <div className={`
            flex items-center space-x-3 p-3 rounded-lg transition-smooth
            ${isTop3 ? 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20' : 'bg-secondary/30 hover:bg-secondary/40'}
        `}>
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${isTop3 ? 'bg-gradient-primary text-primary-foreground' : 'bg-secondary text-foreground'}
            `}>
                {getRankIcon(rank)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">{team.name}</div>
                <div className="text-xs text-muted-foreground">
                    {team.totalScore?.toLocaleString() || 0} points
                </div>
            </div>
        </div>
    );
};

// Featured Section Component
const FeaturedSection = () => (
    <div className="space-y-8">
        <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gradient-primary">Get Involved</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ready to make a difference? Join a team or start your own fundraising journey today.
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
            <div className="card-base p-8 text-center hover-lift group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl text-white">👥</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Join a Team</h3>
                <p className="text-muted-foreground mb-4">
                    Connect with like-minded individuals and work together to achieve your fundraising goals.
                </p>
                <button className="btn-primary px-6 py-2 w-full">Find Teams</button>
            </div>

            <div className="card-base p-8 text-center hover-lift group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl text-white">💰</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Make a Donation</h3>
                <p className="text-muted-foreground mb-4">
                    Support the cause directly with a donation. Every contribution makes a meaningful impact.
                </p>
                <button className="btn-primary px-6 py-2 w-full">Donate Now</button>
            </div>

            <div className="card-base p-8 text-center hover-lift group">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl text-white">📸</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Share Your Story</h3>
                <p className="text-muted-foreground mb-4">
                    Upload photos and share your team's journey to inspire others and earn bonus points.
                </p>
                <button className="btn-primary px-6 py-2 w-full">Upload Photos</button>
            </div>
        </div>
    </div>
);

const LeaderboardItem = ({ team, rank, isTop3 }) => {
    const getRankBadge = (rank) => {
        const badges = {
            1: { 
                emoji: "🏆", 
                bgClass: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600",
                shadowClass: "shadow-yellow-400/50",
                borderClass: "border-yellow-300",
                glowClass: "shadow-yellow-400/30"
            },
            2: { 
                emoji: "🥈", 
                bgClass: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600",
                shadowClass: "shadow-slate-400/50",
                borderClass: "border-slate-300",
                glowClass: "shadow-slate-400/30"
            },
            3: { 
                emoji: "🥉", 
                bgClass: "bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600",
                shadowClass: "shadow-orange-400/50",
                borderClass: "border-orange-300",
                glowClass: "shadow-orange-400/30"
            }
        };
        
        return badges[rank] || {
            emoji: rank.toString(),
            bgClass: "bg-gradient-accent",
            shadowClass: "shadow-accent/30",
            borderClass: "border-accent/20",
            glowClass: "shadow-accent/20"
        };
    };

    const badge = getRankBadge(rank);

    return (
        <div className={`
            group relative card-base hover-lift
            ${isTop3 
                ? `border-2 ${badge.borderClass} ${badge.shadowClass} shadow-2xl` 
                : 'border border-border/30'
            }
        `}>
            {/* Premium Background for Top 3 */}
            {isTop3 && (
                <div className={`absolute inset-0 ${badge.bgClass} opacity-5 rounded-xl`}></div>
            )}
            
            <div className="relative p-6 flex items-center space-x-6">
                {/* Rank Badge */}
                <div className={`
                    flex items-center justify-center w-20 h-20 rounded-full border-4
                    ${badge.bgClass} ${badge.borderClass} ${badge.shadowClass}
                    text-white font-bold text-2xl relative z-10 transition-smooth
                    ${isTop3 ? 'shadow-2xl animate-pulse scale-110' : 'shadow-lg'}
                `}>
                    <span className="drop-shadow-sm">{badge.emoji}</span>
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0 space-y-3">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-smooth truncate">
                        {team.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2 bg-secondary/30 rounded-full px-3 py-1">
                            <span className="text-base">💰</span>
                            <span className="font-medium">${team.totalDonations?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-secondary/30 rounded-full px-3 py-1">
                            <span className="text-base">📸</span>
                            <span className="font-medium">{team.photoCount || 0} photos</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-secondary/30 rounded-full px-3 py-1">
                            <span className="text-base">👥</span>
                            <span className="font-medium">{team.memberCount || 0} members</span>
                        </div>
                    </div>
                </div>

                {/* Points Display */}
                <div className="text-right space-y-2">
                    <div className="text-4xl font-bold text-gradient-primary">
                        {team.totalScore?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                        Points
                    </div>
                    {isTop3 && (
                        <div className="badge-base bg-gradient-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                            ⭐ TOP TEAM
                        </div>
                    )}
                </div>

                {/* Celebration Effect for #1 */}
                {rank === 1 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-primary-foreground text-sm">🎉</span>
                    </div>
                )}
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none"></div>
        </div>
    );
};

export default Leaderboard;
