import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Dimensions, Animated, Easing } from 'react-native';
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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getAnnouncementType = (announcement) => {
    if (announcement.isGlobal) return 'Admin';
    return 'Coach';
  };

  const getTypeColor = (announcement) => {
    if (announcement.isGlobal) return '#000000'; // Black for admin
    return '#000000'; // Black for coach
  };

  const getTypeBgColor = (announcement) => {
    if (announcement.isGlobal) return 'rgba(220, 38, 38, 0.1)'; // Light red background
    return 'rgba(5, 150, 105, 0.1)'; // Light emerald background
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
      style={[
        styles.announcementItem, 
        index === 0 && styles.firstItem,
        { backgroundColor: getTypeBgColor(announcement) }
      ]}
      onPress={() => handleAnnouncementPress(announcement)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)']}
        style={styles.announcementGradient}
      >
        <View style={styles.announcementHeader}>
          <View style={styles.typeContainer}>
            <LinearGradient
              colors={[getTypeColor(announcement), `${getTypeColor(announcement)}CC`]}
              style={styles.typeBadge}
            >
              <Ionicons 
                name={announcement.isGlobal ? 'shield-checkmark' : 'people'} 
                size={14} 
                color="white" 
              />
            </LinearGradient>
            <Text style={[styles.typeText, { color: getTypeColor(announcement) }]}>
              {getAnnouncementType(announcement)}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={12} color="#000000" />
            <Text style={styles.dateText}>{formatDate(announcement.createdAt)}</Text>
          </View>
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
            <Text style={styles.tapText}>Tap to read more</Text>
            <Ionicons name="arrow-forward-circle" size={16} color="#000000" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={['#ffffff', '#ffffff']}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#000000', '#000000']}
              style={styles.iconContainer}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="megaphone" size={24} color="white" />
              </View>
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                Announcements
              </Text>
              <Text style={styles.subtitle}>Loading updates...</Text>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Fetching announcements...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#ffffff', '#ffffff']}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#000000', '#000000']}
              style={styles.iconContainer}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="warning" size={24} color="white" />
              </View>
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                Announcements
              </Text>
              <Text style={styles.subtitle}>Connection error</Text>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#000000" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAnnouncements} style={styles.retryButton}>
              <LinearGradient
                colors={['#000000', '#000000']}
                style={styles.retryGradient}
              >
                <Ionicons name="refresh" size={16} color="white" />
                <Text style={styles.retryText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ffffff', '#ffffff']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#000000', '#000000']}
            style={styles.iconContainer}
          >
            <View style={styles.iconBackground}>
              <Ionicons name="megaphone" size={20} color="white" />
            </View>
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Announcements
            </Text>
            <Text style={styles.subtitle}>
              {announcements.length === 0 ? 'No recent updates' : `${announcements.length} recent updates`}
            </Text>
          </View>
          {announcements.length > 0 && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={18} color="#000000" />
            </TouchableOpacity>
          )}
        </View>

        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="megaphone-outline" size={48} color="#000000" />
            </LinearGradient>
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>Check back later for updates from your coach and admin</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.announcementsList}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#000000']}
                tintColor="#000000"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {announcements.map(renderAnnouncement)}
          </ScrollView>
        )}
      </View>

      {/* Professional Announcement Modal - Same Pattern as TeamMembersCard */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={styles.modalContent}>
            {selectedAnnouncement && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleSection}>
                    <Text style={styles.modalTitle}>{selectedAnnouncement.title}</Text>
                    <Text style={styles.modalSubtitle}>
                      {getAnnouncementType(selectedAnnouncement)} • {formatDate(selectedAnnouncement.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={closeModal}
                  >
                    <Ionicons name="close" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Modal Content - No Scroll */}
                <View style={styles.modalBodyContent}>
                  {/* Message Section */}
                  {selectedAnnouncement.content && (
                    <View style={styles.contentSection}>
                      <View style={styles.contentHeader}>
                        <View style={styles.contentIconContainer}>
                          <Ionicons name="document-text" size={16} color="#000000" />
                        </View>
                        <Text style={styles.contentLabel}>Message</Text>
                      </View>
                      
                      <View style={styles.contentCard}>
                        <Text style={styles.contentText}>
                          {selectedAnnouncement.content}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Details Section */}
                  <View style={styles.detailsSection}>
                    <View style={styles.contentHeader}>
                      <View style={styles.contentIconContainer}>
                        <Ionicons name="information-circle" size={16} color="#000000" />
                      </View>
                      <Text style={styles.contentLabel}>Details</Text>
                    </View>
                    
                    <View style={styles.detailsCard}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type</Text>
                        <Text style={styles.detailValue}>
                          {selectedAnnouncement.isGlobal ? 'Global Announcement' : 'Team Announcement'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailSeparator} />
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Posted</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(selectedAnnouncement.createdAt)} at {formatTime(selectedAnnouncement.createdAt)}
                        </Text>
                      </View>
                      
                      {selectedAnnouncement.author && (
                        <>
                          <View style={styles.detailSeparator} />
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Author</Text>
                            <Text style={styles.detailValue}>{selectedAnnouncement.author}</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Action Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity onPress={closeModal} style={styles.primaryButton}>
                    <LinearGradient
                      colors={['#000000', '#333333']}
                      style={styles.primaryButtonGradient}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="white" />
                      <Text style={styles.primaryButtonText}>Got it</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginVertical: Spacing.sm,
    // Modern shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 16,
    backgroundColor: 'transparent',
    margin: 4,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.md,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#2d1b69',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    marginTop: 2,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: '#8b5cf6',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  errorContainer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSizes.base,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: Spacing.md,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: Spacing.sm,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  retryText: {
    color: 'white',
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  announcementsList: {
    maxHeight: 280,
  },
  announcementItem: {
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  announcementGradient: {
    padding: Spacing.md,
  },
  firstItem: {
    marginTop: 0,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  typeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: '#8b5cf6',
    fontWeight: '500',
    marginLeft: 4,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  announcementMessage: {
    fontSize: FontSizes.sm,
    color: '#475569',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  tapText: {
    fontSize: FontSizes.xs,
    color: '#8b5cf6',
    marginRight: 6,
    fontWeight: '500',
  },
  
  // Modal Styles (Same as TeamMembersCard)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalContent: {
    width: '95%',
    maxHeight: '90%',
    minHeight: 500,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },

  modalTitleSection: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
  },

  modalBodyContent: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },

  contentSection: {
    marginBottom: 20,
  },

  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  contentIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  contentLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  contentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  contentText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#374151',
    fontWeight: '400',
  },

  detailsSection: {
    marginBottom: 16,
  },

  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },

  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },

  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 2,
  },

  detailSeparator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 4,
  },

  modalFooter: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },

  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default AnnouncementsCard;
