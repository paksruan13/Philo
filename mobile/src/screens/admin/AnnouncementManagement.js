import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const AnnouncementManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(API_ROUTES.announcements.global);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(Array.isArray(data) ? data : data.announcements || []);
      } else {
        setError('Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(API_ROUTES.announcements.createGlobal, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (response.ok) {
        const createdAnnouncement = await response.json();
        setAnnouncements(prev => [createdAnnouncement, ...prev]);
        setNewAnnouncement({ title: '', content: '' });
        setShowCreateForm(false);
        setSuccess('Announcement created successfully!');
        setTimeout(() => setSuccess(''), 3000);
        Alert.alert('Success', 'Global announcement created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this global announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(API_ROUTES.announcements.deleteGlobal(announcementId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
                setSuccess('Announcement deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
                Alert.alert('Success', 'Announcement deleted successfully');
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete announcement');
              }
            } catch (error) {
              console.error('Error deleting announcement:', error);
              setError('Failed to delete announcement');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const AnnouncementCard = ({ announcement }) => (
    <View style={styles.announcementCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            <View style={styles.globalBadge}>
              <Text style={styles.globalBadgeText}>Global</Text>
            </View>
          </View>
          <Text style={styles.announcementContent}>{announcement.content}</Text>
          <View style={styles.announcementMeta}>
            <Text style={styles.metaText}>
              🕐 {new Date(announcement.createdAt).toLocaleDateString()} {new Date(announcement.createdAt).toLocaleTimeString()}
            </Text>
            <Text style={styles.metaText}>
              👤 {announcement.createdBy?.name} ({announcement.createdBy?.role})
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAnnouncement(announcement.id)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
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
            style={styles.addButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Text style={styles.addButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* Success/Error Messages */}
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{announcements.length}</Text>
            <Text style={styles.statLabel}>Total Announcements</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {announcements.filter(a => 
                new Date(a.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {announcements.filter(a => 
                new Date(a.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Announcements List */}
        {announcements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Global Announcements</Text>
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No Global Announcements</Text>
            <Text style={styles.emptySubText}>Create the first global announcement to get started.</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={styles.createButtonText}>Create Announcement</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Create Announcement Modal */}
      {showCreateForm && (
        <CreateAnnouncementModal
          newAnnouncement={newAnnouncement}
          setNewAnnouncement={setNewAnnouncement}
          onClose={() => {
            setShowCreateForm(false);
            setNewAnnouncement({ title: '', content: '' });
          }}
          onSave={createAnnouncement}
          submitting={submitting}
        />
      )}
    </SafeAreaView>
  );
};

const CreateAnnouncementModal = ({ newAnnouncement, setNewAnnouncement, onClose, onSave, submitting }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Global Announcement</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Title */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={newAnnouncement.title}
                onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, title: text }))}
                placeholder="Enter announcement title"
                placeholderTextColor={Colors.mutedForeground}
              />
            </View>

            {/* Content */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Content</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newAnnouncement.content}
                onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, content: text }))}
                placeholder="Enter announcement content"
                placeholderTextColor={Colors.mutedForeground}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, (!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || submitting) && styles.disabledButton]}
              onPress={onSave}
              disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || submitting}
            >
              <Text style={styles.actionButtonText}>
                {submitting ? 'Creating...' : 'Create Announcement'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  },

  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  scrollContainer: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },

  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  backButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  title: {
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: Colors.foreground,
    textAlign: 'center',
  },

  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  addButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  successContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  successText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  errorContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginTop: 4,
  },

  section: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },

  announcementCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  cardTitleContainer: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },

  announcementTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginRight: Spacing.sm,
    flex: 1,
  },

  globalBadge: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },

  globalBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
  },

  announcementContent: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    lineHeight: FontSizes.base * 1.5,
    marginBottom: Spacing.md,
  },

  announcementMeta: {
    gap: 4,
  },

  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },

  deleteButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    marginHorizontal: Spacing.lg,
  },

  emptyIcon: {
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },

  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  emptySubText: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },

  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  createButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },

  footerSpace: {
    height: Spacing.xl,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxHeight: '80%',
    ...Shadows.modal,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  closeButton: {
    padding: Spacing.sm,
  },

  closeButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  modalBody: {
    padding: Spacing.lg,
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: 4,
  },

  textInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.foreground,
  },

  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },

  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-between',
  },

  cancelButton: {
    backgroundColor: Colors.mutedForeground,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },

  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginLeft: Spacing.sm,
  },

  disabledButton: {
    opacity: 0.5,
  },

  cancelButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  actionButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },
};

export default AnnouncementManagement;
