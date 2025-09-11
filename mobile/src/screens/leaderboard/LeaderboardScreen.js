import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const LeaderboardScreen = () => {
  const { token, user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);



  const fetchData = async () => {
    try {
      console.log('Fetching app data from:', API_ROUTES.LEADERBOARD.GET);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Fetch all data in parallel
      const [leaderboardResponse, statsResponse, activitiesResponse, teamsResponse] = await Promise.all([
        // Fetch leaderboard data
        fetch(`${API_ROUTES.LEADERBOARD.GET}`, { headers }),
        
        // Fetch statistics (for goal target and total raised)
        fetch(`${API_ROUTES.LEADERBOARD.GET}/statistics`, { headers }),
        
        // Fetch activities for upcoming events count
        fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4243'}/api/activities`, { headers }),
        
        // Fetch total teams count
        fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4243'}/api/teams`, { headers }),
      ]);

      console.log('API responses:', {
        leaderboard: leaderboardResponse.status,
        stats: statsResponse.status,
        activities: activitiesResponse.status,
        teams: teamsResponse.status
      });
      
      // Process leaderboard data
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        console.log('Leaderboard data received:', leaderboardData);
        setLeaderboardData(Array.isArray(leaderboardData) ? leaderboardData : []);
      } else {
        console.error('Leaderboard fetch failed:', leaderboardResponse.status);
        setLeaderboardData([]);
      }

      // Process statistics data
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Statistics data received:', statsData);
        setStatistics(statsData);
      } else {
        console.error('Statistics fetch failed:', statsResponse.status);
        setStatistics(null);
      }

      // Process activities data
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        console.log('Activities data received:', activitiesData);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        
        // Convert activities to events format
        const convertedEvents = activitiesData.map((activity, index) => {
          // Use startDate if available, otherwise fallback to createdAt
          const eventDate = activity.startDate ? new Date(activity.startDate) : 
                           activity.createdAt ? new Date(activity.createdAt) : null;
          
          const endDate = activity.endDate ? new Date(activity.endDate) : null;
          const now = new Date();
          
          // Determine if activity is upcoming, ongoing, or past
          let status = 'upcoming';
          if (endDate && now > endDate) {
            status = 'past';
          } else if (eventDate && now >= eventDate && (!endDate || now <= endDate)) {
            status = 'ongoing';
          }
          
          return {
            id: activity.id || index,
            title: activity.name || activity.title || 'Activity',
            date: eventDate ? eventDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'TBD',
            time: eventDate ? eventDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }) : 'TBD',
            endDate: endDate ? endDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }) : null,
            endTime: endDate ? endDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }) : null,
            location: activity.location || 'Online',
            attendees: activity.submissions?.length || 0,
            category: activity.categoryType || activity.type || 'General',
            trending: (activity.submissions?.length || 0) > 5, // Mark as trending if more than 5 submissions
            points: activity.points || 0,
            description: activity.description || '',
            status: status,
            isActive: activity.isActive && activity.isPublished
          };
        });
        
        // Filter to only show active/published activities and sort by start date
        const filteredEvents = convertedEvents
          .filter(event => event.isActive)
          .sort((a, b) => {
            // Sort by status (ongoing first, then upcoming, then past)
            const statusOrder = { ongoing: 1, upcoming: 2, past: 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            // Within same status, sort by date
            return new Date(a.date) - new Date(b.date);
          });
        
        setUpcomingEvents(filteredEvents);
      } else {
        console.error('Activities fetch failed:', activitiesResponse.status);
        setActivities([]);
        setUpcomingEvents([]);
      }

      // Process teams data
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log('Teams data received:', teamsData);
        // Handle different response formats
        if (Array.isArray(teamsData)) {
          setTotalTeams(teamsData.length);
        } else if (teamsData.teams && Array.isArray(teamsData.teams)) {
          setTotalTeams(teamsData.teams.length);
        } else if (teamsData.total || teamsData.count) {
          setTotalTeams(teamsData.total || teamsData.count);
        } else {
          setTotalTeams(0);
        }
      } else {
        console.error('Teams fetch failed:', teamsResponse.status);
        setTotalTeams(0);
      }

    } catch (error) {
      console.error('Data fetch error:', error);
      setLeaderboardData([]);
      setStatistics(null);
      setUpcomingEvents([]);
      setActivities([]);
      setTotalTeams(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'ribbon';
      default: return 'star';
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#0891b2'; // Cyan
    }
  };

  // Header Component
  const AppHeader = () => (
    <View style={newStyles.headerContainer}>
      <View style={newStyles.headerContent}>
        <View style={newStyles.logoContainer}>
          <MaskedView
            style={newStyles.maskedView}
            maskElement={
              <Text style={newStyles.logoTextMask}>
                SigEp Bounce
              </Text>
            }
          >
            <LinearGradient
              colors={['#0891b2', '#f59e0b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={newStyles.logoGradient}
            />
          </MaskedView>
        </View>
        
        <View style={newStyles.userSection}>
          <Text style={newStyles.welcomeText}>
            Welcome back, {user?.firstName || 'Student'}
          </Text>
          <View style={newStyles.avatarContainer}>
            <LinearGradient
              colors={['#0891b2', '#06b6d4']}
              style={newStyles.avatarGlow}
            >
              <View style={newStyles.avatar}>
                <Ionicons name="person" size={20} color="white" />
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    </View>
  );

  // Quick Stats Grid Component
  const QuickStatsGrid = ({ statistics, activities, totalTeams }) => {
    const isLoading = !statistics || loading;
    const stats = statistics || { 
      donationGoal: 50000, 
      totalRaised: 0, 
      progressPercentage: 0
    };

    // Calculate upcoming events count from activities
    const upcomingEventsCount = activities ? activities.length : 0;

    const statsData = [
      {
        icon: 'flag',
        value: isLoading ? '$--K' : `$${Math.round((stats.donationGoal || 50000) / 1000)}K`,
        label: 'Goal Target',
        progress: isLoading ? 0 : (stats.progressPercentage || 0),
        color: '#0891b2',
      },
      {
        icon: 'time',
        value: isLoading ? '--' : upcomingEventsCount,
        label: 'Activities Created',
        color: '#f59e0b',
      },
      {
        icon: 'people',
        value: isLoading ? '--' : totalTeams || 0,
        label: 'Total Teams',
        color: '#10b981',
      },
      {
        icon: 'star',
        value: isLoading ? '$--' : stats.totalRaised >= 1000 ? `$${Math.round(stats.totalRaised / 1000)}K` : `$${stats.totalRaised || 0}`,
        label: 'Total Raised',
        color: '#8b5cf6',
      },
    ];

    return (
      <View style={newStyles.statsGrid}>
        {/* First Row */}
        <View style={newStyles.statsRow}>
          {statsData.slice(0, 2).map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={newStyles.statCard}
              activeOpacity={0.95}
            >
              <View style={[newStyles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={20} color="white" />
              </View>
              <Text style={newStyles.statValue}>{stat.value}</Text>
              <Text style={newStyles.statLabel}>{stat.label}</Text>
              {stat.progress !== undefined && (
                <View style={newStyles.progressContainer}>
                  <View style={newStyles.progressBar}>
                    <View 
                      style={[
                        newStyles.progressFill, 
                        { 
                          width: `${stat.progress}%`,
                          backgroundColor: stat.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={newStyles.progressText}>{Math.round(stat.progress)}%</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Second Row */}
        <View style={newStyles.statsRow}>
          {statsData.slice(2, 4).map((stat, index) => (
            <TouchableOpacity 
              key={index + 2} 
              style={newStyles.statCard}
              activeOpacity={0.95}
            >
              <View style={[newStyles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={20} color="white" />
              </View>
              <Text style={newStyles.statValue}>{stat.value}</Text>
              <Text style={newStyles.statLabel}>{stat.label}</Text>
              {stat.progress !== undefined && (
                <View style={newStyles.progressContainer}>
                  <View style={newStyles.progressBar}>
                    <View 
                      style={[
                        newStyles.progressFill, 
                        { 
                          width: `${stat.progress}%`,
                          backgroundColor: stat.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={newStyles.progressText}>{Math.round(stat.progress)}%</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Upcoming Events Section Component
  const UpcomingEventsSection = ({ events }) => {
    const renderEventCard = ({ item }) => (
      <TouchableOpacity style={newStyles.eventCard} activeOpacity={0.9}>
        <View style={newStyles.eventHeader}>
          <View style={newStyles.eventTitleRow}>
            <Text style={newStyles.eventTitle}>{item.title}</Text>
            {item.trending && (
              <View style={newStyles.trendingBadge}>
                <Ionicons name="trending-up" size={12} color="#f59e0b" />
              </View>
            )}
          </View>
          <View style={newStyles.categoryBadge}>
            <Text style={newStyles.categoryText}>{item.category}</Text>
          </View>
        </View>
        
        <View style={newStyles.eventDetails}>
          <View style={newStyles.eventDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={newStyles.eventDetailText}>
              {item.date} • {item.time}
              {item.endDate && item.endDate !== item.date && ` - ${item.endDate}`}
              {item.endDate && item.endDate === item.date && item.endTime && ` - ${item.endTime}`}
            </Text>
          </View>
          
          {/* Activity Status Indicator */}
          {item.status && (
            <View style={newStyles.eventDetailRow}>
              <Ionicons 
                name={
                  item.status === 'ongoing' ? 'radio-button-on' : 
                  item.status === 'past' ? 'checkmark-circle' : 
                  'time-outline'
                } 
                size={16} 
                color={
                  item.status === 'ongoing' ? '#10b981' : 
                  item.status === 'past' ? '#6b7280' : 
                  '#f59e0b'
                } 
              />
              <Text style={[
                newStyles.eventDetailText,
                {
                  color: item.status === 'ongoing' ? '#10b981' : 
                         item.status === 'past' ? '#6b7280' : 
                         '#f59e0b'
                }
              ]}>
                {item.status === 'ongoing' ? 'Active Now' : 
                 item.status === 'past' ? 'Completed' : 
                 'Upcoming'}
              </Text>
            </View>
          )}
          
          <View style={newStyles.eventDetailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={newStyles.eventDetailText}>{item.location}</Text>
          </View>
          <View style={newStyles.eventDetailRow}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={newStyles.eventDetailText}>{item.attendees} submissions</Text>
          </View>
          {item.points > 0 && (
            <View style={newStyles.eventDetailRow}>
              <Ionicons name="trophy-outline" size={16} color="#6b7280" />
              <Text style={newStyles.eventDetailText}>{item.points} points</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={newStyles.joinButton} activeOpacity={0.8}>
          <LinearGradient
            colors={['#0891b2', '#06b6d4']}
            style={newStyles.joinButtonGradient}
          >
            <Ionicons name="flash" size={16} color="white" />
            <Text style={newStyles.joinButtonText}>View Activity</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    );

    return (
      <View style={newStyles.sectionContainer}>
        <View style={newStyles.sectionHeader}>
          <Text style={newStyles.sectionTitle}>Available Activities</Text>
          <TouchableOpacity style={newStyles.viewAllButton}>
            <Text style={newStyles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#0891b2" />
          </TouchableOpacity>
        </View>
        
        {events.length === 0 ? (
          <View style={newStyles.emptyEvents}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={newStyles.emptyText}>No activities yet</Text>
            <Text style={newStyles.emptySubtext}>
              Check back later for new activities to participate in
            </Text>
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={newStyles.eventsList}
          />
        )}
      </View>
    );
  };

  // Leaderboard Section Component
  const LeaderboardSection = ({ teams }) => {
    const renderLeaderboardItem = ({ item, index }) => {
      const rank = index + 1;
      const isUserTeam = item.name === user?.teamName || item.id === user?.teamId;
      
      return (
        <View style={[
          newStyles.leaderboardItem,
          isUserTeam && newStyles.userTeamItem
        ]}>
          <View style={[
            newStyles.rankBadge,
            { backgroundColor: getRankColor(rank) }
          ]}>
            <Ionicons 
              name={getRankIcon(rank)} 
              size={16} 
              color="white" 
            />
          </View>
          
          <View style={newStyles.teamAvatar}>
            <Ionicons name="people" size={20} color="#0891b2" />
          </View>
          
          <View style={newStyles.teamDetails}>
            <Text style={[
              newStyles.teamName,
              isUserTeam && newStyles.userTeamName
            ]}>
              {item.name} {isUserTeam && '(You)'}
            </Text>
          </View>
          
          <View style={newStyles.pointsSection}>
            <Text style={newStyles.teamPoints}>{item.totalScore || 0}</Text>
            <Text style={newStyles.pointsUnit}>pts</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={newStyles.sectionContainer}>
        <View style={newStyles.sectionHeader}>
          <View style={newStyles.sectionTitleRow}>
            <Ionicons name="trophy" size={20} color="#0891b2" />
            <Text style={newStyles.sectionTitle}>Leaderboard</Text>
          </View>
          <TouchableOpacity style={newStyles.viewAllButton}>
            <Text style={newStyles.viewAllText}>View Full</Text>
            <Ionicons name="chevron-forward" size={16} color="#0891b2" />
          </TouchableOpacity>
        </View>
        
        <View style={newStyles.leaderboardContainer}>
          {teams.length === 0 ? (
            <View style={newStyles.emptyLeaderboard}>
              <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
              <Text style={newStyles.emptyText}>No teams yet</Text>
              <Text style={newStyles.emptySubtext}>
                Teams will appear here as they join the competition
              </Text>
            </View>
          ) : (
            <FlatList
              data={teams.slice(0, 5)} // Show top 5
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.id?.toString() || item.name}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>
    );
  };



  if (loading) {
    return (
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={newStyles.container}
      >
        <SafeAreaView style={newStyles.loadingContainer}>
          <View style={newStyles.loadingSpinner}>
            <Ionicons name="refresh" size={32} color="#0891b2" />
          </View>
          <Text style={newStyles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={newStyles.container}>
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={newStyles.backgroundGradient}
      >
        <SafeAreaView style={newStyles.safeArea}>
          {/* Header */}
          <AppHeader />
          
          {/* Main Content */}
          <ScrollView
            style={newStyles.scrollView}
            contentContainerStyle={newStyles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#0891b2"
                colors={['#0891b2', '#f59e0b']}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Stats Grid */}
            <QuickStatsGrid 
              statistics={statistics} 
              activities={activities}
              totalTeams={totalTeams}
            />
            
            {/* Upcoming Events Section */}
            <UpcomingEventsSection events={upcomingEvents} />
            
            {/* Leaderboard Section */}
            <LeaderboardSection teams={leaderboardData} />
            
            {/* Bottom spacing */}
            <View style={newStyles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// New Design System Styles
const newStyles = {
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  backgroundGradient: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },

  // Header Styles
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logoContainer: {
    flex: 1,
  },

  maskedView: {
    height: 32,
  },

  logoTextMask: {
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },

  logoGradient: {
    flex: 1,
  },

  userSection: {
    alignItems: 'flex-end',
  },

  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },

  avatarContainer: {
    alignItems: 'center',
  },

  avatarGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick Stats Grid - 2x2 Layout
  statsGrid: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  progressContainer: {
    marginTop: 8,
  },

  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  progressText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewAllText: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '600',
    marginRight: 4,
  },

  // Events Styles
  eventsList: {
    paddingLeft: 16,
  },

  eventCard: {
    width: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },

  trendingBadge: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryBadge: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },

  eventDetails: {
    marginBottom: 16,
  },

  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },

  joinButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },

  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },

  // Leaderboard Styles
  leaderboardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    overflow: 'hidden',
  },

  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },

  userTeamItem: {
    backgroundColor: 'rgba(8, 145, 178, 0.05)',
  },

  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  teamAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  teamDetails: {
    flex: 1,
  },

  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  userTeamName: {
    color: '#0891b2',
  },

  pointsSection: {
    alignItems: 'flex-end',
  },

  teamPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },

  pointsUnit: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Empty States
  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyEvents: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },

  bottomSpacing: {
    height: 20,
  },
};

export default LeaderboardScreen;