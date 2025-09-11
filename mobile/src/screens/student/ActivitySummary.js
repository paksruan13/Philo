import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const ActivitySummary = ({ activities, stats }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const availableActivities = activities?.slice(0, 5) || [];

  const handleActivityPress = (activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedActivity(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>📋</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Activities</Text>
            <Text style={styles.subtitle}>Tap to view details</Text>
          </View>
        </View>
        
        {/* Activities List */}
        {availableActivities.length > 0 ? (
          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📋</Text>
              <Text style={styles.sectionTitle}>Posted Activities ({availableActivities.length})</Text>
            </View>
            <ScrollView style={styles.activitiesList} nestedScrollViewsEnabled={true}>
              {availableActivities.map((activity, index) => {
                const colorSchemes = [
                  { bg: '#dbeafe', border: '#93c5fd' }, // Blue
                  { bg: '#dcfce7', border: '#86efac' }, // Green
                  { bg: '#fce7f3', border: '#f9a8d4' }, // Pink
                  { bg: '#fef3c7', border: '#fcd34d' }, // Yellow
                  { bg: '#ede9fe', border: '#c4b5fd' }, // Purple
                ];
                const currentScheme = colorSchemes[index % colorSchemes.length];
                
                return (
                  <TouchableOpacity
                    key={activity.id}
                    onPress={() => handleActivityPress(activity)}
                    style={[
                      styles.activityItem,
                      { 
                        backgroundColor: currentScheme.bg,
                        borderColor: currentScheme.border,
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityContent}>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {activity.title}
                        </Text>
                        <View style={styles.activityMeta}>
                          <Text style={styles.metaIcon}>⭐</Text>
                          <Text style={styles.metaText}>{activity.points} points</Text>
                          <Text style={styles.tapHint}>• Tap for details</Text>
                        </View>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>{activity.points}pts</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No activities posted yet</Text>
          </View>
        )}

        {/* Activity Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedActivity && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedActivity.title}</Text>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalBody}>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Points</Text>
                      <View style={styles.pointsDisplay}>
                        <Text style={styles.pointsDisplayText}>{selectedActivity.points} points</Text>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Description</Text>
                      <Text style={styles.modalDescription}>
                        {selectedActivity.description || 'No description available for this activity.'}
                      </Text>
                    </View>

                    {selectedActivity.type && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Type</Text>
                        <Text style={styles.modalType}>{selectedActivity.type}</Text>
                      </View>
                    )}

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Status</Text>
                      <Text style={styles.modalStatus}>
                        {selectedActivity.isPublished ? '✅ Published' : '⏳ Draft'}
                      </Text>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = {
  container: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  content: {
    padding: Spacing.md,
    paddingVertical: Spacing.md,
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
    backgroundColor: '#8b5cf6', // Purple gradient
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.md,
  },
  iconText: {
    fontSize: 20,
    color: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  activitiesSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    fontSize: FontSizes.sm,
    marginRight: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  activitiesList: {
    maxHeight: 128,
  },
  activityItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  activityTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: FontSizes.xs,
    marginRight: Spacing.xs,
  },
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  tapHint: {
    fontSize: 10,
    color: Colors.primary,
    fontStyle: 'italic',
    marginLeft: Spacing.xs,
  },
  pointsBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    ...Shadows.sm,
  },
  pointsText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primaryForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalSection: {
    marginBottom: Spacing.lg,
  },
  modalSectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsDisplay: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  pointsDisplayText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalDescription: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    lineHeight: 22,
  },
  modalType: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    backgroundColor: Colors.muted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  modalStatus: {
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    fontWeight: '500',
  },
};

export default ActivitySummary;
