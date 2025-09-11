import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnnouncementsCard = ({ teamId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, [teamId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both global and team announcements
      const [globalResponse, teamResponse] = await Promise.all([
        fetchWithTimeout(API_ROUTES.announcements.global, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        teamId ? fetchWithTimeout(API_ROUTES.announcements.forTeam(teamId), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }) : Promise.resolve({ ok: true, json: () => [] })
      ]);

      const globalData = globalResponse.ok ? await globalResponse.json() : [];
      const teamData = teamResponse.ok ? await teamResponse.json() : [];
      
      // Combine and sort announcements by creation date
      const allAnnouncements = [...globalData, ...teamData].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAnnouncements(allAnnouncements.slice(0, 5)); // Show latest 5
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getAnnouncementType = (announcement) => {
    if (announcement.isGlobal) return 'Admin';
    return 'Coach';
  };

  const getTypeColor = (announcement) => {
    if (announcement.isGlobal) return '#e11d48'; // Vibrant pink-red for admin
    return '#059669'; // Vibrant emerald for coach
  };

  const handleAnnouncementPress = (announcement) => {
    setSelectedAnnouncement(announcement);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedAnnouncement(null);
  };

  const renderAnnouncement = (announcement, index) => (
    <TouchableOpacity 
      key={announcement.id} 
      style={[styles.announcementItem, index === 0 && styles.firstItem]}
      onPress={() => handleAnnouncementPress(announcement)}
      activeOpacity={0.7}
    >
      <View style={styles.announcementHeader}>
        <View style={styles.typeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(announcement) }]}>
            <Ionicons 
              name={announcement.isGlobal ? 'shield-checkmark' : 'person'} 
              size={12} 
              color="white" 
            />
          </View>
          <Text style={[styles.typeText, { color: getTypeColor(announcement) }]}>
            {getAnnouncementType(announcement)}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(announcement.createdAt)}</Text>
      </View>
      
      <View style={styles.announcementContent}>
        <Text style={styles.announcementTitle} numberOfLines={2}>
          {announcement.title}
        </Text>
        
        {announcement.content && (
          <Text style={styles.announcementMessage} numberOfLines={3}>
            {announcement.content}
          </Text>
        )}
        
        <View style={styles.tapIndicator}>
          <Text style={styles.tapText}>Tap to view details</Text>
          <Ionicons name="chevron-forward" size={12} color="#6366f1" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#7c3aed', '#5b21b6']}
              style={styles.icon}
            >
              <Ionicons name="megaphone" size={20} color="white" />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>Announcements</Text>
              <Text style={styles.subtitle}>Loading...</Text>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7c3aed" />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#7c3aed', '#5b21b6']}
              style={styles.icon}
            >
              <Ionicons name="megaphone" size={20} color="white" />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>Announcements</Text>
              <Text style={styles.subtitle}>Error loading</Text>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAnnouncements} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            style={styles.icon}
          >
            <Ionicons name="megaphone" size={20} color="white" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>Announcements</Text>
            <Text style={styles.subtitle}>
              {announcements.length === 0 ? 'No announcements' : `${announcements.length} recent`}
            </Text>
          </View>
          {announcements.length > 0 && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}
        </View>

        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={32} color={Colors.mutedForeground} />
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>Check back later for updates from your coach and admin</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.announcementsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {announcements.map(renderAnnouncement)}
          </ScrollView>
        )}
      </View>

      {/* Announcement Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAnnouncement && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTypeContainer}>
                    <View style={[styles.modalTypeBadge, { backgroundColor: getTypeColor(selectedAnnouncement) }]}>
                      <Ionicons 
                        name={selectedAnnouncement.isGlobal ? 'shield-checkmark' : 'person'} 
                        size={16} 
                        color="white" 
                      />
                    </View>
                    <Text style={[styles.modalTypeText, { color: getTypeColor(selectedAnnouncement) }]}>
                      {getAnnouncementType(selectedAnnouncement)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Modal Body */}
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>
                    {selectedAnnouncement.title}
                  </Text>
                  
                  <Text style={styles.modalDate}>
                    {formatDate(selectedAnnouncement.createdAt)}
                  </Text>
                  
                  {selectedAnnouncement.content && (
                    <View style={styles.modalMessageContainer}>
                      <Text style={styles.modalMessage}>
                        {selectedAnnouncement.content}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#f59e0b',
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: 'white',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.mutedForeground,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  announcementsList: {
    maxHeight: 300,
  },
  announcementItem: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginVertical: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  firstItem: {
    borderTopWidth: 0,
    paddingTop: Spacing.md,
  },
  announcementContent: {
    flex: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  announcementTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  announcementMessage: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  tapText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    marginRight: 4,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    width: '95%',
    maxWidth: screenWidth - 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTypeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  modalTypeText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    flex: 1,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
    lineHeight: 28,
  },
  modalDate: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.lg,
  },
  modalMessageContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    minHeight: 120,
  },
  modalMessage: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    lineHeight: 26,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCloseButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
});

export default AnnouncementsCard;
