import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';

// Import components
import TeamOverviewCard from '../student/TeamOverviewCard';
import TeamMembersCard from '../student/TeamMembersCard';
import AnnouncementsCard from '../student/AnnouncementsCard';

const StudentDashboard = ({ navigation }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchTeamDashboard();
  }, []);

  const fetchTeamDashboard = async () => {
    try {
      console.log('🔄 Fetching team dashboard...');
      
      const response = await fetchWithTimeout(API_ROUTES.teams.myTeam, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }

      const teamData = await response.json();
      console.log('✅ Team dashboard data:', teamData);

      // Calculate total raised from team's donations
      if (teamData.stats && teamData.donations) {
        const totalRaised = teamData.donations.reduce((total, donation) => {
          return total + (parseFloat(donation.amount) || 0);
        }, 0);
        
        teamData.stats.totalRaised = totalRaised;
        console.log(`✅ Calculated team total raised from donations: $${totalRaised.toFixed(2)}`);
        console.log(`📊 Number of donations: ${teamData.donations.length}`);
      } else if (teamData.recentDonations) {
        // Fallback to recentDonations if donations array doesn't exist
        const totalRaised = teamData.recentDonations.reduce((total, donation) => {
          return total + (parseFloat(donation.amount) || 0);
        }, 0);
        
        if (teamData.stats) {
          teamData.stats.totalRaised = totalRaised;
        }
        console.log(`✅ Calculated team total raised from recentDonations: $${totalRaised.toFixed(2)}`);
      } else {
        console.log('⚠️ No donations data found in team payload');
        if (teamData.stats) {
          teamData.stats.totalRaised = teamData.stats.totalRaised || 0;
        }
      }

      setTeamData(teamData);
      setError('');
    } catch (error) {
      console.error('❌ Error fetching team dashboard:', error);
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeamDashboard();
    setRefreshing(false);
  };



  // Modern Header Component
  const ModernHeader = () => (
    <LinearGradient
      colors={['#0891b2', '#06b6d4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.modernHeader}
    >
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#f59e0b', '#eab308']}
              style={styles.avatar}
            >
              <Ionicons name="person" size={20} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>
              {user?.name ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome back!'}
            </Text>
            <Text style={styles.roleText}>Team Member</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={['#ffffff', '#f8fafc']} 
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#0891b2" />
              <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (error && !teamData) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={['#ffffff', '#f8fafc']} 
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity 
                style={styles.modernRetryButton}
                onPress={() => {
                  setLoading(true);
                  setError('');
                  fetchTeamDashboard();
                }}
              >
                <LinearGradient
                  colors={['#0891b2', '#06b6d4']}
                  style={styles.retryButtonGradient}
                >
                  <Ionicons name="refresh" size={18} color="white" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (!teamData) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={['#ffffff', '#f8fafc']} 
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <Ionicons name="people-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyTitle}>No Team Found</Text>
              <Text style={styles.emptyMessage}>Make sure you're part of a team to view your dashboard</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Modern Header */}
          <ModernHeader />
          
          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
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
            {/* Error Display */}
            {error ? (
              <View style={styles.inlineErrorContainer}>
                <View style={styles.inlineErrorContent}>
                  <Ionicons name="warning-outline" size={20} color="#ef4444" />
                  <Text style={styles.inlineErrorText}>{error}</Text>
                </View>
              </View>
            ) : null}

            {/* Content */}
            <View style={styles.content}>
              {/* Team Overview - Hero Card */}
              <View style={styles.heroCard}>
                <TeamOverviewCard team={teamData.team} stats={teamData.stats} />
              </View>

              {/* Announcements */}
              <View style={styles.modernCard}>
                <AnnouncementsCard teamId={teamData.team?.id} />
              </View>

              {/* Team Members */}
              <View style={styles.modernCard}>
                <TeamMembersCard members={teamData.team?.members} />
              </View>
            </View>
            
            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = {
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
  
  // Modern Header Styles
  modernHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    fontWeight: '500',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '90%',
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modernRetryButton: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '90%',
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Main Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  
  // Inline Error
  inlineErrorContainer: {
    margin: 20,
    marginBottom: 0,
  },
  inlineErrorContent: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineErrorText: {
    color: '#dc2626',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },

  // Cards
  heroCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  modernCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  bottomSpacing: {
    height: 20,
  },
};

export default StudentDashboard;