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
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  
  const [pointsForm, setPointsForm] = useState({
    userId: '',
    activityDescription: '',
    points: '',
  });

  
  const fetchStudents = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetchWithTimeout(API_ROUTES.coach.students, { headers }, 15000);
      
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData || []);
      } else {
        setError('Failed to load students');
      }
    } catch (error) {
      setError('Network error loading students');
    }
  };

  
  const fetchPointsHistory = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetchWithTimeout(API_ROUTES.coach.pointsHistory, { headers }, 15000);
      
      if (response.ok) {
        const historyData = await response.json();
        setPointsHistory(historyData || []);
      } else {
        setError('Failed to load points history');
      }
    } catch (error) {
      setError('Network error loading points history');
    }
  };

  
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

  
  const handleFormChange = (field, value) => {
    setPointsForm(prev => ({ ...prev, [field]: value }));
  };

  
  const clearMessages = () => {
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  
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
        await fetchPointsHistory(); 
        clearMessages();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to award points');
        clearMessages();
      }
    } catch (error) {
      setError('Network error awarding points');
      clearMessages();
    }
  };

  
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
                await fetchPointsHistory(); 
                clearMessages();
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete points award');
                clearMessages();
              }
            } catch (error) {
              setError('Network error deleting points award');
              clearMessages();
            }
          }
        }
      ]
    );
  };

  
  const getSelectedStudent = () => {
    return students.find(s => s.id === pointsForm.userId);
  };

  
  const getFilteredStudents = () => {
    if (!searchQuery.trim()) return students;
    
    return students.filter(student => 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.team?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
            <Ionicons name="chevron-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="trophy" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Points Manager</Text>
              <Text style={styles.headerSubtitle}>Reward students</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.awardButton} 
            onPress={() => setShowPointsForm(true)}
          >
            <Ionicons name="star" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {error ? (
          <View style={styles.messageContainer}>
            <View style={styles.errorContainer}>
              <View style={styles.messageIconContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : null}
        
        {success ? (
          <View style={styles.messageContainer}>
            <View style={styles.successContainer}>
              <View style={styles.messageIconContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              </View>
              <Text style={styles.successText}>{success}</Text>
            </View>
          </View>
        ) : null}

        {/* Points History - Compact View */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="time" size={18} color="#ffffff" />
            </View>
            <View style={styles.sectionTextContainer}>
              <Text style={styles.sectionTitle}>Recent Awards</Text>
              <Text style={styles.sectionSubtitle}>Latest point awards</Text>
            </View>
            {pointsHistory.length > 3 && (
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => setShowAllHistory(true)}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>
          
          {pointsHistory.length > 0 ? (
            <View style={styles.historyContainer}>
              {pointsHistory.slice(0, 3).map((entry) => (
                <View key={entry.id} style={styles.historyCard}>
                  <View style={styles.historyCardContent}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>
                        {entry.user?.name?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.historyCardInfo}>
                      <Text style={styles.studentName}>{entry.user?.name}</Text>
                      <Text style={styles.activityDescription} numberOfLines={1}>
                        {entry.activityDescription}
                      </Text>
                      <Text style={styles.timestamp}>
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyCardActions}>
                      <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={12} color="#ffffff" />
                        <Text style={styles.pointsText}>+{entry.points}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePoints(entry.id)}
                      >
                        <Ionicons name="trash-outline" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="trophy-outline" size={32} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No Awards Yet</Text>
              <Text style={styles.emptyMessage}>Tap the star to award points!</Text>
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => setShowPointsForm(true)}
              >
                <Ionicons name="star" size={14} color="#ffffff" />
                <Text style={styles.emptyActionText}>Award Points</Text>
              </TouchableOpacity>
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
        onRequestClose={() => {
          setShowPointsForm(false);
          setShowStudentDropdown(false);
          setPointsForm({ userId: '', activityDescription: '', points: '' });
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => {
                setShowPointsForm(false);
                setShowStudentDropdown(false);
                setPointsForm({ userId: '', activityDescription: '', points: '' });
              }}
            >
              <Ionicons name="close-circle" size={28} color="#6b7280" />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="star" size={24} color="#ffffff" />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Award Points</Text>
                <Text style={styles.modalSubtitle}>Recognize student achievements</Text>
              </View>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Student Selection */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Ionicons name="person" size={16} color="#374151" />
                <Text style={styles.formLabel}>Student</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
              <TouchableOpacity
                style={[styles.inputContainer, !pointsForm.userId && styles.inputError]}
                onPress={() => {
                  setShowStudentDropdown(!showStudentDropdown);
                  if (!showStudentDropdown) {
                    setSearchQuery('');
                  }
                }}
              >
                <Ionicons name="person-outline" size={18} color="#6b7280" />
                <Text style={[styles.inputText, !pointsForm.userId && styles.placeholderText]}>
                  {pointsForm.userId 
                    ? getSelectedStudent()?.name
                    : 'Select student...'
                  }
                </Text>
                <Ionicons 
                  name={showStudentDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {showStudentDropdown && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={16} color="#6b7280" />
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search students or teams..."
                      placeholderTextColor="#9ca3af"
                      autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Students List */}
                  <ScrollView 
                    style={styles.studentsScrollContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {getFilteredStudents().length > 0 ? (
                      getFilteredStudents().map((student) => (
                        <TouchableOpacity
                          key={student.id}
                          style={[
                            styles.dropdownOption,
                            pointsForm.userId === student.id && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            handleFormChange('userId', student.id);
                            setShowStudentDropdown(false);
                            setSearchQuery('');
                          }}
                        >
                          <View style={styles.studentOptionAvatar}>
                            <Text style={styles.studentOptionAvatarText}>
                              {student.name?.charAt(0)?.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.studentOptionInfo}>
                            <Text style={[
                              styles.dropdownOptionText,
                              pointsForm.userId === student.id && styles.dropdownOptionTextSelected
                            ]}>
                              {student.name}
                            </Text>
                            <Text style={styles.studentTeamText}>
                              <Ionicons name="people" size={12} color="#6b7280" /> {student.team?.name || 'No Team'}
                            </Text>
                          </View>
                          <Text style={styles.studentPointsText}>
                            {student.points || 0} pts
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Ionicons name="search" size={24} color="#9ca3af" />
                        <Text style={styles.noResultsText}>No students found</Text>
                        <Text style={styles.noResultsSubtext}>
                          Try adjusting your search terms
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Activity Description */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Ionicons name="document-text" size={16} color="#374151" />
                <Text style={styles.formLabel}>Activity Description</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="document-text-outline" size={18} color="#6b7280" />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={pointsForm.activityDescription}
                  onChangeText={(value) => handleFormChange('activityDescription', value)}
                  placeholder="What they do???"
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <Text style={styles.characterCount}>{pointsForm.activityDescription.length}/200</Text>
            </View>

            {/* Points */}
            <View style={styles.formGroup}>
              <View style={styles.formLabelContainer}>
                <Ionicons name="star" size={16} color="#374151" />
                <Text style={styles.formLabel}>Points to Award</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="star-outline" size={18} color="#f59e0b" />
                <TextInput
                  style={styles.textInput}
                  value={pointsForm.points}
                  onChangeText={(value) => handleFormChange('points', value)}
                  placeholder="Enter points (e.g., 50)"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Preview Card */}
            {(pointsForm.userId && pointsForm.activityDescription.trim() && pointsForm.points) && (
              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Ionicons name="eye" size={16} color="#6b7280" />
                  <Text style={styles.previewTitle}>Preview</Text>
                </View>
                <View style={styles.previewCard}>
                  <View style={styles.previewCardHeader}>
                    <View style={styles.previewStudentAvatar}>
                      <Text style={styles.previewStudentAvatarText}>
                        {getSelectedStudent()?.name?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.previewCardInfo}>
                      <Text style={styles.previewStudentName}>
                        {getSelectedStudent()?.name}
                      </Text>
                      <Text style={styles.previewActivity}>
                        {pointsForm.activityDescription}
                      </Text>
                    </View>
                    <View style={styles.previewPointsBadge}>
                      <Ionicons name="star" size={12} color="#ffffff" />
                      <Text style={styles.previewPointsText}>+{pointsForm.points}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points) && styles.submitButtonDisabled
              ]}
              onPress={handleAwardPoints}
              disabled={!pointsForm.userId || !pointsForm.activityDescription || !pointsForm.points}
            >
              <Ionicons name="trophy" size={18} color="#ffffff" />
              <Text style={styles.submitButtonText}>Award Points</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* See All History Modal */}
      <Modal
        visible={showAllHistory}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.allHistoryModal}>
            <View style={styles.allHistoryHeader}>
              <View style={styles.allHistoryHeaderContent}>
                <View style={styles.allHistoryIconContainer}>
                  <Ionicons name="list" size={20} color="#ffffff" />
                </View>
                <Text style={styles.allHistoryTitle}>All Point Awards</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setShowAllHistory(false)}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={pointsHistory}
              keyExtractor={(item) => item.id}
              style={styles.allHistoryList}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <View style={styles.allHistoryCard}>
                  <View style={styles.allHistoryCardContent}>
                    <View style={styles.allStudentAvatar}>
                      <Text style={styles.allStudentAvatarText}>
                        {item.user?.name?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.allHistoryCardInfo}>
                      <Text style={styles.allStudentName}>{item.user?.name}</Text>
                      <Text style={styles.allActivityDescription}>
                        {item.activityDescription}
                      </Text>
                      <Text style={styles.allTimestamp}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.allHistoryCardActions}>
                      <View style={styles.allPointsBadge}>
                        <Ionicons name="star" size={12} color="#ffffff" />
                        <Text style={styles.allPointsText}>+{item.points}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.allDeleteButton}
                        onPress={() => {
                          setShowAllHistory(false);
                          handleDeletePoints(item.id);
                        }}
                      >
                        <Ionicons name="trash-outline" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.allEmptyState}>
                  <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
                  <Text style={styles.allEmptyTitle}>No Awards Yet</Text>
                  <Text style={styles.allEmptyMessage}>Points you award will appear here</Text>
                </View>
              }
            />
          </View>
        </View>
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

  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: Spacing.md,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    fontWeight: '500',
  },
  awardButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  
  messageContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },
  messageIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: FontSizes.sm,
    fontWeight: '500',
    flex: 1,
  },
  successText: {
    color: '#059669',
    fontSize: FontSizes.sm,
    fontWeight: '500',
    flex: 1,
  },

  
  historySection: {
    backgroundColor: '#ffffff',
    margin: Spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  seeAllText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#6366f1',
  },
  historyContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  historyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  historyCardInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: '#9ca3af',
    fontWeight: '500',
  },
  historyCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: Spacing.xs,
  },
  emptyMessage: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#22c55e',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  footerSpace: {
    height: 50,
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  allHistoryModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  allHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  allHistoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  allHistoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allHistoryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  allHistoryList: {
    maxHeight: 400,
  },
  allHistoryCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  allHistoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  allStudentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allStudentAvatarText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  allHistoryCardInfo: {
    flex: 1,
  },
  allStudentName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  allActivityDescription: {
    fontSize: FontSizes.xs,
    color: '#64748b',
    marginBottom: 2,
    lineHeight: 16,
  },
  allTimestamp: {
    fontSize: FontSizes.xs,
    color: '#9ca3af',
    fontWeight: '500',
  },
  allHistoryCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  allPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  allPointsText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  allDeleteButton: {
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allEmptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  allEmptyTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  allEmptyMessage: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    textAlign: 'center',
  },

  
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  requiredIndicator: {
    fontSize: FontSizes.sm,
    color: '#ef4444',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#ffffff',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  inputText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: '#1f2937',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  textInput: {
    flex: 1,
    fontSize: FontSizes.base,
    color: '#1f2937',
    fontWeight: '500',
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  characterCount: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  dropdownContainer: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 4,
  },
  studentsScrollContainer: {
    maxHeight: 240,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: Spacing.sm,
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f9ff',
    borderBottomColor: '#dbeafe',
  },
  dropdownOptionText: {
    fontSize: FontSizes.sm,
    color: '#1f2937',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  studentOptionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentOptionAvatarText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  studentOptionInfo: {
    flex: 1,
  },
  studentTeamText: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  studentPointsText: {
    fontSize: FontSizes.xs,
    color: '#f59e0b',
    fontWeight: '600',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#22c55e',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: Spacing.md,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  previewTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#374151',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewStudentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewStudentAvatarText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  previewCardInfo: {
    flex: 1,
  },
  previewStudentName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  previewActivity: {
    fontSize: FontSizes.xs,
    color: '#64748b',
  },
  previewPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewPointsText: {
    color: '#ffffff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
};

export default ManagePoints;
