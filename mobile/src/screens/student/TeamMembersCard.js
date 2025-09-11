import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
              <Text style={styles.title}>Top Contributors</Text>
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

  // Sort members by contribution amount (highest first)
  const sortedMembers = [...members].sort((a, b) => {
    const aContributions = a.contributions || {};
    const bContributions = b.contributions || {};
    
    const aSpent = (aContributions.donations || 0) + 
                  (aContributions.totalPurchasesSpent || 
                   aContributions.shirtSpent || 0);
    
    const bSpent = (bContributions.donations || 0) + 
                  (bContributions.totalPurchasesSpent || 
                   bContributions.shirtSpent || 0);
    
    return bSpent - aSpent;
  });

  // Top 3 contributors to display in the card
  const topContributors = sortedMembers.slice(0, 3);

  const renderMemberItem = (member, index, showRank = true) => {
    const contributions = member.contributions || {};
    const spent = (contributions.donations || 0) + 
                 (contributions.totalPurchasesSpent || 
                  contributions.shirtSpent || 0);
    
    return (
      <View key={member.id} style={styles.memberItem}>
        {showRank && (
          <View style={[
            styles.rankBadge, 
            { backgroundColor: index < 3 ? getRankColor(index + 1) : '#9ca3af' }
          ]}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
        )}
        
        <View style={styles.memberInfo}>
          <Text style={styles.nameText}>{member.name}</Text>
          <Text style={styles.roleText}>
            {member.role ? member.role.toLowerCase() : 'member'}
          </Text>
        </View>
        
        <View style={styles.contributionContainer}>
          <Text style={styles.contributionAmount}>${spent.toFixed(2)}</Text>
          <Text style={styles.contributionLabel}>raised</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#06b6d4', '#0891b2']}
            style={styles.icon}
          >
            <Ionicons name="people" size={20} color="white" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>Top Contributors</Text>
            <Text style={styles.subtitle}>{members.length} teammates</Text>
          </View>
        </View>

        {/* Top Members List */}
        <View style={styles.topMembersList}>
          {topContributors.map((member, index) => renderMemberItem(member, index))}
        </View>

        {/* See All Button */}
        {members.length > 3 && (
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.seeAllText}>See All Contributors</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

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
              <Text style={styles.modalTitle}>All Team Contributors</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {sortedMembers.map((member, index) => renderMemberItem(member, index))}
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

const styles = {
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
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
    ...Shadows.sm,
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
  topMembersList: {
    marginTop: Spacing.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '1A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.xs,
  },
  rankText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },
  roleText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    textTransform: 'capitalize',
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
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
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
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '1A',
  },
  modalScrollView: {
    padding: Spacing.lg,
    maxHeight: 400,
  },
};

export default TeamMembersCard;
