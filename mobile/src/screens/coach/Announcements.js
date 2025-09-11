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
import { Ionicons } from '@expo/vector-icons';
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
            <Ionicons name="chevron-back" size={20} color="#6366f1" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>📢 Announcements</Text>
            <Text style={styles.subtitle}>Team communication</Text>
          </View>
          <TouchableOpacity 
            style={styles.newAnnouncementButton} 
            onPress={() => setShowAnnouncementForm(true)}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.newAnnouncementButtonText}>Create</Text>
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
            <View style={styles.teamInfoHeader}>
              <Ionicons name="people" size={16} color="#6366f1" />
              <Text style={styles.teamInfoTitle}>Sent to: {teamData.name}</Text>
            </View>
          </View>
        )}

        {/* Announcements List */}
        <View style={styles.announcementsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="megaphone" size={18} color="#8b5cf6" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>📺 Recent Updates</Text>
              <Text style={styles.sectionSubtitle}>{announcements.length} announcements</Text>
            </View>
          </View>
          {announcements.length > 0 ? (
            <View style={styles.announcementsContainer}>
              {announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <View style={styles.announcementTitleContainer}>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <Text style={styles.announcementMeta}>
                        {announcement.createdBy?.name || 'Coach'} • {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Ionicons name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.announcementContent}>{announcement.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No Announcements</Text>
              <Text style={styles.emptySubtext}>
                Create your first team announcement
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
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="megaphone" size={22} color="#8b5cf6" />
              </View>
              <View>
                <Text style={styles.modalTitle}>📢 New Announcement</Text>
                <Text style={styles.modalSubtitle}>Share team updates</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowAnnouncementForm(false);
                setNewAnnouncement({ title: '', content: '' });
              }}
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>📝 Title *</Text>
              <TextInput
                style={[styles.textInput, !newAnnouncement.title.trim() && styles.required]}
                value={newAnnouncement.title}
                onChangeText={(value) => handleFormChange('title', value)}
                placeholder="Enter announcement title..."
                maxLength={100}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Content Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>💬 Message *</Text>
              <TextInput
                style={[
                  styles.textArea, 
                  !newAnnouncement.content.trim() && styles.required
                ]}
                value={newAnnouncement.content}
                onChangeText={(value) => handleFormChange('content', value)}
                placeholder="Write your message here..."
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
                placeholderTextColor="#9ca3af"
              />
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
              <Ionicons name="send" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>Publish</Text>
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
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  backButtonText: {
    fontSize: FontSizes.sm,
    color: '#6366f1',
    fontWeight: '600',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    fontWeight: '500',
  },
  newAnnouncementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newAnnouncementButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },

  // Messages
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  errorText: {
    color: '#dc2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  successText: {
    color: '#059669',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },

  // Team Info Section
  teamInfoSection: {
    backgroundColor: '#f0f9ff',
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  teamInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  teamInfoTitle: {
    fontSize: FontSizes.sm,
    color: '#6366f1',
    fontWeight: '600',
  },

  // Announcements Section
  announcementsSection: {
    backgroundColor: '#ffffff',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '500',
  },
  announcementsContainer: {
    marginTop: Spacing.md,
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  announcementTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  announcementTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  announcementMeta: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementContent: {
    fontSize: FontSizes.sm,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f3e8ff',
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
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  // Form Elements
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    minHeight: 120,
  },
  required: {
    borderColor: '#ef4444',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#8b5cf6',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    marginTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  footerSpace: {
    height: 50,
  },
};

export default Announcements;
