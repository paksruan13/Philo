import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const TeamMembersCard = ({ members }) => {
  const [modalVisible, setModalVisible] = useState(false);

  if (!members || members.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              style={styles.icon}
            >
              <Ionicons name="people" size={20} color="white" />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>Top Fundraisers</Text>
              <Text style={styles.subtitle}>No teammates</Text>
            </View>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={32} color={Colors.mutedForeground} />
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        </View>
      </View>
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

  const renderMemberItem = (member, index, isModal = false) => {
    // Log the member data structure for debugging
    if (index < 3) {
      console.log(`👤 Member ${member.name} full data:`, member);
      console.log(`💰 Member ${member.name} contributions:`, member.contributions);
    }
    
    const contributions = member.contributions || {};
    
    // Use only donation amounts, not purchases
    const donationAmount = contributions.donations || 0;
    
    console.log(`💵 Member ${member.name} donations: $${donationAmount}`);
    
    return (
      <View key={member.id} style={[styles.memberItem, isModal && styles.modalMemberItem]}>
        {/* Avatar */}
        <View style={[styles.avatar, isModal && styles.modalAvatar]}>
          <LinearGradient
            colors={['#8b5cf6', '#a855f7']}
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={isModal ? 20 : 16} color="white" />
          </LinearGradient>
        </View>
        
        <View style={[styles.memberInfo, isModal && styles.modalMemberInfo]}>
          <Text style={[styles.nameText, isModal && styles.modalNameText]}>{member.name}</Text>
          <Text style={[styles.roleText, isModal && styles.modalRoleText]}>
            {member.role ? member.role.toLowerCase() : 'member'}
          </Text>
        </View>
        
        <View style={[styles.statsContainer, isModal && styles.modalStatsContainer]}>
          <Text style={[styles.raisedText, isModal && styles.modalRaisedText]}>
            ${donationAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#e11d48']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            style={styles.icon}
          >
            <Ionicons name="people" size={20} color="white" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>Top Fundraisers</Text>
            <Text style={styles.subtitle}>{members.length} teammates</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>

        {/* Top Members List */}
        <View style={styles.topMembersList}>
          {topContributors.map((member, index) => renderMemberItem(member, index, false))}
        </View>
      </LinearGradient>

      {/* All Members Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="people" size={24} color="#f59e0b" />
                <Text style={styles.modalTitle}>Team Performance</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSubHeader}>
              <Text style={styles.modalSubtitle}>
                {members.length} team members ranked by contribution
              </Text>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalMembersList}>
                {sortedMembers.map((member, index) => renderMemberItem(member, index, true))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getRankColor = (rank) => {
  switch (rank) {
    case 1: return '#FFD700'; // Gold
    case 2: return '#C0C0C0'; // Silver
    case 3: return '#CD7F32'; // Bronze
    default: return '#0891b2'; // Default blue
  }
};

const getRankGradient = (rank) => {
  switch (rank) {
    case 1: return ['#FFD700', '#FFA500']; // Gold gradient
    case 2: return ['#C0C0C0', '#A8A8A8']; // Silver gradient
    case 3: return ['#CD7F32', '#B8860B']; // Bronze gradient
    default: return ['#0891b2', '#06b6d4']; // Default blue gradient
  }
};

const styles = {
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    marginBottom: Spacing.lg,
  },
  gradientBackground: {
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
    ...Shadows.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topMembersList: {
    marginTop: Spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  roleText: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  // New avatar styles
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  
  // Compact stats styles
  statsContainer: {
    alignItems: 'flex-end',
  },
  modalStatsContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  raisedText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: 'white',
    textAlign: 'right',
  },
  modalRaisedText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    textAlign: 'right',
  },

  
  // Header view all button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: FontSizes.xs,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  
  // Modal member styles
  modalMemberItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  modalMemberInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  modalNameText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalRoleText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },
  
  contributionContainer: {
    alignItems: 'flex-end',
  },
  contributionAmount: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  contributionLabel: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary + '1A',
    borderRadius: BorderRadius.md,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
  },
  modalSubHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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
    padding: 24,
    paddingTop: 0,
  },
};

export default TeamMembersCard;
