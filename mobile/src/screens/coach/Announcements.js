import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const Announcements = ({ navigation }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Announcement form state
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });

  // Fetch team data to get team ID (same as web version)
  const fetchTeamData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('🏆 Fetching user data to get coached teams...');
      
      // Get current user info with coached teams
      const userRes = await fetchWithTimeout(API_ROUTES.AUTH.ME, { headers }, 15000);
      
      if (!userRes.ok) {
        const errorText = await userRes.text();
        throw new Error(`Failed to fetch user data: ${userRes.status} - ${errorText}`);
      }
      
      const userData = await userRes.json();
      
      // Check if user has coached teams
      if (!userData.user.coachedTeams || userData.user.coachedTeams.length === 0) {
        setError('You are not assigned as a coach to any team. Please contact an administrator.');
        return null;
      }

      // Get the first coached team
      const coachedTeam = userData.user.coachedTeams[0];
      
      // Fetch detailed team data from leaderboard
      console.log('📊 Fetching leaderboard data for team details...');
      const leaderboardRes = await fetchWithTimeout(API_ROUTES.LEADERBOARD.LIST, {}, 15000);
      
      if (!leaderboardRes.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const leaderboardData = await leaderboardRes.json();
      const currentTeam = leaderboardData.find(team => team.id === coachedTeam.id);
      
      if (!currentTeam) {
        setError('Team not found in leaderboard');
        return null;
      }
      
      setTeamData(currentTeam);
      return currentTeam;
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError(`Network error loading team data: ${error.message}`);
      return null;
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async (teamId) => {
    if (!teamId) return;

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('📢 Fetching team announcements for team:', teamId);
      const response = await fetchWithTimeout(
        API_ROUTES.announcements.forTeam(teamId), 
        { headers }, 
        15000
      );
      
      if (response.ok) {
        const announcementsData = await response.json();
        setAnnouncements(announcementsData || []);
      } else {
        setError('Failed to load announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Network error loading announcements');
    }
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    const team = await fetchTeamData();
    if (team && team.id) {
      await fetchAnnouncements(team.id);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setNewAnnouncement(prev => ({ ...prev, [field]: value }));
  };

  // Clear messages after delay
  const clearMessages = () => {
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  // Create announcement
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setError('Please fill in both title and content');
      clearMessages();
      return;
    }

    if (!teamData || !teamData.id) {
      setError('Team data not available');
      clearMessages();
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('📢 Creating announcement for team:', teamData.id);
      const response = await fetchWithTimeout(
        API_ROUTES.announcements.create(teamData.id),
        {
          method: 'POST',
          headers,
          body: JSON.stringify(newAnnouncement),
        },
        15000
      );

      if (response.ok) {
        const announcement = await response.json();
        setAnnouncements(prev => [announcement, ...prev]);
        setNewAnnouncement({ title: '', content: '' });
        setShowAnnouncementForm(false);
        setSuccess('Announcement created successfully!');
        clearMessages();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create announcement');
        clearMessages();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Network error creating announcement');
      clearMessages();
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!teamData || !teamData.id) {
      setError('Team data not available');
      clearMessages();
      return;
    }

    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              };

              console.log('🗑️ Deleting announcement:', announcementId);
              
              // Optimistically remove from UI
              setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
              
              const response = await fetchWithTimeout(
                API_ROUTES.announcements.delete(teamData.id, announcementId),
                {
                  method: 'DELETE',
                  headers,
                },
                15000
              );

              if (response.ok) {
                setSuccess('Announcement deleted successfully!');
                clearMessages();
              } else {
                // Restore announcement on error
                await fetchAnnouncements(teamData.id);
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete announcement');
                clearMessages();
              }
            } catch (error) {
              console.error('Error deleting announcement:', error);
              // Restore announcements on error
              await fetchAnnouncements(teamData.id);
              setError('Network error deleting announcement');
              clearMessages();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
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
          <Text style={styles.title}>Announcements 📢</Text>
          <TouchableOpacity 
            style={styles.newAnnouncementButton} 
            onPress={() => setShowAnnouncementForm(true)}
          >
            <Text style={styles.newAnnouncementButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* Team Info */}
        {teamData && (
          <View style={styles.teamInfoSection}>
            <Text style={styles.teamInfoTitle}>Managing announcements for:</Text>
            <Text style={styles.teamName}>{teamData.name}</Text>
          </View>
        )}

        {/* Announcements List */}
        <View style={styles.announcementsSection}>
          <Text style={styles.sectionTitle}>Team Announcements ({announcements.length})</Text>
          {announcements.length > 0 ? (
            <View style={styles.announcementsContainer}>
              {announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.announcementContent}>{announcement.content}</Text>
                  <Text style={styles.announcementMeta}>
                    By {announcement.createdBy?.name || 'Coach'} • {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Announcements Yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first announcement to communicate with your team.
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Create Announcement Modal */}
      <Modal
        visible={showAnnouncementForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowAnnouncementForm(false);
                setNewAnnouncement({ title: '', content: '' });
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error display in modal */}
          {error ? (
            <View style={styles.modalErrorContainer}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.modalContent}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={[styles.textInput, !newAnnouncement.title.trim() && styles.required]}
                value={newAnnouncement.title}
                onChangeText={(value) => handleFormChange('title', value)}
                placeholder="Announcement title..."
                maxLength={100}
              />
            </View>

            {/* Content Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Content *</Text>
              <TextInput
                style={[
                  styles.textArea, 
                  !newAnnouncement.content.trim() && styles.required
                ]}
                value={newAnnouncement.content}
                onChangeText={(value) => handleFormChange('content', value)}
                placeholder="Announcement content..."
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {newAnnouncement.content.length}/500 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleCreateAnnouncement}
              disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
            >
              <Text style={styles.submitButtonText}>Post Announcement</Text>
            </TouchableOpacity>
          </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  newAnnouncementButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  newAnnouncementButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },

  // Messages
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  successText: {
    color: '#065F46',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },

  // Team Info Section
  teamInfoSection: {
    backgroundColor: Colors.primary + '15',
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  teamInfoTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  teamName: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  // Announcements Section
  announcementsSection: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    ...Styles.shadow,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  announcementsContainer: {
    marginTop: Spacing.md,
  },
  announcementCard: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  announcementTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: '#1E40AF',
    flex: 1,
    marginRight: Spacing.sm,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  announcementContent: {
    fontSize: FontSizes.sm,
    color: '#1E3A8A',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  announcementMeta: {
    fontSize: FontSizes.xs,
    color: '#3B82F6',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.surface,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalErrorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },

  // Form Elements
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    minHeight: 120,
  },
  required: {
    borderColor: Colors.error,
  },
  characterCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },

  footerSpace: {
    height: 50,
  },
};

export default Announcements;
