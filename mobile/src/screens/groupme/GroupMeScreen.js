import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const GroupMeScreen = () => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(API_ROUTES.teams.myTeam, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }

      const data = await response.json();
      setTeamData(data);
      setError('');
    } catch (err) {
      setError('Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGroupMe = () => {
    const groupMeLink = teamData?.team?.groupMeLink;
    
    if (!groupMeLink) {
      Alert.alert(
        'No GroupMe Link', 
        'Your team doesn\'t have a GroupMe link set up yet. Please contact your coach to add one.',
        [{ text: 'OK' }]
      );
      return;
    }

    Linking.canOpenURL(groupMeLink).then(supported => {
      if (supported) {
        Linking.openURL(groupMeLink);
      } else {
        Linking.openURL(groupMeLink);
      }
    }).catch(err => {
      Alert.alert('Error', 'Could not open GroupMe link. Please try again later.');
    });
  };

  if (loading) {
    return (
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Loading team information...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient 
        colors={['#ffffff', '#f8fafc']} 
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTeamData}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const teamName = teamData?.team?.name || 'Your Team';
  const groupMeLink = teamData?.team?.groupMeLink;

  return (
    <LinearGradient 
      colors={['#ffffff', '#f8fafc']} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#8b5cf6', '#e11d48']}
            style={styles.headerIcon}
          >
            <Ionicons name="chatbubbles" size={24} color="white" />
          </LinearGradient>
          <Text style={styles.title}>Team Chat</Text>
          <Text style={styles.subtitle}>Connect with SigEp x {teamName}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color="#8b5cf6" />
              <Text style={styles.cardTitle}>GroupMe Chat</Text>
            </View>

            {groupMeLink ? (
              <View style={styles.linkInfo}>
                <View style={styles.statusIndicator}>
                  <View style={styles.activeStatus} />
                  <Text style={styles.statusText}>Chat Available</Text>
                </View>
              </View>
            ) : (
              <View style={styles.linkInfo}>
                <View style={styles.statusIndicator}>
                  <View style={styles.inactiveStatus} />
                  <Text style={styles.statusText}>No Chat Link Set</Text>
                </View>
                <Text style={styles.noLinkText}>
                  Contact your coach to set up the team GroupMe chat.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.openButton, !groupMeLink && styles.disabledButton]}
            onPress={handleOpenGroupMe}
            activeOpacity={0.9}
            disabled={!groupMeLink}
          >
            <LinearGradient
              colors={groupMeLink ? ['#8b5cf6', '#e11d48'] : ['#9CA3AF', '#6B7280']}
              style={styles.buttonGradient}
            >
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text style={styles.buttonText}>
                {groupMeLink ? 'Open Team Chat' : 'Chat Unavailable'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: FontSizes.base,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 24,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.foreground,
    marginLeft: 8,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
    marginBottom: 16,
  },
  linkInfo: {
    marginTop: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  inactiveStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  noLinkText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
  },
  openButton: {
    width: '100%',
    marginBottom: 24,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    ...Shadows.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: FontSizes.base,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuresList: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: 20,
    ...Shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },
});

export default GroupMeScreen;