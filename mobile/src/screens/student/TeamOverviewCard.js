import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const TeamOverviewCard = ({ team, stats }) => {
  if (!team || !stats) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="people-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No team data available</Text>
      </View>
    );
  }

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
      case 1: return '#FFD700';
      case 2: return '#C0C0C0'; 
      case 3: return '#CD7F32';
      default: return '#0891b2';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0891b2', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.teamIconContainer}>
            <LinearGradient
              colors={['#f59e0b', '#eab308']}
              style={styles.teamIcon}
            >
              <Ionicons name="people" size={24} color="white" />
            </LinearGradient>
          </View>
          
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <View style={styles.teamMetaRow}>
              <View style={styles.teamMeta}>
                <Ionicons name="key-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{team.teamCode}</Text>
              </View>
              {team.coach && (
                <View style={styles.teamMeta}>
                  <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{team.coach.name}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Main Points Display */}
          <View style={styles.mainStat}>
            <Text style={styles.pointsValue}>{stats.totalPoints || 0}</Text>
            <Text style={styles.pointsLabel}>Total Points</Text>
          </View>

          {/* Secondary Stats */}
          <View style={styles.secondaryStats}>
            <View style={styles.statItem}>
              <View style={[styles.rankBadge, { backgroundColor: getRankColor(stats.rank || 0) }]}>
                <Ionicons name={getRankIcon(stats.rank || 0)} size={16} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>#{stats.rank || 0}</Text>
                <Text style={styles.statLabel}>Team Rank</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.membersBadge}>
                <Ionicons name="people-outline" size={16} color="#0891b2" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{team.members?.length || 0}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Team Progress</Text>
            <Text style={styles.progressPercentage}>
              {stats.rank ? Math.max(0, Math.round(((stats.totalTeams - stats.rank + 1) / stats.totalTeams) * 100)) : 0}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${stats.rank ? Math.max(0, Math.round(((stats.totalTeams - stats.rank + 1) / stats.totalTeams) * 100)) : 0}%` 
                }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = {
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  
  gradientBackground: {
    padding: 20,
    minHeight: 180,
  },

  // Empty State
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    fontWeight: '500',
  },

  // Header Section
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamIconContainer: {
    marginRight: 12,
  },
  teamIcon: {
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
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  teamMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
    fontWeight: '500',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Secondary Stats
  secondaryStats: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  membersBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // Progress Section
  progressSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
};

export default TeamOverviewCard;
