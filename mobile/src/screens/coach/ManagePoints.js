import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const ManagePoints = ({ navigation }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Points form state
  const [pointsForm, setPointsForm] = useState({
    userId: '',
    activityDescription: '',
    points: '',
  });

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('👥 Fetching students for points management...');
      const response = await fetchWithTimeout(API_ROUTES.coach.students, { headers }, 15000);
      
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData || []);
      } else {
        setError('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Network error loading students');
    }
  };

  // Fetch points history
  const fetchPointsHistory = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('📊 Fetching points history...');
      const response = await fetchWithTimeout(API_ROUTES.coach.pointsHistory, { headers }, 15000);
      
      if (response.ok) {
        const historyData = await response.json();
        setPointsHistory(historyData || []);
      } else {
        setError('Failed to load points history');
      }
    } catch (error) {
      console.error('Error fetching points history:', error);
      setError('Network error loading points history');
    }
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStudents(), fetchPointsHistory()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setPointsForm(prev => ({ ...prev, [field]: value }));
  };

  // Clear messages after delay
  const clearMessages = () => {
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  // Award points
  const handleAwardPoints = async () => {
    if (!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points) {
      setError('Please fill in all required fields');
      clearMessages();
      return;
    }

    if (isNaN(pointsForm.points) || parseInt(pointsForm.points) <= 0) {
      setError('Please enter a valid positive number for points');
      clearMessages();
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const requestBody = {
        userId: pointsForm.userId,
        activityDescription: pointsForm.activityDescription,
        points: parseInt(pointsForm.points),
      };

      console.log('⭐ Awarding points:', requestBody);
      const response = await fetchWithTimeout(
        API_ROUTES.coach.awardPoints, 
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        }, 
        15000
      );

      if (response.ok) {
        const selectedStudent = students.find(s => s.id === pointsForm.userId);
        setSuccess(`Successfully awarded ${pointsForm.points} points to ${selectedStudent?.name}!`);
        setPointsForm({ userId: '', activityDescription: '', points: '' });
        setShowPointsForm(false);
        setShowStudentDropdown(false);
        await fetchPointsHistory(); // Refresh history
        clearMessages();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to award points');
        clearMessages();
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      setError('Network error awarding points');
      clearMessages();
    }
  };

  // Delete points award
  const handleDeletePoints = async (pointsAwardId) => {
    Alert.alert(
      'Delete Points Award',
      'Are you sure you want to delete this points award?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              };

              console.log('🗑️ Deleting points award:', pointsAwardId);
              const response = await fetchWithTimeout(
                API_ROUTES.coach.deletePoints(pointsAwardId),
                {
                  method: 'DELETE',
                  headers,
                },
                15000
              );

              if (response.ok) {
                setSuccess('Points award deleted successfully!');
                await fetchPointsHistory(); // Refresh history
                clearMessages();
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete points award');
                clearMessages();
              }
            } catch (error) {
              console.error('Error deleting points award:', error);
              setError('Network error deleting points award');
              clearMessages();
            }
          }
        }
      ]
    );
  };

  // Get selected student
  const getSelectedStudent = () => {
    return students.find(s => s.id === pointsForm.userId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading points management...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manage Points ⭐</Text>
          <TouchableOpacity 
            style={styles.newPointsButton} 
            onPress={() => setShowPointsForm(!showPointsForm)}
          >
            <Text style={styles.newPointsButtonText}>
              {showPointsForm ? 'Cancel' : '+ Award'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* Award Points Form */}
        {showPointsForm && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Award Manual Points</Text>
            
            {/* Student Selection - Like UserManagement */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Student *</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, !pointsForm.userId && styles.required]}
                onPress={() => setShowStudentDropdown(!showStudentDropdown)}
              >
                <Text style={[styles.dropdownText, !pointsForm.userId && styles.placeholderText]}>
                  {pointsForm.userId 
                    ? `${getSelectedStudent()?.name} (${getSelectedStudent()?.team?.name || 'No Team'})`
                    : 'Choose a student...'
                  }
                </Text>
                <Text style={styles.dropdownArrow}>{showStudentDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {showStudentDropdown && (
                <View style={styles.pickerContainer}>
                  {students.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.roleOption,
                        pointsForm.userId === student.id && styles.roleOptionSelected
                      ]}
                      onPress={() => {
                        handleFormChange('userId', student.id);
                        setShowStudentDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        pointsForm.userId === student.id && styles.roleOptionTextSelected
                      ]}>
                        {student.name} ({student.team?.name || 'No Team'})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Activity Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Activity Description *</Text>
              <TextInput
                style={styles.textInput}
                value={pointsForm.activityDescription}
                onChangeText={(value) => handleFormChange('activityDescription', value)}
                placeholder="e.g., Helped with fundraising event"
                multiline={true}
                numberOfLines={2}
              />
            </View>

            {/* Points */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Points to Award *</Text>
              <TextInput
                style={styles.textInput}
                value={pointsForm.points}
                onChangeText={(value) => handleFormChange('points', value)}
                placeholder="Enter points (e.g., 50)"
                keyboardType="numeric"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points) && styles.submitButtonDisabled
              ]}
              onPress={handleAwardPoints}
              disabled={!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points}
            >
              <Text style={styles.submitButtonText}>Award Points</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Points History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Points History ({pointsHistory.length})</Text>
          {pointsHistory.length > 0 ? (
            <View style={styles.historyContainer}>
              {pointsHistory.map((entry) => (
                <View key={entry.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <View style={styles.historyMain}>
                      <Text style={styles.studentName}>{entry.user?.name}</Text>
                      <Text style={styles.activityDescription}>{entry.activityDescription}</Text>
                      <Text style={styles.timestamp}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.historyActions}>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>+{entry.points} pts</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePoints(entry.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Points Awards Yet</Text>
              <Text style={styles.emptySubtext}>
                Points you award manually will appear here.
              </Text>
            </View>
          )}
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
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  newPointsButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  newPointsButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },

  // Messages
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  successText: {
    color: '#065F46',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },

  // Form Section
  formSection: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    ...Styles.shadow,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // Form Elements - Using UserManagement styles
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  dropdownArrow: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  required: {
    borderColor: Colors.error,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    maxHeight: 200,
  },
  roleOption: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roleOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  roleOptionText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  roleOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },

  // History Section
  historySection: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    ...Styles.shadow,
  },
  historyContainer: {
    marginTop: Spacing.md,
  },
  historyItem: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  studentName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  activityDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  historyActions: {
    alignItems: 'flex-end',
  },
  pointsBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: Spacing.sm,
  },
  pointsText: {
    color: Colors.surface,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  footerSpace: {
    height: 50,
  },
};

export default ManagePoints;
