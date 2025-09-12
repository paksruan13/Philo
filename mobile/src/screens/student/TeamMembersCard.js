import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const TeamMembersCard = ({ members }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = new Animated.Value(0);

  if (!members || members.length === 0) {
    return (
      <LinearGradient
        colors={['#ffffff', '#ffffff', '#ffffff']}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#000000', '#333333']}
              style={styles.iconContainer}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="people" size={24} color="white" />
              </View>
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>Team Members</Text>
              <Text style={styles.subtitle}>No members found</Text>
            </View>
          </View>
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="person-add-outline" size={48} color="#000000" />
            </LinearGradient>
            <Text style={styles.emptyText}>No team members yet</Text>
            <Text style={styles.emptySubtext}>Members will appear here once they join your team</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Sort members by money raised
  const sortedMembers = [...members].sort((a, b) => {
    const aContributions = a.contributions || {};
    const bContributions = b.contributions || {};
    
    // Sort by donations only
    const aDonations = aContributions.donations || 0;
    const bDonations = bContributions.donations || 0;
    
    return bDonations - aDonations;
  });

  // Top 3 contributors to display in the card
  const topContributors = sortedMembers.slice(0, 3);

  const renderMemberItem = (member, index) => {
    const contributions = member.contributions || {};
    const donationAmount = contributions.donations || 0;

    return (
      <View key={member.id || index} style={styles.memberItem}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
          style={styles.memberGradient}
        >
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {member.name?.charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>
          
          <View style={styles.memberInfo}>
            <Text style={styles.nameText} numberOfLines={1}>
              {member.name || 'Unknown Member'}
            </Text>
          </View>
          
          <View style={styles.donationContainer}>
            <Text style={styles.donationText}>
              ${donationAmount.toFixed(2)}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#ffffff', '#ffffff']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#000000', '#333333']}
          style={styles.iconContainer}
        >
          <View style={styles.iconBackground}>
            <Ionicons name="people" size={20} color="white" />
          </View>
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={styles.title}>Team Members</Text>
          <Text style={styles.subtitle}>{members.length} active members</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Compact Top Members List */}
      <View style={styles.topMembersList}>
        {topContributors.map((member, index) => renderMemberItem(member, index))}
      </View>

      {/* Team Members Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleSection}>
                <Text style={styles.modalTitle}>Team Members</Text>
                <Text style={styles.modalSubtitle}>
                  {members.length} members sorted by donations
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalMembersList}>
                {sortedMembers.map((member, index) => (
                  <View key={member.id || index} style={styles.modalMemberItem}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.9)']}
                      style={styles.modalMemberGradient}
                    >
                      <View style={styles.modalAvatarBadge}>
                        <Text style={styles.modalAvatarText}>
                          {member.name?.charAt(0).toUpperCase() || 'M'}
                        </Text>
                      </View>
                      
                      <View style={styles.modalMemberInfo}>
                        <Text style={styles.modalNameText} numberOfLines={1}>
                          {member.name || 'Unknown Member'}
                        </Text>
                        <Text style={styles.modalRankText}>
                          #{index + 1} • Contributor
                        </Text>
                      </View>
                      
                      <View style={styles.modalDonationContainer}>
                        <LinearGradient
                          colors={['#000000', '#333333']}
                          style={styles.modalDonationBadge}
                        >
                          <Ionicons name="wallet" size={12} color="white" />
                          <Text style={styles.modalDonationText}>
                            ${(member.contributions?.donations || 0).toFixed(2)}
                          </Text>
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </ScrollView>
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
    marginVertical: Spacing.xs,
    // Modern shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.md,
  },
  iconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    color: '#000000',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: '#000000',
    marginTop: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginRight: 4,
  },
  topMembersList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  memberItem: {
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  memberGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  avatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  avatarText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#000000',
  },
  donationContainer: {
    alignItems: 'flex-end',
  },
  donationText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#000000',
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
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#000000',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
  
  // Modal Styles (Same as StoreScreen)
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
    width: '100%',
    maxHeight: '80%',
    minHeight: 300,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  modalScrollView: {
    flex: 1,
  },
  modalMembersList: {
    padding: 20,
  },
  modalMemberItem: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  modalMemberGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  modalAvatarText: {
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: 'white',
  },
  modalMemberInfo: {
    flex: 1,
  },
  modalNameText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  modalRankText: {
    fontSize: FontSizes.xs,
    color: '#666666',
    fontWeight: '500',
  },
  modalDonationContainer: {
    alignItems: 'flex-end',
  },
  modalDonationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  modalDonationText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: 'white',
    marginLeft: 4,
  },
});

export default TeamMembersCard;
