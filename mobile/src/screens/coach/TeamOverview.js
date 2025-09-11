import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';

const TeamOverview = ({ navigation }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [error, setError] = useState('');

  const fetchTeamData = async () => {
    try {
      setError('');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('🎯 Fetching team data from:', API_ROUTES.coach.students);
      const response = await fetchWithTimeout(API_ROUTES.coach.students, { headers }, 15000);
      
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData || []);
        
        // Calculate comprehensive team stats
        const stats = {
          totalStudents: studentsData.length,
          totalPoints: studentsData.reduce((sum, student) => sum + (student.points || 0), 0),
          activeStudents: studentsData.filter(s => s.lastActive).length,
          averagePoints: studentsData.length > 0 ? 
            Math.round(studentsData.reduce((sum, student) => sum + (student.points || 0), 0) / studentsData.length) : 0,
          completedActivities: studentsData.reduce((sum, student) => sum + (student.completedActivities || 0), 0),
          topPerformer: studentsData.reduce((top, student) => 
            (student.points || 0) > (top.points || 0) ? student : top, {}),
          recentActivity: studentsData.filter(s => s.recentSubmission).length
        };
        setTeamStats(stats);
      } else {
        setError('Failed to load team data');
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Network error occurred');
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
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading team overview...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Team Overview</Text>
      </View>

      {/* Error Display */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Team Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teamStats.totalStudents || 0}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teamStats.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teamStats.activeStudents || 0}</Text>
            <Text style={styles.statLabel}>Active Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teamStats.averagePoints || 0}</Text>
            <Text style={styles.statLabel}>Avg. Points</Text>
          </View>
        </View>
      </View>

      {/* Student List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members ({students.length})</Text>
        {students.length > 0 ? (
          <View style={styles.studentsList}>
            {students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {student.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                  <Text style={styles.studentPoints}>{student.points || 0} points</Text>
                </View>
                <View style={styles.studentActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No team members found</Text>
            <Text style={styles.emptySubtext}>Students will appear here when they join your team</Text>
          </View>
        )}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
  },
  errorContainer: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.md,
    backgroundColor: Colors.destructive,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  studentsList: {
    gap: Spacing.md,
  },
  studentCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  studentPoints: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  studentActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  footer: {
    height: Spacing.xl,
  },
};

export default TeamOverview;
