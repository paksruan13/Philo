import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const ShirtSummary = ({ stats }) => {
  const totalDonations = stats?.totalDonations || 0;
  const totalShirtRevenue = stats?.totalShirtRevenue || 0;
  const totalProductRevenue = stats?.totalProductRevenue || 0;
  const totalContributed = totalDonations + totalShirtRevenue + totalProductRevenue;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>🛍️</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Total Contribution</Text>
            <Text style={styles.subtitle}>All team contributions</Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amount}>${totalContributed.toFixed(2)}</Text>
          <Text style={styles.amountLabel}>Total Contributed</Text>
        </View>
        
        {/* Breakdown */}
        <View style={styles.breakdownSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Breakdown</Text>
          </View>
          
          <View style={styles.breakdownList}>
            {/* Donations */}
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownIcon}>💰</Text>
                <Text style={styles.breakdownLabel}>Donations</Text>
              </View>
              <Text style={styles.breakdownAmount}>
                ${totalDonations.toFixed(2)}
              </Text>
            </View>
            
            {/* Shirts */}
            {totalShirtRevenue > 0 && (
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownIcon}>👕</Text>
                  <Text style={styles.breakdownLabel}>Shirts</Text>
                </View>
                <Text style={styles.breakdownAmount}>
                  ${totalShirtRevenue.toFixed(2)}
                </Text>
              </View>
            )}
            
            {/* Products */}
            {totalProductRevenue > 0 && (
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownIcon}>🛒</Text>
                  <Text style={styles.breakdownLabel}>Products</Text>
                </View>
                <Text style={styles.breakdownAmount}>
                  ${totalProductRevenue.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f97316', // Orange gradient
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
    fontSize: FontSizes['4xl'],
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
  breakdownSection: {
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
  breakdownList: {
    gap: Spacing.xs,
  },
  breakdownItem: {
    backgroundColor: Colors.secondary + '4D', // 30% opacity
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownIcon: {
    fontSize: FontSizes.sm,
    marginRight: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },
  breakdownAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
  },
};

export default ShirtSummary;
