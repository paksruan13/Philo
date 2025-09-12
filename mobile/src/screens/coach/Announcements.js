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
            <Ionicons name="chevron-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="megaphone" size={28} color="#ffffff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Team Announcements</Text>
              <Text style={styles.subtitle}>
                {teamData ? `${teamData.name} • ${announcements.length} posts` : 'Loading team...'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => setShowAnnouncementForm(true)}
          >
            <Ionicons name="add-circle" size={32} color="#8b5cf6" />
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

        {/* Team Info Card */}
        {teamData && (
          <View style={styles.teamCard}>
            <View style={styles.teamCardHeader}>
              <View style={styles.teamIconContainer}>
                <Ionicons name="people" size={20} color="#6366f1" />
              </View>
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{teamData.name}</Text>
                <View style={styles.teamStats}>
                  <View style={styles.teamStat}>
                    <Ionicons name="person" size={14} color="#6b7280" />
                    <Text style={styles.teamStatText}>{teamData.memberCount || 0} members</Text>
                  </View>
                  <View style={styles.teamStat}>
                    <Ionicons name="trophy" size={14} color="#6b7280" />
                    <Text style={styles.teamStatText}>{teamData.totalScore || 0} points</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Announcements List */}
        <View style={styles.announcementsSection}>
          {announcements.length > 0 ? (
            <View style={styles.announcementsContainer}>
              {announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <View style={styles.announcementIconContainer}>
                      <Ionicons name="megaphone" size={16} color="#8b5cf6" />
                    </View>
                    <View style={styles.announcementTitleContainer}>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <View style={styles.announcementMeta}>
                        <Ionicons name="person-circle" size={14} color="#6b7280" />
                        <Text style={styles.announcementAuthor}>
                          {announcement.createdBy?.name || 'Coach'}
                        </Text>
                        <View style={styles.metaDivider} />
                        <Ionicons name="time" size={14} color="#6b7280" />
                        <Text style={styles.announcementDate}>
                          {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.announcementContent}>{announcement.content}</Text>
                  <View style={styles.announcementFooter}>
                    <View style={styles.announcementActions}>
                      <View style={styles.actionButton}>
                        <Ionicons name="eye" size={14} color="#6b7280" />
                        <Text style={styles.actionText}>Visible to team</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="megaphone-outline" size={64} color="#e5e7eb" />
              </View>
              <Text style={styles.emptyTitle}>No Announcements Yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first team announcement to keep everyone updated
              </Text>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => setShowAnnouncementForm(true)}
              >
                <Ionicons name="add-circle" size={20} color="#ffffff" />
                <Text style={styles.emptyActionText}>Create First Post</Text>
              </TouchableOpacity>
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
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => {
                setShowAnnouncementForm(false);
                setNewAnnouncement({ title: '', content: '' });
              }}
            >
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="create" size={24} color="#ffffff" />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>New Announcement</Text>
                <Text style={styles.modalSubtitle}>Share updates with your team</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Ionicons name="text" size={16} color="#374151" />
                <Text style={styles.formLabel}>Title</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
              <TextInput
                style={[styles.textInput, !newAnnouncement.title.trim() && styles.inputError]}
                value={newAnnouncement.title}
                onChangeText={(value) => handleFormChange('title', value)}
                placeholder="Enter announcement title..."
                maxLength={100}
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.characterCount}>{newAnnouncement.title.length}/100</Text>
            </View>

            {/* Content Input */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Ionicons name="document-text" size={16} color="#374151" />
                <Text style={styles.formLabel}>Message</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
              <TextInput
                style={[
                  styles.textArea, 
                  !newAnnouncement.content.trim() && styles.inputError
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
              <Text style={styles.characterCount}>{newAnnouncement.content.length}/500</Text>
            </View>

            {/* Preview Card */}
            {(newAnnouncement.title.trim() || newAnnouncement.content.trim()) && (
              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Ionicons name="eye" size={16} color="#6b7280" />
                  <Text style={styles.previewTitle}>Preview</Text>
                </View>
                <View style={styles.previewCard}>
                  <View style={styles.previewCardHeader}>
                    <Ionicons name="megaphone" size={14} color="#8b5cf6" />
                    <Text style={styles.previewCardTitle}>
                      {newAnnouncement.title.trim() || 'Announcement Title'}
                    </Text>
                  </View>
                  <Text style={styles.previewCardContent}>
                    {newAnnouncement.content.trim() || 'Your message will appear here...'}
                  </Text>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleCreateAnnouncement}
              disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
            >
              <Ionicons name="paper-plane" size={18} color="#ffffff" />
              <Text style={styles.submitButtonText}>Publish Announcement</Text>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    fontWeight: '500',
  },
  createButton: {
    marginLeft: Spacing.md,
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

  // Team Info Card
  teamCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  teamStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  teamStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  teamStatText: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    fontWeight: '500',
  },

  // Announcements Section
  announcementsSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  announcementsContainer: {
    gap: Spacing.lg,
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  announcementIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  announcementTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  announcementTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  announcementAuthor: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    fontWeight: '600',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  announcementDate: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    fontWeight: '500',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  announcementContent: {
    fontSize: FontSizes.base,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginBottom: Spacing.md,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.md,
  },
  announcementActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#f8fafc',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionText: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: FontSizes.base,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: FontSizes.base,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalBackButton: {
    marginRight: Spacing.md,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  // Form Elements
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  requiredIndicator: {
    fontSize: FontSizes.sm,
    color: '#ef4444',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    minHeight: 120,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  characterCount: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  
  // Preview Section
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  previewTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#374151',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  previewCardTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1e293b',
  },
  previewCardContent: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    lineHeight: 20,
  },
  
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#8b5cf6',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    marginTop: Spacing.lg,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: FontSizes.base,
    fontWeight: '700',
  },

  footerSpace: {
    height: 50,
  },
};

export default Announcements;
