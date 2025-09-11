import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const SettingsManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donationGoal, setDonationGoal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConfig = async () => {
    try {
      const response = await fetch(API_ROUTES.admin.config, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setDonationGoal((data.donationGoal || 50000).toString());
      } else {
        setError('Failed to fetch configuration');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConfig();
  };

  const updateDonationGoal = async () => {
    const newGoal = parseFloat(donationGoal);
    if (!newGoal || newGoal <= 0) {
      Alert.alert('Error', 'Please enter a valid donation goal amount');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(API_ROUTES.admin.config, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'donationGoal',
          value: newGoal
        }),
      });

      if (response.ok) {
        setConfig(prev => ({ ...prev, donationGoal: newGoal }));
        setSuccess('Donation goal updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        Alert.alert('Success', 'Donation goal updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update donation goal');
      }
    } catch (error) {
      console.error('Error updating donation goal:', error);
      setError('Failed to update donation goal');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const SettingCard = ({ title, description, children }) => (
    <View style={styles.settingCard}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {children}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings ⚙️</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Success/Error Messages */}
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Configuration</Text>
          <Text style={styles.sectionSubtitle}>Configure system-wide settings and parameters.</Text>

          {/* Donation Goal Settings */}
          <SettingCard
            title="Fundraising Settings"
            description="Set the overall fundraising goal for Project Phi."
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Donation Goal ($)</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.textInput}
                    value={donationGoal}
                    onChangeText={setDonationGoal}
                    placeholder="50000"
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.updateButton, saving && styles.disabledButton]}
                  onPress={updateDonationGoal}
                  disabled={saving}
                >
                  <Text style={styles.updateButtonText}>
                    {saving ? 'Saving...' : 'Update Goal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.currentGoalContainer}>
              <Text style={styles.currentGoalText}>
                <Text style={styles.currentGoalLabel}>Current Goal: </Text>
                ${((config.donationGoal || 50000)).toLocaleString()}
              </Text>
              <Text style={styles.currentGoalSubtext}>
                This goal will be displayed on the main dashboard and used to calculate progress percentages.
              </Text>
            </View>
          </SettingCard>

          {/* System Information */}
          <SettingCard
            title="System Information"
            description="View current system status and information."
          >
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Application Version</Text>
                <Text style={styles.infoValue}>v2.0.0</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Database Status</Text>
                <Text style={[styles.infoValue, styles.statusActive]}>✅ Active</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Last Backup</Text>
                <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Environment</Text>
                <Text style={styles.infoValue}>Production</Text>
              </View>
            </View>
          </SettingCard>

          {/* Application Settings */}
          <SettingCard
            title="Application Settings"
            description="Configure application behavior and features."
          >
            <View style={styles.settingsList}>
              <View style={styles.settingItem}>
                <View style={styles.settingItemInfo}>
                  <Text style={styles.settingItemTitle}>Registration</Text>
                  <Text style={styles.settingItemDescription}>Allow new user registration</Text>
                </View>
                <View style={styles.settingToggle}>
                  <Text style={[styles.toggleStatus, styles.toggleActive]}>Enabled</Text>
                </View>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingItemInfo}>
                  <Text style={styles.settingItemTitle}>Team Creation</Text>
                  <Text style={styles.settingItemDescription}>Allow users to create new teams</Text>
                </View>
                <View style={styles.settingToggle}>
                  <Text style={[styles.toggleStatus, styles.toggleActive]}>Enabled</Text>
                </View>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingItemInfo}>
                  <Text style={styles.settingItemTitle}>Public Leaderboard</Text>
                  <Text style={styles.settingItemDescription}>Show leaderboard to all users</Text>
                </View>
                <View style={styles.settingToggle}>
                  <Text style={[styles.toggleStatus, styles.toggleActive]}>Enabled</Text>
                </View>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingItemInfo}>
                  <Text style={styles.settingItemTitle}>Maintenance Mode</Text>
                  <Text style={styles.settingItemDescription}>Put application in maintenance mode</Text>
                </View>
                <View style={styles.settingToggle}>
                  <Text style={[styles.toggleStatus, styles.toggleInactive]}>Disabled</Text>
                </View>
              </View>
            </View>
          </SettingCard>

          {/* Security Settings */}
          <SettingCard
            title="Security & Backup"
            description="System security and data backup settings."
          >
            <View style={styles.actionsList}>
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionContent}>
                  <Text style={styles.actionIcon}>🔒</Text>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Security Audit</Text>
                    <Text style={styles.actionDescription}>Run system security audit</Text>
                  </View>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionContent}>
                  <Text style={styles.actionIcon}>💾</Text>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Backup Database</Text>
                    <Text style={styles.actionDescription}>Create database backup</Text>
                  </View>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionContent}>
                  <Text style={styles.actionIcon}>📊</Text>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Export Data</Text>
                    <Text style={styles.actionDescription}>Export system data</Text>
                  </View>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionContent}>
                  <Text style={styles.actionIcon}>🔄</Text>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Clear Cache</Text>
                    <Text style={styles.actionDescription}>Clear system cache</Text>
                  </View>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </SettingCard>
        </View>

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
  },

  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  scrollContainer: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },

  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  backButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  title: {
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: Colors.foreground,
    textAlign: 'center',
  },

  placeholder: {
    width: 50,
  },

  successContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  successText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  errorContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  section: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },

  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    marginBottom: Spacing.lg,
  },

  settingCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  settingHeader: {
    marginBottom: Spacing.md,
  },

  settingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },

  settingDescription: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  inputContainer: {
    marginBottom: Spacing.md,
  },

  inputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    flex: 1,
  },

  dollarSign: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    marginRight: Spacing.sm,
  },

  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.foreground,
  },

  updateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  disabledButton: {
    opacity: 0.5,
  },

  updateButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  currentGoalContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },

  currentGoalText: {
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    marginBottom: 4,
  },

  currentGoalLabel: {
    fontWeight: '600',
  },

  currentGoalSubtext: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
    lineHeight: FontSizes.xs * 1.4,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  infoItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },

  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '500',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '600',
  },

  statusActive: {
    color: Colors.success,
  },

  settingsList: {
    gap: Spacing.md,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  settingItemInfo: {
    flex: 1,
  },

  settingItemTitle: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '600',
    marginBottom: 2,
  },

  settingItemDescription: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  settingToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },

  toggleStatus: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  toggleActive: {
    color: Colors.success,
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },

  toggleInactive: {
    color: Colors.error,
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },

  actionsList: {
    gap: Spacing.sm,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  actionIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.md,
  },

  actionInfo: {
    flex: 1,
  },

  actionTitle: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '600',
    marginBottom: 2,
  },

  actionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
  },

  actionArrow: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    fontWeight: '600',
  },

  footerSpace: {
    height: Spacing.xl,
  },
};

export default SettingsManagement;
