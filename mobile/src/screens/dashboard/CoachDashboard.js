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
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - Spacing.lg * 3) / 2;

const CoachDashboard = ({ navigation }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [teamData, setTeamData] = useState(null);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [modalOpacity] = useState(new Animated.Value(0));

  const fetchTeamData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // First, get current user info with coached teams
      const userRes = await fetchWithTimeout(API_ROUTES.auth.me, { headers }, 15000);
      
      if (!userRes.ok) {
        const errorText = await userRes.text();
        throw new Error(`Failed to fetch user data: ${userRes.status} - ${errorText}`);
      }
      
      const userData = await userRes.json();
      
      // Check if user has coached teams
      if (!userData.user.coachedTeams || userData.user.coachedTeams.length === 0) {
        return;
      }

      // Get the first coached team
      const coachedTeam = userData.user.coachedTeams[0];
      setTeamData(coachedTeam);

      // Now fetch leaderboard data (same as LeaderboardScreen) to get complete team stats
      const leaderboardResponse = await fetchWithTimeout(API_ROUTES.LEADERBOARD.GET, { headers }, 15000);
      
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        
        // Find our coached team in the leaderboard data
        const ourTeamData = leaderboardData.find(team => team.id === coachedTeam.id);
        
        if (ourTeamData) {
          
          // Set team stats from leaderboard data (this has the complete calculated stats)
          const leaderboardStats = {
            totalStudents: ourTeamData.memberCount || 0,
            totalPoints: ourTeamData.totalScore || 0,
            totalDonations: ourTeamData.stats?.totalDonations || 0,
          };
          
          setTeamStats(leaderboardStats);
        } else {
          // Fallback to basic team data
          setTeamStats({
            totalStudents: 0,
            totalPoints: 0,
            totalDonations: 0,
          });
        }
      } else {
        // Fallback to basic team data
        setTeamStats({
          totalStudents: 0,
          totalPoints: 0,
          totalDonations: 0,
        });
      }

      // Still fetch team members for the modal display
      const membersResponse = await fetchWithTimeout(
        API_ROUTES.teams.members(coachedTeam.id), 
        { headers }, 
        15000
      );
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        
        // Filter to only show students (not coaches or admins)
        const studentMembers = membersData.filter(member => member.role === 'STUDENT');
        
        // Now fetch donation data for each student
        const studentsWithDonations = await Promise.all(
          studentMembers.map(async (student) => {
            try {
              // Fetch all donations and filter by user and team
              const donationsResponse = await fetchWithTimeout(
                API_ROUTES.donations.list,
                { headers },
                10000
              );
              
              if (donationsResponse.ok) {
                const allDonations = await donationsResponse.json();
                
                // Filter donations for this specific student and team
                const studentDonations = allDonations.filter(donation => {
                  return donation.userId === student.id && donation.teamId === coachedTeam.id;
                });
                
                // Calculate total donations for this student
                const totalDonations = studentDonations.reduce((sum, donation) => sum + donation.amount, 0);
                
                return {
                  ...student,
                  donations: totalDonations
                };
              } else {
                return {
                  ...student,
                  donations: 0
                };
              }
            } catch (error) {
              return {
                ...student,
                donations: 0
              };
            }
          })
        );
        
        setStudents(studentsWithDonations || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      setTeamStats({
        totalStudents: 0,
        totalPoints: 0,
        totalDonations: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamData();
  };

  const openStudentsModal = () => {
    setShowAllStudents(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeStudentsModal = () => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAllStudents(false);
    });
  };

  const handleActionPress = (action) => {
    // Add a subtle scale animation to the pressed button
    const scaleValue = new Animated.Value(1);
    
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      action();
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={Styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
                <Text style={styles.greeting}>Welcome back, Coach!</Text>
                <Text style={styles.subtitle}>{teamData ? teamData.name : 'Loading team...'}</Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#059669" />
              </View>
            </View>
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStat}>
                <Ionicons name="people" size={18} color="#059669" />
                <Text style={styles.quickStatNumber}>{teamStats.totalStudents || 0}</Text>
                <Text style={styles.quickStatLabel}>Members</Text>
              </View>
              <View style={styles.quickStat}>
                <Ionicons name="star" size={18} color="#d97706" />
                <Text style={styles.quickStatNumber}>{teamStats.totalPoints || 0}</Text>
                <Text style={styles.quickStatLabel}>Points</Text>
              </View>
              <View style={styles.quickStat}>
                <Ionicons name="cash" size={18} color="#7c3aed" />
                <Text style={styles.quickStatNumber}>${(teamStats.totalDonations || 0).toFixed(0)}</Text>
                <Text style={styles.quickStatLabel}>Raised</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={24} color="#6b21a8" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleActionPress(openStudentsModal)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="people-outline" size={24} color="#6b21a8" />
              </View>
              <Text style={styles.actionText}>View All Students</Text>
              <Text style={styles.actionSubtext}>Manage team members</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ManagePoints')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="star-outline" size={24} color="#6b21a8" />
              </View>
              <Text style={styles.actionText}>Award Points</Text>
              <Text style={styles.actionSubtext}>Manage student points</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Announcements')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="megaphone-outline" size={24} color="#6b21a8" />
              </View>
              <Text style={styles.actionText}>Announcements</Text>
              <Text style={styles.actionSubtext}>Send team updates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ProductSales')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="storefront-outline" size={24} color="#6b21a8" />
              </View>
              <Text style={styles.actionText}>Product Sales</Text>
              <Text style={styles.actionSubtext}>Manage inventory</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* All Students Modal */}
      <Modal
        visible={showAllStudents}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeStudentsModal}
      >
        <Animated.View style={[styles.modalContainer, { opacity: modalOpacity }]}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="people" size={22} color="#6366f1" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>👥 Team Members</Text>
                  <Text style={styles.modalSubtitle}>{teamData?.name || 'Team'} • {students.length} members</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeStudentsModal}
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={students.sort((a, b) => a.name?.localeCompare(b.name))}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: student, index }) => (
                <Animated.View 
                  style={[
                    styles.modalStudentItem,
                    {
                      opacity: modalOpacity,
                      transform: [{
                        translateY: modalOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarText}>
                      {student.name?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalStudentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                  </View>
                  <View style={styles.modalStudentStats}>
                    <View style={styles.donationBadge}>
                      <Ionicons name="cash" size={14} color="#059669" />
                      <Text style={styles.donationAmount}>${(student.donations || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            />
          </SafeAreaView>
        </Animated.View>
      </Modal>
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
    paddingTop: Spacing.lg,
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

  performanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  performanceStat: {
    alignItems: 'center',
    flex: 1,
  },

  performanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  performanceLabel: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },

  performanceValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
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
    fontSize: FontSizes.sm,
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

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },

  seeAllText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  studentsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },

  rankText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: '#6b21a8',
  },

  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: FontSizes.lg,
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },

  studentEmail: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
  },

  studentStats: {
    alignItems: 'flex-end',
  },

  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  studentPoints: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#92400e',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  emptySubtext: {
    fontSize: FontSizes.sm,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '400',
  },

  footerSpace: {
    height: Spacing.xl,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  modalSafeArea: {
    flex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },

  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },

  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '500',
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  modalList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  modalStudentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: Spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  modalRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },

  modalRankText: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
    color: '#3b82f6',
  },

  modalStudentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  modalStudentStats: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },

  studentLastActive: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '400',
  },

  donationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 6,
  },

  donationAmount: {
    fontSize: FontSizes.sm,
    color: '#059669',
    fontWeight: '600',
  },
};

export default CoachDashboard;
