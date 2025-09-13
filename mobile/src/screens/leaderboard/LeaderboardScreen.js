import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const LeaderboardScreen = () => {
  const { token, user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const flashingItemsRef = React.useRef(new Set());
  const leaderboardTimerRef = React.useRef(null);

  // Load custom font
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'BitcountGridDouble': require('../../../assets/fonts/BitcountGridDouble-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf'),
        });
        setFontLoaded(true);
      } catch (error) {
        setFontLoaded(false);
      }
    }
    loadFonts();
  }, []);

  // Get current time in PST
  const getPSTTime = () => {
    const now = new Date();
    // PST is UTC-8, PDT is UTC-7. For simplicity, using PST (UTC-8)
    const pstOffset = -8 * 60; // minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (pstOffset * 60000));
  };

  // Calculate next leaderboard update time (daily at 5 PM PST)
  const getNextLeaderboardUpdate = () => {
    const pstNow = getPSTTime();
    const nextUpdate = new Date(pstNow);
    
    // Set to 5 PM today
    nextUpdate.setHours(17, 0, 0, 0); // 5 PM, 0 minutes, 0 seconds, 0 milliseconds
    
    // If it's already past 5 PM today, move to 5 PM tomorrow
    if (pstNow >= nextUpdate) {
      nextUpdate.setDate(nextUpdate.getDate() + 1);
    }
    
    return nextUpdate;
  };

  // Fetch only leaderboard data (for automatic updates)
  const fetchLeaderboardData = useCallback(async () => {
    try {
      console.log('🔄 LeaderboardScreen: Auto-updating leaderboard data...');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch only leaderboard data
      const leaderboardResponse = await fetch(`${API_ROUTES.LEADERBOARD.GET}`, { headers });
      
      if (leaderboardResponse.ok) {
        const leaderboardResponseData = await leaderboardResponse.json();
        console.log('✅ LeaderboardScreen: Auto-updated leaderboard data received');
        
        // Handle new API format with metadata
        if (leaderboardResponseData.leaderboard) {
          setLeaderboardData(Array.isArray(leaderboardResponseData.leaderboard) ? leaderboardResponseData.leaderboard : []);
          setLastUpdated(leaderboardResponseData.lastUpdated);
          setNextUpdate(leaderboardResponseData.nextUpdate);
          setIsCached(leaderboardResponseData.isCached);
        } else {
          setLeaderboardData(Array.isArray(leaderboardResponseData) ? leaderboardResponseData : []);
          setLastUpdated(new Date().toISOString());
          setNextUpdate(null);
          setIsCached(false);
        }
      } else {
        console.error('❌ LeaderboardScreen: Auto leaderboard update failed:', leaderboardResponse.status);
      }
    } catch (error) {
      console.error('❌ LeaderboardScreen: Auto leaderboard update error:', error);
    }
  }, [token]);

  // Format countdown time
  const formatCountdown = (seconds) => {
    if (seconds <= 0) return 'Updating...';
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Setup automatic leaderboard refresh
  const setupLeaderboardTimer = useCallback(() => {
    // Clear existing timers
    if (leaderboardTimerRef.current) {
      clearInterval(leaderboardTimerRef.current);
    }

    // Calculate time until next 5 PM PST
    const pstNow = getPSTTime();
    const nextUpdate = getNextLeaderboardUpdate();
    const timeUntilNextUpdate = nextUpdate.getTime() - pstNow.getTime();

    console.log(`🕐 LeaderboardScreen: Next auto-update at 5 PM PST in ${Math.round(timeUntilNextUpdate / 1000 / 60)} minutes (${nextUpdate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })})`);

    // Set initial timeout to sync with 5 PM
    setTimeout(() => {
      fetchLeaderboardData();
      
      // Then set up regular interval every 24 hours
      leaderboardTimerRef.current = setInterval(() => {
        fetchLeaderboardData();
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
      
    }, timeUntilNextUpdate);
  }, [fetchLeaderboardData]);



  const fetchData = async () => {
    try {
      console.log('🔄 LeaderboardScreen: Starting fetchData (excluding leaderboard)...');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 LeaderboardScreen: Token available, length:', token.length);
      } else {
        console.log('❌ LeaderboardScreen: No token available');
      }
      
      console.log('📡 LeaderboardScreen: Making API requests to:');
      console.log('  - Statistics:', `${API_ROUTES.LEADERBOARD.GET}/statistics`);
      console.log('  - Activities:', API_ROUTES.activities.list);
      console.log('  - Teams:', API_ROUTES.teams.list);
      console.log('  - My Team:', API_ROUTES.teams.myTeam);
      
      // Fetch all data except leaderboard (which updates automatically)
      const [statsResponse, activitiesResponse, teamsResponse, teamResponse] = await Promise.all([        
        // Fetch statistics (for goal target and total raised)
        fetch(`${API_ROUTES.LEADERBOARD.GET}/statistics`, { headers }),
        
        // Fetch activities for upcoming events count
        fetch(`${API_ROUTES.activities.list}`, { headers }),
        
        // Fetch total teams count - use public endpoint instead of admin
        fetch(`${API_ROUTES.teams.list}`, { headers }),
        
        // Fetch user's team data
        token ? fetchWithTimeout(API_ROUTES.teams.myTeam, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('❌ LeaderboardScreen: My Team API error:', err);
          return { ok: false, error: err };
        }) : Promise.resolve({ ok: false })
      ]);

      console.log('📥 LeaderboardScreen: API Response status codes:');
      console.log('  - Statistics:', statsResponse.status);
      console.log('  - Activities:', activitiesResponse.status);
      console.log('  - Teams:', teamsResponse.status);
      console.log('  - My Team:', teamResponse.status || 'No token');

      // Process API responses

      // Process user's team data
      if (teamResponse.ok) {
        const userTeamData = await teamResponse.json();
        console.log('✅ LeaderboardScreen: My Team data received:', userTeamData);
        setTeamData(userTeamData);
      } else {
        console.log('❌ LeaderboardScreen: My Team fetch failed:', teamResponse.status);
        setTeamData(null);
      }

      // Process statistics data (now includes donation goal)
      let combinedStats = null;
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ LeaderboardScreen: Statistics data received:', statsData);
        combinedStats = { ...statsData };
        
        // Calculate progress percentage with donation goal from statistics
        const donationGoal = combinedStats.donationGoal || 50000;
        const totalRaised = combinedStats.totalRaised || 0;
        combinedStats.progressPercentage = donationGoal > 0 ? (totalRaised / donationGoal) * 100 : 0;
        
        console.log('📊 LeaderboardScreen: Statistics with donation goal:', {
          donationGoal,
          totalRaised,
          progressPercentage: combinedStats.progressPercentage
        });
      } else {
        console.error('❌ LeaderboardScreen: Statistics fetch failed:', statsResponse.status);
        // Fallback to default values
        combinedStats = {
          donationGoal: 50000,
          totalRaised: 0,
          progressPercentage: 0
        };
      }

      setStatistics(combinedStats);

      // Process activities data
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        
        // Convert activities to events format
        const convertedEvents = activitiesData.map((activity, index) => {
          // Use startDate if available, otherwise fallback to createdAt
          const eventDate = activity.startDate ? new Date(activity.startDate) : 
                           activity.createdAt ? new Date(activity.createdAt) : null;
          
          const endDate = activity.endDate ? new Date(activity.endDate) : null;
          
          // Get current time in PST
          const now = new Date();
          const pstOffset = -8; // PST is UTC-8
          const pstNow = new Date(now.getTime() + (pstOffset * 60 * 60 * 1000));
          
          // Convert event dates to PST for comparison
          const eventDatePST = eventDate ? new Date(eventDate.getTime() + (pstOffset * 60 * 60 * 1000)) : null;
          const endDatePST = endDate ? new Date(endDate.getTime() + (pstOffset * 60 * 60 * 1000)) : null;
          
          // Determine if activity is upcoming, ongoing, or past (using PST)
          let status = 'upcoming';
          if (endDatePST && pstNow > endDatePST) {
            status = 'past';
          } else if (eventDatePST && pstNow >= eventDatePST && (!endDatePST || pstNow <= endDatePST)) {
            status = 'ongoing';
          }
          
          // Check if event is today (using PST)
          const isToday = eventDatePST && 
            eventDatePST.toDateString() === pstNow.toDateString();
          
          const displayDate = isToday ? 'TODAY' : 
            (eventDate ? eventDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              timeZone: 'America/Los_Angeles' // Force PST timezone
            }) : 'TBD');
          
          return {
            id: activity.id || index,
            title: activity.name || activity.title || 'Activity',
            date: displayDate,
            time: eventDate ? eventDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/Los_Angeles' // Force PST timezone
            }) : 'TBD',
            endDate: endDate ? endDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              timeZone: 'America/Los_Angeles' // Force PST timezone
            }) : null,
            endTime: endDate ? endDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/Los_Angeles' // Force PST timezone
            }) : null,
            location: activity.location || 'Online',
            attendees: activity.submissions?.length || 0,
            category: activity.categoryType || activity.type || 'General',
            trending: (activity.submissions?.length || 0) > 5, // Mark as trending if more than 5 submissions
            points: activity.points || 0,
            description: activity.description || '',
            status: status,
            isActive: activity.isActive && activity.isPublished,
            isToday: isToday
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
      // Don't reset leaderboard data on error since it updates automatically
      setStatistics(null);
      setUpcomingEvents([]);
      setActivities([]);
      setTotalTeams(0);
      setTeamData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchData();
    
    // Initial leaderboard fetch and setup timer
    fetchLeaderboardData();
    setupLeaderboardTimer();
    
    // Cleanup timers on unmount
    return () => {
      if (leaderboardTimerRef.current) {
        clearInterval(leaderboardTimerRef.current);
      }
    };
  }, []);

  // Restart timer when token changes
  useEffect(() => {
    if (token) {
      setupLeaderboardTimer();
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Only refresh non-leaderboard data (leaderboard updates automatically)
      await fetchData();
      console.log('✅ LeaderboardScreen: Manual refresh completed (leaderboard excluded)');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
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
      case 1: return '#FF6B6B'; // Vibrant coral red
      case 2: return '#4ECDC4'; // Turquoise teal
      case 3: return '#45B7D1'; // Sky blue
      default: return '#6C5CE7'; // Purple
    }
  };

  const getRankGradient = (rank) => {
    switch (rank) {
      case 1: return ['#FF6B6B', '#FF8E53']; // Coral to orange gradient
      case 2: return ['#4ECDC4', '#44A08D']; // Teal gradient  
      case 3: return ['#45B7D1', '#96C93D']; // Blue to green gradient
      default: return ['#6C5CE7', '#A29BFE']; // Purple gradient
    }
  };

  // Memoized team name to prevent re-calculations
  const teamName = useMemo(() => {
    const name = teamData?.team?.name || user?.teamName || 'Team';
    return name;
  }, [teamData?.team?.name, user?.teamName]);

  // Header Component - properly memoized
  const AppHeader = React.memo(() => (
    <View style={newStyles.headerContainer}>
      <View style={newStyles.headerContent}>
        <View style={newStyles.logoContainer}>
          <MaskedView
            style={newStyles.maskedView}
            maskElement={
              <Text style={[
                newStyles.logoTextMask, 
                fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}, 
                { transform: [{ skewX: '-10deg' }] }
              ]}>
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
          <Text style={[
            newStyles.teamCheerText,
            fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
          ]}>
            Go {teamName}!
          </Text>
        </View>
      </View>
    </View>
  ));

  // Quick Stats Grid Component - properly memoized
  const QuickStatsGrid = React.memo(({ statistics, activities, totalTeams }) => {
    const isLoading = !statistics || loading;
    const stats = statistics || { 
      donationGoal: 50000, 
      totalRaised: 0, 
      progressPercentage: 0
    };

    // Calculate upcoming events count from activities
    const upcomingEventsCount = activities ? activities.length : 0;

    const statsData = useMemo(() => [
      {
        icon: 'flag',
        value: isLoading ? '$--' : `$${(stats.donationGoal || 0).toLocaleString()}`,
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
    ], [isLoading, stats.donationGoal, stats.progressPercentage, stats.totalRaised, upcomingEventsCount, totalTeams]);

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
  });

  // Status Badge Helper Function
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ongoing':
        return {
          text: 'HAPPENING NOW',
          backgroundColor: '#10b981',
          textColor: 'white'
        };
      case 'past':
        return {
          text: 'ENDED',
          backgroundColor: '#6b7280',
          textColor: 'white'
        };
      default:
        return {
          text: 'UPCOMING',
          backgroundColor: '#f59e0b',
          textColor: 'white'
        };
    }
  };

  // Completely isolated countdown component with its own timer
  const CountdownDisplay = React.memo(() => {
    const [localCountdown, setLocalCountdown] = useState(0);
    const localTimerRef = React.useRef(null);
    
    useEffect(() => {
      // Clear any existing timer
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
      
      // Calculate initial countdown
      const updateCountdown = () => {
        const pstNow = getPSTTime();
        const nextUpdate = getNextLeaderboardUpdate();
        const timeUntilNextUpdate = nextUpdate.getTime() - pstNow.getTime();
        const secondsLeft = Math.max(0, Math.floor(timeUntilNextUpdate / 1000));
        return secondsLeft;
      };
      
      // Set initial value
      setLocalCountdown(updateCountdown());
      
      // Update every second
      localTimerRef.current = setInterval(() => {
        setLocalCountdown(updateCountdown());
      }, 1000);
      
      // Cleanup on unmount
      return () => {
        if (localTimerRef.current) {
          clearInterval(localTimerRef.current);
        }
      };
    }, []); // Empty dependency array - completely isolated
    
    return (
      <Text style={[
        newStyles.sectionSubtext, 
        { 
          color: '#f59e0b', 
          fontWeight: '600' 
        }
      ]}>
        Next update in: {formatCountdown(localCountdown)}
      </Text>
    );
  });

  // Fixed callback for activity selection 
  const handleActivitySelect = useCallback((item) => {
    console.log('🎯 Activity selected:', item);
    // Clear any existing selection first
    setSelectedActivity(null);
    setShowActivityDetails(false);
    
    // Set new selection after a brief delay to ensure clean state
    setTimeout(() => {
      setSelectedActivity(item);
      setShowActivityDetails(true);
      console.log('✅ Modal should now be visible');
    }, 50);
  }, []);

  // Stable callback for modal close to prevent re-renders  
  const handleModalClose = useCallback(() => {
    console.log('🚪 Closing activity modal');
    setShowActivityDetails(false);
    setTimeout(() => {
      setSelectedActivity(null);
    }, 200);
  }, []);

  // Stable callbacks for leaderboard modal to prevent re-renders
  const handleLeaderboardOpen = useCallback(() => {
    setShowFullLeaderboard(true);
  }, []);

  const handleLeaderboardClose = useCallback(() => {
    setShowFullLeaderboard(false);
  }, []);
  
  // Animated Status Badge Component with complete isolation
  const AnimatedStatusBadge = React.memo(({ item, statusBadge }) => {
    const flashAnimation = React.useRef(new Animated.Value(1)).current;
    const hasStartedFlashing = React.useRef(false);
    const animationRef = React.useRef(null);
    const animationTimeout = React.useRef(null);
    const itemIdRef = React.useRef(item.id);
    const statusRef = React.useRef(item.status);
    
    React.useEffect(() => {
      // Reset if this is a different item or status changed
      if (itemIdRef.current !== item.id || statusRef.current !== item.status) {
        itemIdRef.current = item.id;
        statusRef.current = item.status;
        hasStartedFlashing.current = false;
        
        // Clean up existing animation
        if (animationTimeout.current) {
          clearTimeout(animationTimeout.current);
          animationTimeout.current = null;
        }
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
        flashAnimation.setValue(1);
      }
      
      // Only start flashing for ongoing items that haven't started yet
      if (item.status === 'ongoing' && !hasStartedFlashing.current) {
        hasStartedFlashing.current = true;
        
        // Use setTimeout to defer animation start to avoid insertion effect warnings
        const timeoutId = setTimeout(() => {
          // Start flashing animation
          const flashSequence = Animated.sequence([
            Animated.timing(flashAnimation, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(flashAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]);
          
          // Create infinite loop
          const flashLoop = Animated.loop(flashSequence);
          animationRef.current = flashLoop;
          
          // Start the animation
          flashLoop.start();
          
          // Stop animation after exactly 5 seconds
          animationTimeout.current = setTimeout(() => {
            if (animationRef.current) {
              animationRef.current.stop();
              animationRef.current = null;
            }
            flashAnimation.setValue(1); // Ensure it ends at full opacity
            hasStartedFlashing.current = false; // Allow restart if needed
          }, 5000); // 5 seconds
          
        }, 0);
        
        return () => {
          clearTimeout(timeoutId);
          if (animationTimeout.current) {
            clearTimeout(animationTimeout.current);
          }
          if (animationRef.current) {
            animationRef.current.stop();
            flashAnimation.setValue(1);
          }
        };
      }
    }, []); // Remove all dependencies to prevent re-execution

    // Reset flashing state when item status changes from ongoing
    React.useEffect(() => {
      if (item.status !== 'ongoing' && hasStartedFlashing.current) {
        hasStartedFlashing.current = false;
        if (animationTimeout.current) {
          clearTimeout(animationTimeout.current);
          animationTimeout.current = null;
        }
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
        flashAnimation.setValue(1);
      }
    }, [item.status]);

    return (
      <Animated.View 
        style={[
          newStyles.statusBadge,
          { 
            backgroundColor: statusBadge.backgroundColor,
            opacity: item.status === 'ongoing' ? flashAnimation : 1
          }
        ]}
      >
        <Text style={[
          newStyles.statusText,
          { color: statusBadge.textColor }
        ]}>
          {statusBadge.text}
        </Text>
      </Animated.View>
    );
  });

  // Upcoming Events Section Component with stable rendering
  const UpcomingEventsSection = React.memo(({ events }) => {

    const renderEventCard = useCallback(({ item }) => {
      const statusBadge = getStatusBadge(item.status);
      
      return (
        <TouchableOpacity style={newStyles.eventCard} activeOpacity={0.9} key={item.id}>
          <View style={newStyles.eventHeader}>
            <Text style={newStyles.eventTitle}>{item.title}</Text>
            <AnimatedStatusBadge item={item} statusBadge={statusBadge} />
          </View>
          
          <View style={newStyles.eventDetails}>
            <View style={newStyles.eventDetailRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <View style={newStyles.eventDateTimeContainer}>
                <Text style={[
                  newStyles.eventDateText,
                  item.isToday && newStyles.todayText
                ]}>
                  {item.date}
                </Text>
                <Text style={newStyles.eventTimeText}>{item.time}</Text>
              </View>
            </View>
            
            {item.points > 0 && (
              <View style={[newStyles.eventDetailRow, { marginBottom: 16 }]}>
                <Ionicons name="trophy-outline" size={16} color="#6b7280" />
                <Text style={newStyles.eventDetailText}>{item.points} points</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={newStyles.staticJoinButton}
            onPress={() => {
              console.log('🎯 View Activity button pressed for item:', item.title);
              handleActivitySelect(item);
            }}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={newStyles.staticJoinButtonGradient}
            >
              <Ionicons name="arrow-forward" size={16} color="white" />
              <Text style={newStyles.staticJoinButtonText}>View Activity</Text>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }, [handleActivitySelect]);

    return (
      <View style={newStyles.sectionContainer}>
        <View style={newStyles.sectionHeader}>
          <View style={newStyles.sectionTitleRow}>
            <Ionicons name="flash" size={24} color="#FF6B6B" />
            <Text style={newStyles.sectionTitle}>Activities</Text>
          </View>
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
  });

  // Activity Details Modal Component with simple fade animation (matching leaderboard modal)
  const ActivityDetailsModal = React.memo(() => {
    // Simple visibility check
    const modalVisible = Boolean(showActivityDetails && selectedActivity);
    
    console.log('🔍 Modal render check:', { 
      showActivityDetails, 
      selectedActivity: !!selectedActivity, 
      modalVisible
    });
    
    if (!modalVisible || !selectedActivity) return null;

    const statusBadge = getStatusBadge(selectedActivity.status);

    return (
      <Modal
        key={`activity-modal-${selectedActivity.id}`}
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
        statusBarTranslucent={true}
      >
        <View style={newStyles.activityModalOverlay}>
          <TouchableOpacity 
            style={newStyles.activityModalOverlayTouch}
            activeOpacity={1}
            onPress={handleModalClose}
          />
          <View style={newStyles.activityModalContent}>
            <View style={newStyles.activityModalHeader}>
              <View style={newStyles.activityModalTitleRow}>
                <Ionicons name="flash" size={24} color="#FF6B6B" />
                <Text style={newStyles.activityModalTitle}>Activity Details</Text>
              </View>
              <TouchableOpacity 
                style={newStyles.activityCloseButton}
                onPress={handleModalClose}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={newStyles.activityModalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={newStyles.activityDetailsContainer}>
                {/* Only render content if we have a valid selected activity */}
                {selectedActivity && (
                  <>
                    {/* Title */}
                    <Text style={newStyles.activityModalActivityTitle}>
                      {selectedActivity.title}
                    </Text>

                    {/* Time */}
                    <View style={newStyles.activityInfoCard}>
                      <Text style={newStyles.activityInfoLabel}>Schedule</Text>
                      <Text style={newStyles.activityInfoValue}>
                        Starts: {selectedActivity.date} at {selectedActivity.time}
                      </Text>
                      {selectedActivity.endDate && selectedActivity.endTime ? (
                        <Text style={newStyles.activityInfoSubValue}>
                          Ends: {selectedActivity.endDate} at {selectedActivity.endTime}
                        </Text>
                      ) : (
                        <Text style={newStyles.activityInfoSubValue}>
                          End time: Not specified
                        </Text>
                      )}
                    </View>

                    {/* Points */}
                    {selectedActivity.points > 0 && (
                      <View style={newStyles.activityInfoCard}>
                        <Text style={newStyles.activityInfoLabel}>Points</Text>
                        <Text style={newStyles.activityInfoValue}>
                          {selectedActivity.points} points
                        </Text>
                      </View>
                    )}

                    {/* Description */}
                    {selectedActivity.description && (
                      <View style={newStyles.activityDescriptionCard}>
                        <Text style={newStyles.activityDescriptionLabel}>Description</Text>
                        <Text style={newStyles.activityDescriptionText}>
                          {selectedActivity.description}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  });

  // Leaderboard Section Component - Podium Style with memoization
  const LeaderboardSection = React.memo(({ teams }) => {
    const safeTeams = teams || [];
    const topThreeTeams = safeTeams.slice(0, 3);
    
    const renderPodiumTeam = useCallback((team, rank) => {
      const isUserTeam = team.name === teamData?.team?.name || 
                        team.name === user?.teamName || 
                        team.id === user?.teamId;
      
      return (
        <View style={newStyles.podiumColumn}>
          {/* Team Card */}
          <View style={[
            newStyles.teamCard,
            isUserTeam && newStyles.userTeamCard
          ]}>
            {/* Rank Icon with Gradient Background - moved to where people icon was */}
            <LinearGradient
              colors={getRankGradient(rank)}
              style={newStyles.rankIconContainer}
            >
              <Ionicons name={getRankIcon(rank)} size={24} color="white" />
            </LinearGradient>
            
            <Text style={[
              newStyles.teamNamePodium,
              isUserTeam && { color: '#FF6B6B' }
            ]} numberOfLines={1}>
              {team?.name || 'Team'}
            </Text>
            
            <Text style={newStyles.teamPointsPodium}>
              {team?.totalScore || 0} pts
            </Text>
          </View>
          
          {/* Podium Base with Gradient */}
          <LinearGradient
            colors={getRankGradient(rank)}
            style={[
              newStyles.podiumBase,
              {
                height: rank === 1 ? 70 : rank === 2 ? 55 : 45,
              }
            ]}
          >
            <Text style={newStyles.rankNumber}>{rank}</Text>
          </LinearGradient>
        </View>
      );
    }, [teamData?.team?.name, user?.teamName, user?.teamId]);

    const renderFullLeaderboardItem = useCallback(({ item, index }) => {
      const rank = index + 1;
      const isUserTeam = item.name === teamData?.team?.name || 
                        item.name === user?.teamName || 
                        item.id === user?.teamId;
      
      return (
        <View style={[
          newStyles.fullLeaderboardItem,
          isUserTeam && newStyles.userTeamItem
        ]}>
          <View style={[
            newStyles.rankBadge,
            { backgroundColor: getRankColor(rank) }
          ]}>
            <Text style={newStyles.rankText}>{rank}</Text>
          </View>
          
          <View style={[
            newStyles.teamAvatar,
            isUserTeam && { backgroundColor: 'rgba(255, 107, 107, 0.15)' }
          ]}>
            <Ionicons name="people" size={18} color={isUserTeam ? "#FF6B6B" : "#6b7280"} />
          </View>
          
          <View style={newStyles.teamDetails}>
            <Text style={[
              newStyles.teamName,
              isUserTeam && newStyles.userTeamName
            ]}>
              {item?.name || 'Team Name'} 
              {isUserTeam && <Text style={newStyles.youBadge}> (You)</Text>}
            </Text>
          </View>
          
          <View style={newStyles.pointsSection}>
            <Text style={[newStyles.teamPoints, isUserTeam && { color: '#FF6B6B' }]}>
              {item?.totalScore || 0}
            </Text>
            <Text style={newStyles.pointsUnit}>pts</Text>
          </View>
        </View>
      );
    }, [teamData?.team?.name, user?.teamName, user?.teamId]);

    return (
      <>
        <View style={newStyles.sectionContainer}>
          <View style={newStyles.sectionHeader}>
            <View style={newStyles.sectionTitleRow}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={newStyles.sectionTitle}>Leaderboard</Text>
            </View>
            <TouchableOpacity 
              style={newStyles.viewAllButton}
              onPress={handleLeaderboardOpen}
            >
              <Text style={newStyles.viewAllText}>View Full</Text>
              <Ionicons name="chevron-forward" size={16} color="#0891b2" />
            </TouchableOpacity>
          </View>
          
          {safeTeams.length === 0 ? (
            <View style={newStyles.emptyLeaderboard}>
              <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
              <Text style={newStyles.emptyText}>No teams yet</Text>
              <Text style={newStyles.emptySubtext}>
                Teams will appear here as they join the competition
              </Text>
            </View>
          ) : (
            <View style={newStyles.podiumContainer}>
              <View style={newStyles.podiumRow}>
                {/* 2nd Place - Left */}
                {topThreeTeams.length >= 2 ? (
                  <View key={`podium-2nd`} style={newStyles.podiumPosition}>
                    {renderPodiumTeam(topThreeTeams[1], 2)}
                  </View>
                ) : (
                  <View style={newStyles.podiumPosition} />
                )}
                
                {/* 1st Place - Center (Tallest) */}
                {topThreeTeams.length >= 1 ? (
                  <View key={`podium-1st`} style={newStyles.podiumPosition}>
                    {renderPodiumTeam(topThreeTeams[0], 1)}
                  </View>
                ) : (
                  <View style={newStyles.podiumPosition} />
                )}
                
                {/* 3rd Place - Right */}
                {topThreeTeams.length >= 3 ? (
                  <View key={`podium-3rd`} style={newStyles.podiumPosition}>
                    {renderPodiumTeam(topThreeTeams[2], 3)}
                  </View>
                ) : (
                  <View style={newStyles.podiumPosition} />
                )}
              </View>
            </View>
          )}
          
          {/* Simple countdown display below podium */}
          <View style={{ 
            alignItems: 'center', 
            paddingVertical: 8,
            paddingHorizontal: 16
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              gap: 8
            }}>
              <Ionicons 
                name="refresh-outline" 
                size={16} 
                color="#6b7280" 
              />
              <CountdownDisplay />
            </View>
          </View>
        </View>

        {/* Full Leaderboard Modal */}
        <Modal
          key="leaderboard-modal"
          animationType="fade"
          transparent={true}
          visible={showFullLeaderboard}
          onRequestClose={handleLeaderboardClose}
          statusBarTranslucent={true}
        >
          <View style={newStyles.modalOverlay}>
            <TouchableOpacity 
              style={newStyles.modalOverlayTouch}
              activeOpacity={1}
              onPress={handleLeaderboardClose}
            />
            <View style={newStyles.modalContent}>
              <View style={newStyles.modalHeader}>
                <View style={newStyles.modalTitleRow}>
                  <Ionicons name="trophy" size={24} color="#FF6B6B" />
                  <Text style={newStyles.modalTitle}>Full Leaderboard</Text>
                </View>
                <TouchableOpacity 
                  style={newStyles.closeButton}
                  onPress={handleLeaderboardClose}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={newStyles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {safeTeams.map((team, index) => (
                  <View key={team.id || team.name || index}>
                    {renderFullLeaderboardItem({ item: team, index })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  });



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
            {/* Leaderboard Section - Top 3 Podium */}
            <LeaderboardSection teams={leaderboardData} />
            
            {/* Upcoming Events Section */}
            <UpcomingEventsSection events={upcomingEvents} />
            
            {/* Quick Stats Grid */}
            <QuickStatsGrid 
              statistics={statistics} 
              activities={activities}
              totalTeams={totalTeams}
            />
            
            {/* Bottom spacing */}
            <View style={newStyles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
        
        {/* Activity Details Modal */}
        <ActivityDetailsModal />
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
    letterSpacing: -0.5,
    // Shadow properties
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  logoGradient: {
    flex: 1,
  },

  userSection: {
    alignItems: 'flex-end',
  },

  teamCheerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: -0.3,
    fontFamily: 'System', // iOS system font for consistency
    textTransform: 'uppercase',
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
    paddingTop: 12,
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

  // Update Info Styles
  updateInfoContainer: {
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
  },

  updateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  updateInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
  },

  cachedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },

  cachedText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },

  // Events Styles
  eventsList: {
    paddingLeft: 16,
  },

  eventCard: {
    width: 280,
    height: 200, // Increased height for better spacing
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
    justifyContent: 'space-between', // Distribute content evenly
  },

  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    paddingRight: 8,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  eventDetails: {
    flex: 1, // Take up available space between header and button
    justifyContent: 'flex-start',
    marginBottom: 16, // Balanced space between details and button
  },

  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Increased spacing between detail rows
  },

  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },

  eventDateTimeContainer: {
    marginLeft: 8,
  },

  eventDateText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },

  eventTimeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  todayText: {
    color: '#10b981',
    fontWeight: '800',
  },

  staticJoinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 'auto', // Push to bottom of card
  },

  staticJoinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  staticJoinButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
    letterSpacing: -0.2,
  },

  // Podium Leaderboard Styles - iOS Native Feel
  podiumContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    // iOS-style backdrop blur simulation
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
  },

  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 16,
  },

  podiumPosition: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  podiumColumn: {
    alignItems: 'center',
    width: '100%',
  },

  rankIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  teamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    width: '100%',
    alignItems: 'center',
    // iOS card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  userTeamCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.25)',
    borderWidth: 1.5,
  },

  teamAvatarPodium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // iOS icon shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  teamNamePodium: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F', // iOS system text color
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },

  teamPointsPodium: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6D6D70', // iOS secondary text
    textAlign: 'center',
    letterSpacing: -0.1,
  },

  podiumBase: {
    width: '90%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // iOS podium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  rankNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Helvetica-LightOblique',
    // iOS number shadow
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: -0.5,
  },

  // Full Leaderboard Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
    backgroundColor: '#fafafa',
  },

  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
  },

  modalScrollView: {
    maxHeight: 450,
  },

  fullLeaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.2)',
  },

  userTeamItem: {
    backgroundColor: 'rgba(8, 145, 178, 0.06)',
    borderLeftWidth: 4,
    borderLeftColor: '#0891b2',
  },

  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },



  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    fontStyle: 'italic',
  },

  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  teamDetails: {
    flex: 1,
  },

  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },

  userTeamName: {
    color: '#FF6B6B',
  },

  youBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    fontStyle: 'italic',
  },

  pointsSection: {
    alignItems: 'flex-end',
  },

  teamPoints: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  pointsUnit: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
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

  // Activity Details Modal Styles
  activityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  activityModalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  activityModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 1,
  },

  activityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },

  activityModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },

  activityCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
  },

  activityModalScrollView: {
    flex: 1,
  },

  activityDetailsContainer: {
    padding: 24,
    paddingTop: 16,
  },

  activityTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  activityModalActivityTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 32,
  },

  activityModalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },

  activityModalStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  activityInfoCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.4)',
  },

  activityInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  activityInfoText: {
    flex: 1,
    marginLeft: 12,
  },

  activityInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  activityInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },

  activityInfoSubValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
  },

  activityDescriptionCard: {
    backgroundColor: 'rgba(255, 247, 237, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },

  activityDescriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  activityDescriptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#78350f',
    lineHeight: 22,
  },

  activityModalActions: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.3)',
    backgroundColor: '#fafafa',
  },

  activityActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  activityActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  activityActionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: -0.2,
  },
};

export default LeaderboardScreen;