import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const TeamOverviewCard = ({ team, stats }) => {
  const [fontLoaded, setFontLoaded] = useState(false);

  
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'BitcountGridDouble': require('../../../assets/fonts/BitcountGridDouble-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf'),
        });
        setFontLoaded(true);
      } catch (error) {
        
      }
    }
    loadFonts();
  }, []);

  if (!team || !stats) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="people-outline" size={48} color="#000000" />
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
      case 1: return '#000000';
      case 2: return '#000000'; 
      case 3: return '#000000';
      default: return '#000000';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#ffffff', '#ffffff']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.teamIconContainer}>
            <LinearGradient
              colors={['#ffffff', '#000000']}
              style={styles.teamIcon}
            >
              <Ionicons name="basketball" size={24} color="#ffffff" />
            </LinearGradient>
          </View>
          
          <View style={styles.teamInfo}>
            <Text style={[
              styles.teamName,
              fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
            ]}>
              {team.name}
            </Text>
            <View style={styles.teamMetaRow}>
              <View style={styles.teamMeta}>
                <Ionicons name="key-outline" size={14} color="#000000" />
                <Text style={styles.metaText}>{team.teamCode}</Text>
              </View>
              {team.coach && (
                <View style={styles.teamMeta}>
                  <Ionicons name="person-outline" size={14} color="#000000" />
                  <Text style={styles.metaText}>{team.coach.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Main Points Display */}
          <View style={styles.mainStat}>
            <Text style={[
              styles.pointsValue,
              fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
            ]}>
              {stats.totalPoints || 0}
            </Text>
            <Text style={[
              styles.pointsLabel,
              fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
            ]}>
              Total Points
            </Text>
            <Text style={[
              styles.raisedAmount,
              fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
            ]}>
              ${stats.totalRaised?.toFixed(2) || '0.00'}
            </Text>
            <Text style={[
              styles.raisedLabel,
              fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
            ]}>
              Total Raised
            </Text>
          </View>

          {/* Secondary Stats */}
          <View style={styles.secondaryStats}>
            <View style={styles.statItem}>
              <View style={[styles.rankBadge, { backgroundColor: getRankColor(stats.rank || 0) }]}>
                <Ionicons name={getRankIcon(stats.rank || 0)} size={16} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={[
                  styles.statValue,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  #{stats.rank || 0}
                </Text>
                <Text style={[
                  styles.statLabel,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  Team Rank
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.membersBadge}>
                <Ionicons name="people-outline" size={16} color="white" />
              </View>
              <View style={styles.statContent}>
                <Text style={[
                  styles.statValue,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  {team.members?.length || 0}
                </Text>
                <Text style={[
                  styles.statLabel,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  Members
                </Text>
              </View>
            </View>
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
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    marginBottom: 4, 
  },
  
  gradientBackground: {
    padding: 20,
    minHeight: 180,
  },

  
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 8,
    fontWeight: '500',
  },

  
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
    color: '#000000',
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
    color: '#000000',
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
    color: '#000000',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  raisedAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  raisedLabel: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  
  secondaryStats: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    backgroundColor: '#000000',
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
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '500',
  },

  
  progressSection: {
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    color: 'rgba(0,0,0,0.8)',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 12,
    color: 'black',
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
};

export default TeamOverviewCard;
