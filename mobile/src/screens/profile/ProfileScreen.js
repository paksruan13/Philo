import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ProfileItem = ({ label, value, icon }) => (
    <View style={styles.profileItem}>
      <Text style={styles.profileIcon}>{icon}</Text>
      <View style={styles.profileInfo}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={Styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>{user?.role?.toLowerCase()}</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <ProfileItem
            label="Full Name"
            value={user?.name}
            icon="👤"
          />
          
          <ProfileItem
            label="Email"
            value={user?.email}
            icon="✉️"
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
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

  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },

  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  avatar: {
    fontSize: FontSizes['3xl'],
  },

  name: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },

  role: {
    fontSize: FontSizes.base,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  section: {
    margin: Spacing.lg,
    marginTop: 0,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },

  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  profileIcon: {
    fontSize: FontSizes.xl,
    marginRight: Spacing.md,
    width: 30,
  },

  profileInfo: {
    flex: 1,
  },

  profileLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },

  profileValue: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '500',
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  settingIcon: {
    fontSize: FontSizes.xl,
    marginRight: Spacing.md,
    width: 30,
  },

  settingText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '500',
  },

  settingArrow: {
    fontSize: FontSizes.xl,
    color: Colors.mutedForeground,
  },

  logoutContainer: {
    margin: Spacing.lg,
    marginTop: Spacing.xl,
  },

  logoutButton: {
    backgroundColor: Colors.destructive,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },

  logoutText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.destructiveForeground,
  },

  footerSpace: {
    height: Spacing.xl,
  },
};

export default ProfileScreen;
