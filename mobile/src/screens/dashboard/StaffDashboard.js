import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Spacing, FontSizes, BorderRadius, Styles } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const StaffDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Add any data fetching here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleActionPress = (action) => {
    // Add a subtle scale animation to the pressed button
    action();
  };

  return (
    <SafeAreaView style={Styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>Welcome back, Staff!</Text>
                <Text style={styles.subtitle}>{user?.name}</Text>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#059669" />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={24} color="#6b21a8" />
            <Text style={styles.sectionTitle}>Staff Actions</Text>
          </View>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleActionPress(() => navigation.navigate('ProductSales'))}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="storefront-outline" size={24} color="#6b21a8" />
              </View>
              <Text style={styles.actionText}>Product Sales</Text>
              <Text style={styles.actionSubtext}>Manage inventory & sales</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleActionPress(() => navigation.navigate('ManagePoints'))}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="star-outline" size={24} color="#6b21a8" />
              </View>
              <Text style={styles.actionText}>Award Points</Text>
              <Text style={styles.actionSubtext}>Manage student points</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  headerContainer: {
    backgroundColor: '#ffffff',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  header: {
    paddingHorizontal: Spacing.lg,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },

  subtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
  },

  headerIcon: {
    marginLeft: Spacing.md,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: Spacing.sm,
    flex: 1,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },

  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    width: (screenWidth - Spacing.lg * 3) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  actionText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  actionSubtext: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
  },

  footerSpace: {
    height: Spacing.xl,
  },
});

export default StaffDashboard;