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
import { Ionicons } from '@expo/vector-icons';
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
            <Ionicons name="chevron-back" size={20} color="#6366f1" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}> Points Manager</Text>
          </View>
          <TouchableOpacity 
            style={styles.newPointsButton} 
            onPress={() => setShowPointsForm(true)}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.newPointsButtonText}>Award</Text>
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

        {/* Points History */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <View style={styles.historyIconContainer}>
              <Ionicons name="time" size={18} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>📊 Recent Awards</Text>
              <Text style={styles.sectionSubtitle}>{pointsHistory.length} point awards recorded</Text>
            </View>
          </View>
          {pointsHistory.length > 0 ? (
            <View style={styles.historyContainer}>
              {pointsHistory.map((entry) => (
                <View key={entry.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <View style={styles.historyAvatar}>
                      <Text style={styles.historyAvatarText}>
                        {entry.user?.name?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.historyMain}>
                      <Text style={styles.studentName}>{entry.user?.name}</Text>
                      <Text style={styles.activityDescription}>{entry.activityDescription}</Text>
                      <Text style={styles.timestamp}>
                        📅 {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyActions}>
                      <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={12} color="#ffffff" />
                        <Text style={styles.pointsText}>+{entry.points}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePoints(entry.id)}
                      >
                        <Ionicons name="trash" size={12} color="#ffffff" />
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

      {/* Award Points Modal */}
      <Modal
        visible={showPointsForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="star" size={22} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.modalTitle}>⭐ Award Points</Text>
                <Text style={styles.modalSubtitle}>Recognize outstanding achievements</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowPointsForm(false);
                setShowStudentDropdown(false);
                setPointsForm({ userId: '', activityDescription: '', points: '' });
              }}
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Student Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>👤 Select Student *</Text>
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
                <Ionicons 
                  name={showStudentDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
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
                      <View style={styles.studentOptionContent}>
                        <View style={styles.studentOptionAvatar}>
                          <Text style={styles.studentOptionAvatarText}>
                            {student.name?.charAt(0)?.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.studentOptionInfo}>
                          <Text style={[
                            styles.roleOptionText,
                            pointsForm.userId === student.id && styles.roleOptionTextSelected
                          ]}>
                            {student.name}
                          </Text>
                          <Text style={styles.studentOptionTeam}>
                            {student.team?.name || 'No Team'} • {student.points || 0} pts
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Activity Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>📝 Activity Description *</Text>
              <TextInput
                style={styles.textInput}
                value={pointsForm.activityDescription}
                onChangeText={(value) => handleFormChange('activityDescription', value)}
                placeholder="e.g., Outstanding performance in fundraising event"
                multiline={true}
                numberOfLines={2}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Points */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>🏆 Points to Award *</Text>
              <View style={styles.pointsInputContainer}>
                <Ionicons name="star" size={18} color="#f59e0b" style={styles.pointsIcon} />
                <TextInput
                  style={styles.pointsInput}
                  value={pointsForm.points}
                  onChangeText={(value) => handleFormChange('points', value)}
                  placeholder="Enter points (e.g., 50)"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
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
              <Ionicons name="trophy" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>Award Points</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: '#64748b',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  backButtonText: {
    fontSize: FontSizes.sm,
    color: '#6366f1',
    fontWeight: '600',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    fontWeight: '500',
  },
  newPointsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#22c55e',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newPointsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },

  // Messages
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  errorText: {
    color: '#dc2626',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    margin: Spacing.lg,
  },
  successText: {
    color: '#059669',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },

  // History Section
  historySection: {
    backgroundColor: '#ffffff',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: Spacing.md,
  },
  historyItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyAvatarText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  historyMain: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: Spacing.xs,
  },
  activityDescription: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    marginBottom: Spacing.xs,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: '#9ca3af',
  },
  historyActions: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerSpace: {
    height: 50,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  // Form Elements
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#374151',
    marginBottom: Spacing.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: Spacing.md,
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  required: {
    borderColor: '#ef4444',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: Spacing.sm,
    backgroundColor: '#ffffff',
    maxHeight: 200,
  },
  roleOption: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roleOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  studentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  studentOptionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentOptionAvatarText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  studentOptionInfo: {
    flex: 1,
  },
  roleOptionText: {
    fontSize: FontSizes.sm,
    color: '#1f2937',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  studentOptionTeam: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  pointsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
  },
  pointsIcon: {
    marginRight: Spacing.sm,
  },
  pointsInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    color: '#1f2937',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#22c55e',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    marginTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
};

export default ManagePoints;
