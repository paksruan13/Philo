import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - Spacing.lg * 3) / 2;

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();



  return (
    <SafeAreaView style={Styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Admin Dashboard ⚙️</Text>
          <Text style={styles.subtitle}>System Overview & Management</Text>
        </View>



        {/* Management Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>🚀 Management Tools</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Text style={styles.actionIcon}>�</Text>
              <Text style={styles.actionText}>User Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('TeamManagement')}
            >
              <Text style={styles.actionIcon}>�</Text>
              <Text style={styles.actionText}>Team Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ActivityManagement')}
            >
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionText}>Activity Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('InventoryManagement')}
            >
              <Text style={styles.actionIcon}>�</Text>
              <Text style={styles.actionText}>Inventory Management</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AnnouncementManagement')}
            >
              <Text style={styles.actionIcon}>📢</Text>
              <Text style={styles.actionText}>Announcements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('SettingsManagement')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  greeting: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    fontWeight: '500',
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },

  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  statIcon: {
    fontSize: FontSizes.xl,
    marginRight: Spacing.sm,
  },

  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
  },

  statTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },

  statSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  actionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    width: cardWidth,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionIcon: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.sm,
  },

  actionText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  sectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  sectionButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  alertCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },

  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  alertIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.md,
  },

  alertInfo: {
    flex: 1,
  },

  alertTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },

  alertTime: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  severityText: {
    fontSize: FontSizes.xs,
    color: Colors.card,
    fontWeight: '600',
  },

  alertMessage: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    lineHeight: FontSizes.base * 1.4,
  },

  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  userAvatarText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },

  userEmail: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },

  userRole: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '500',
  },

  userStatus: {
    alignItems: 'flex-end',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },

  statusText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },

  teamCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamRank: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: Spacing.md,
    width: 30,
  },

  teamInfo: {
    flex: 1,
  },

  teamName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },

  teamCode: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  teamPoints: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.accent,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  emptyText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },

  footerSpace: {
    height: Spacing.xl,
  },
};

export default AdminDashboard;
