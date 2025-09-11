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
} from 'react-native';
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
  const [showAllStudents, setShowAllStudents] = useState(false);

  const fetchTeamData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('🏆 Fetching coach dashboard data from:', API_ROUTES.coach.students);
      const response = await fetchWithTimeout(API_ROUTES.coach.students, { headers }, 15000);
      
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData || []);
        
        // Calculate team stats
        const stats = {
          totalStudents: studentsData.length,
          totalPoints: studentsData.reduce((sum, student) => sum + (student.points || 0), 0),
          totalDonations: studentsData.reduce((sum, student) => sum + (student.totalDonations || 0), 0),
        };
        setTeamStats(stats);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
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
        <View style={styles.header}>
          <Text style={styles.greeting}>Coach Dashboard 🏆</Text>
          <Text style={styles.subtitle}>Team Management & Performance</Text>
        </View>

        {/* Team Stats Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Team Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{teamStats.totalStudents || 0}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{teamStats.totalPoints || 0}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>${(teamStats.totalDonations || 0).toFixed(2)}</Text>
                <Text style={styles.statLabel}>Team Donations</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Student List Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Team Members</Text>
            {students.length > 3 && (
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => setShowAllStudents(true)}
              >
                <Text style={styles.seeAllText}>See All ({students.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.studentsCard}>
            {students.length > 0 ? (
              students.slice(0, 3).map((student) => (
                <View key={student.id} style={styles.studentItem}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarText}>
                      {student.name?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                  </View>
                  <View style={styles.studentStats}>
                    <Text style={styles.studentPoints}>{student.points || 0} pts</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No team members found</Text>
            )}
          </View>
        </View>

        {/* Management Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>🚀 Coach Tools</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowAllStudents(true)}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionText}>All Students</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ManagePoints')}
            >
              <Text style={styles.actionIcon}>⭐</Text>
              <Text style={styles.actionText}>Manage Points</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Announcements')}
            >
              <Text style={styles.actionIcon}>📢</Text>
              <Text style={styles.actionText}>Announcements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('SubmissionManagement')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Submission Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ProductSales')}
            >
              <Text style={styles.actionIcon}>🛍️</Text>
              <Text style={styles.actionText}>Product Sales</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* All Students Overlay */}
      <Modal
        visible={showAllStudents}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Team Members ({students.length})</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAllStudents(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={students}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.modalList}
            renderItem={({ item: student }) => (
              <View style={styles.modalStudentItem}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {student.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalStudentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                </View>
                <View style={styles.modalStudentStats}>
                  <Text style={styles.studentPoints}>{student.points || 0} pts</Text>
                  <Text style={styles.studentLastActive}>
                    Last active: {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                  </Text>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  greeting: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },

  actionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    width: cardWidth,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionIcon: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.sm,
  },

  actionText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },

  footerSpace: {
    height: Spacing.xl,
  },

  // Team Stats Styles
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },

  // Student List Styles
  studentsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: FontSizes.md,
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.foreground,
  },

  studentEmail: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },

  studentStats: {
    alignItems: 'flex-end',
  },

  studentPoints: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },

  seeAllButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },

  seeAllText: {
    color: 'white',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    color: Colors.muted,
    fontSize: FontSizes.md,
    fontStyle: 'italic',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.destructive || '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  closeButtonText: {
    fontSize: FontSizes.lg,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: FontSizes.lg,
  },

  modalList: {
    padding: Spacing.md,
  },

  modalStudentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  modalStudentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  modalStudentStats: {
    alignItems: 'flex-end',
  },

  studentLastActive: {
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
};

export default CoachDashboard;
