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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - Spacing.lg * 3) / 2;

const StaffDashboard = () => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    operationalStats: {
      totalSubmissions: 0,
      pendingReviews: 0,
      approvedToday: 0,
      rejectedToday: 0,
      averageReviewTime: 0,
    },
    recentSubmissions: [],
    staffTasks: [],
    systemHealth: {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
    },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_ROUTES.DASHBOARD.STAFF}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setDashboardData({
          operationalStats: data.operationalStats || {},
          recentSubmissions: data.recentSubmissions || [],
          staffTasks: data.staffTasks || [],
          systemHealth: data.systemHealth || {},
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to load staff dashboard');
      }
    } catch (error) {
      console.error('Staff dashboard fetch error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const StatCard = ({ title, value, subtitle, icon, color = Colors.primary, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { width: cardWidth }]} onPress={onPress}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const SubmissionCard = ({ submission }) => (
    <View style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        <View style={styles.submissionInfo}>
          <Text style={styles.submissionStudent}>{submission.studentName}</Text>
          <Text style={styles.submissionActivity}>{submission.activityName}</Text>
        </View>
        <View style={styles.submissionMeta}>
          <Text style={styles.submissionTime}>
            {new Date(submission.submittedAt).toLocaleTimeString()}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(submission.status) }
          ]}>
            <Text style={styles.statusText}>{submission.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.submissionActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleSubmissionAction(submission.id, 'APPROVE')}
        >
          <Text style={styles.actionButtonText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleSubmissionAction(submission.id, 'REJECT')}
        >
          <Text style={styles.actionButtonText}>✗ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const TaskCard = ({ task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor(task.priority) }
        ]}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
      </View>
      <Text style={styles.taskDescription}>{task.description}</Text>
      <View style={styles.taskFooter}>
        <Text style={styles.taskDue}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return Colors.warning;
      case 'APPROVED': return Colors.success;
      case 'REJECTED': return Colors.error;
      default: return Colors.mutedForeground;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return Colors.error;
      case 'MEDIUM': return Colors.warning;
      case 'LOW': return Colors.success;
      default: return Colors.mutedForeground;
    }
  };

  const handleSubmissionAction = async (submissionId, action) => {
    try {
      const response = await fetch(`${API_ROUTES.STAFF.REVIEW_SUBMISSION}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId, action }),
      });

      if (response.ok) {
        Alert.alert('Success', `Submission ${action.toLowerCase()}d successfully`);
        fetchDashboardData(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to process submission');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={Styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading staff dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={Styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Staff Dashboard 📋</Text>
          <Text style={styles.subtitle}>Operations & Review Management</Text>
        </View>

        {/* Operational Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Pending Reviews"
            value={dashboardData.operationalStats.pendingReviews}
            icon="⏳"
            color={Colors.warning}
            onPress={() => Alert.alert('Pending', 'Navigate to review queue')}
          />
          <StatCard
            title="Approved Today"
            value={dashboardData.operationalStats.approvedToday}
            subtitle="Today"
            icon="✅"
            color={Colors.success}
          />
          <StatCard
            title="Total Submissions"
            value={dashboardData.operationalStats.totalSubmissions}
            icon="📊"
            color={Colors.primary}
          />
          <StatCard
            title="Avg Review Time"
            value={`${dashboardData.operationalStats.averageReviewTime}m`}
            subtitle="Minutes"
            icon="⏱️"
            color={Colors.accent}
          />
        </View>

        {/* System Health */}
        <View style={styles.healthContainer}>
          <Text style={styles.sectionTitle}>🏥 System Health</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Status</Text>
              <View style={styles.healthValue}>
                <Text style={[
                  styles.healthDot,
                  { color: dashboardData.systemHealth.status === 'healthy' ? Colors.success : Colors.error }
                ]}>●</Text>
                <Text style={styles.healthText}>
                  {dashboardData.systemHealth.status}
                </Text>
              </View>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Uptime</Text>
              <Text style={styles.healthText}>{dashboardData.systemHealth.uptime}</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Response Time</Text>
              <Text style={styles.healthText}>{dashboardData.systemHealth.responseTime}</Text>
            </View>
          </View>
        </View>

        {/* Staff Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📝 Staff Tasks</Text>
            <TouchableOpacity style={styles.sectionButton}>
              <Text style={styles.sectionButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.staffTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending tasks</Text>
              <Text style={styles.emptySubtext}>Great job! All tasks are complete</Text>
            </View>
          ) : (
            dashboardData.staffTasks.slice(0, 3).map((task, index) => (
              <TaskCard key={task.id || index} task={task} />
            ))
          )}
        </View>

        {/* Recent Submissions for Review */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Recent Submissions</Text>
            <TouchableOpacity style={styles.sectionButton}>
              <Text style={styles.sectionButtonText}>Review Queue</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.recentSubmissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending submissions</Text>
              <Text style={styles.emptySubtext}>
                New submissions will appear here for review
              </Text>
            </View>
          ) : (
            dashboardData.recentSubmissions.slice(0, 3).map((submission, index) => (
              <SubmissionCard key={submission.id || index} submission={submission} />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Export Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📢</Text>
              <Text style={styles.quickActionText}>Send Announcement</Text>
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

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },

  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  statIcon: {
    fontSize: FontSizes.xl,
    marginRight: Spacing.sm,
  },

  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
  },

  statTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },

  statSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  healthContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  healthCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  healthLabel: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
  },

  healthValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  healthDot: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.xs,
  },

  healthText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  sectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  sectionButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  submissionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  submissionInfo: {
    flex: 1,
  },

  submissionStudent: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },

  submissionActivity: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  submissionMeta: {
    alignItems: 'flex-end',
  },

  submissionTime: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },

  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    fontSize: FontSizes.xs,
    color: Colors.card,
    fontWeight: '600',
  },

  submissionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actionButton: {
    flex: 0.48,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },

  approveButton: {
    backgroundColor: Colors.success,
  },

  rejectButton: {
    backgroundColor: Colors.error,
  },

  actionButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.card,
    fontWeight: '600',
  },

  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  taskTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    flex: 1,
    marginRight: Spacing.sm,
  },

  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  priorityText: {
    fontSize: FontSizes.xs,
    color: Colors.card,
    fontWeight: '600',
  },

  taskDescription: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.md,
  },

  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  taskDue: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  completeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },

  completeButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  actionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  quickActionButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    flex: 0.48,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  quickActionIcon: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.sm,
  },

  quickActionText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    textAlign: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  emptyText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.mutedForeground,
    marginBottom: Spacing.sm,
  },

  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },

  footerSpace: {
    height: Spacing.xl,
  },
};

export default StaffDashboard;
