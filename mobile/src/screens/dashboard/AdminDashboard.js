import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - Spacing.lg * 3) / 2;

const AdminDashboard = ({ navigation }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalRaised: 0
  });

  const fetchSystemData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      
      const [usersResponse, teamsResponse, donationsResponse] = await Promise.all([
        fetch(API_ROUTES.admin.users, { headers }),
        fetch(API_ROUTES.admin.teams, { headers }),
        fetch(API_ROUTES.donations.list, { headers }),
      ]);

      const [usersData, teamsData, donationsData] = await Promise.all([
        usersResponse.json(),
        teamsResponse.json(),
        donationsResponse.json(),
      ]);

      
      const totalRaised = donationsData.reduce((sum, donation) => sum + (donation.amount || 0), 0);

      setSystemStats({
        totalUsers: usersData.length || 0,
        totalTeams: teamsData.length || 0,
        totalRaised: totalRaised,
      });
      
    } catch (error) {
      setSystemStats({
        totalUsers: 0,
        totalTeams: 0,
        totalRaised: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSystemData();
  };

  if (loading) {
    return (
      <SafeAreaView style={Styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={Styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Welcome back, Admin!</Text>
                <Text style={styles.subtitle}>System Management Dashboard</Text>
              </View>
            </View>
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStat}>
                <Ionicons name="people" size={18} color="#059669" />
                <Text style={styles.quickStatNumber}>{systemStats.totalUsers}</Text>
                <Text style={styles.quickStatLabel}>Users</Text>
              </View>
              <View style={styles.quickStat}>
                <Ionicons name="basketball" size={18} color="#d97706" />
                <Text style={styles.quickStatNumber}>{systemStats.totalTeams}</Text>
                <Text style={styles.quickStatLabel}>Teams</Text>
              </View>
              <View style={styles.quickStat}>
                <Ionicons name="cash" size={18} color="#7c3aed" />
                <Text style={styles.quickStatNumber}>${systemStats.totalRaised.toFixed(0)}</Text>
                <Text style={styles.quickStatLabel}>Total Raised</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Management Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={24} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Management Tools</Text>
          </View>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="people-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>User Management</Text>
              <Text style={styles.actionSubtext}>Manage all users & roles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('TeamManagement')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="basketball-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>Team Management</Text>
              <Text style={styles.actionSubtext}>Organize teams & coaches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ActivityManagement')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="trophy-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>Activity Management</Text>
              <Text style={styles.actionSubtext}>Configure activities</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('InventoryManagement')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="cube-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>Inventory Management</Text>
              <Text style={styles.actionSubtext}>Manage products & stock</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AnnouncementManagement')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="megaphone-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>Announcements</Text>
              <Text style={styles.actionSubtext}>Global announcements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('SettingsManagement')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="cog-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>Settings</Text>
              <Text style={styles.actionSubtext}>System configuration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  loadingText: {
    fontSize: FontSizes.lg,
    color: '#64748b',
    fontWeight: '500',
    marginTop: Spacing.md,
  },

  headerContainer: {
    backgroundColor: '#ffffff',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  header: {
    paddingHorizontal: Spacing.lg,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },

  subtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
  },

  headerIcon: {
    marginLeft: Spacing.md,
  },

  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  quickStat: {
    alignItems: 'center',
    flex: 1,
  },

  quickStatNumber: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: Spacing.xs,
    marginBottom: 2,
  },

  quickStatLabel: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    fontWeight: '500',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: Spacing.sm,
    flex: 1,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },

  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    width: (screenWidth - Spacing.lg * 3) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  actionText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  actionSubtext: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
  },

  footerSpace: {
    height: Spacing.xl,
  },
};

export default AdminDashboard;
