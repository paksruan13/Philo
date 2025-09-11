import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const FinancialSummary = ({ stats, recentDonations }) => {
  const totalDonations = stats?.totalDonations || 0;
  const validDonations = recentDonations?.filter(d => d) || [];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>💰</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Donations</Text>
            <Text style={styles.subtitle}>Total raised by your team</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amount}>${totalDonations.toFixed(2)}</Text>
          <Text style={styles.amountLabel}>Total Raised</Text>
        </View>
        
        {/* Recent Donations */}
        {validDonations.length > 0 ? (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📈</Text>
              <Text style={styles.sectionTitle}>Recent Donations</Text>
            </View>
            <ScrollView style={styles.donationsList} nestedScrollViewsEnabled={true}>
              {validDonations.map(donation => (
                <View key={donation.id} style={styles.donationItem}>
                  <Text style={styles.donationAmount}>${donation.amount}</Text>
                  <Text style={styles.donationUser}>
                    {donation.user ? donation.user.name : 'Anonymous'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No donations yet</Text>
          </View>
        )}
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
    backgroundColor: '#22c55e',
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
  amountSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  amount: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  amountLabel: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentSection: {
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
  donationsList: {
    maxHeight: 128,
  },
  donationItem: {
    backgroundColor: Colors.secondary + '4D', // 30% opacity
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donationAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
  donationUser: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
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
};

export default FinancialSummary;
