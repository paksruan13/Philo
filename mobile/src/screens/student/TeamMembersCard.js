import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const TeamMembersCard = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>👥</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Team Members</Text>
              <Text style={styles.subtitle}>No teammates</Text>
            </View>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        </View>
      </View>
    );
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'STUDENT':
        return '👨‍🎓';
      case 'COACH':
        return '👨‍🏫';
      default:
        return '👤';
    }
  };

  const getMemberContributions = (member) => {
    const contributions = member.contributions || {};
    const points = contributions.totalPoints || 
                   contributions.activityPoints || 
                   contributions.points || 0;
    const spent = (contributions.donations || 0) + 
                  (contributions.totalPurchasesSpent || 
                   contributions.shirtSpent || 0);
    return { points, spent };
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>👥</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Team Members</Text>
            <Text style={styles.subtitle}>{members.length} teammates</Text>
          </View>
        </View>

        {/* Members List */}
        <ScrollView style={styles.membersList} nestedScrollViewsEnabled={true}>
          {members.map(member => {
            const { points, spent } = getMemberContributions(member);
            
            return (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberName}>
                    <Text style={styles.roleIcon}>
                      {getRoleIcon(member.role)}
                    </Text>
                    <Text style={styles.nameText}>{member.name}</Text>
                  </View>
                  <Text style={styles.roleText}>
                    {member.role.toLowerCase()}
                  </Text>
                </View>
                
                {member.contributions && (
                  <View style={styles.memberStats}>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>{points} pts</Text>
                    </View>
                    <Text style={styles.contributionText}>
                      ${spent.toFixed(2)} contributed
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#06b6d4', // Cyan gradient
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
  membersList: {
    maxHeight: 264, // Increased height for more members
  },
  memberItem: {
    backgroundColor: Colors.secondary + '4D', // 30% opacity
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  roleIcon: {
    fontSize: FontSizes.base,
    marginRight: Spacing.xs,
  },
  nameText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
  },
  roleText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    textTransform: 'capitalize',
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  pointsBadge: {
    backgroundColor: Colors.primary + '33', // 20% opacity
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  pointsText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  contributionText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
};

export default TeamMembersCard;
