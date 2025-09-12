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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="settings" size={32} color="#0891b2" />
          </View>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.backgroundGradient}
      >
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#0891b2"
              colors={['#0891b2']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#0891b2" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <View style={styles.titleContainer}>
                <Ionicons name="settings" size={24} color="#0891b2" />
                <Text style={styles.title}>Settings</Text>
              </View>
              <Text style={styles.subtitle}>Manage system configuration</Text>
            </View>
            
            <View style={styles.headerSpacer} />
          </View>

          {/* Messages */}
          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Donation Goal Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons name="flag" size={24} color="#ffffff" />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Fundraising Goal</Text>
                <Text style={styles.cardDescription}>Set the target amount for your fundraising campaign</Text>
              </View>
            </View>

            <View style={styles.currentGoalDisplay}>
              <Text style={styles.currentGoalLabel}>Current Goal</Text>
              <Text style={styles.currentGoalValue}>
                ${(config.donationGoal || 50000).toLocaleString()}
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>New Goal Amount</Text>
              <View style={styles.inputContainer}>
                <View style={styles.dollarContainer}>
                  <Text style={styles.dollarSign}>$</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={donationGoal}
                  onChangeText={setDonationGoal}
                  placeholder="Enter amount"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.updateButton, saving && styles.updateButtonDisabled]}
              onPress={updateDonationGoal}
              disabled={saving}
            >
              <LinearGradient
                colors={saving ? ['#9ca3af', '#9ca3af'] : ['#0891b2', '#0ea5e9']}
                style={styles.updateButtonGradient}
              >
                <Ionicons 
                  name={saving ? "hourglass" : "save"} 
                  size={18} 
                  color="#ffffff" 
                />
                <Text style={styles.updateButtonText}>
                  {saving ? 'Saving...' : 'Update Goal'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  backgroundGradient: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },

  headerSpacer: {
    width: 40,
  },

  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },

  successText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },

  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.3)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  cardTitleContainer: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  currentGoalDisplay: {
    backgroundColor: 'rgba(8, 145, 178, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },

  currentGoalLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  currentGoalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0891b2',
    letterSpacing: -1,
  },

  inputSection: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 12,
  },

  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },

  dollarContainer: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dollarSign: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },

  textInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
  },

  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  updateButtonDisabled: {
    opacity: 0.6,
  },

  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },

  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
};

export default SettingsManagement;
