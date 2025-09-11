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
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const ACTIVITY_CATEGORIES = [
  { value: 'PHOTO', label: 'Photo'},
  { value: 'PURCHASE', label: 'Purchase'},
  { value: 'DONATION', label: 'Donation'},
  { value: 'OTHER', label: 'Other'},
];

const ActivityManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [error, setError] = useState('');

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_ROUTES.admin.activities}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : data.activities || []);
      } else {
        Alert.alert('Error', 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleActivityAction = (activity, action) => {
    Alert.alert(
      `${action} Activity`,
      `Are you sure you want to ${action.toLowerCase()} this activity?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: 'default',
          onPress: () => performActivityAction(activity, action)
        }
      ]
    );
  };

  const performActivityAction = async (activity, action) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'Approve':
          endpoint = `${API_ROUTES.admin.activities}/${activity.id}/approve`;
          break;
        case 'Reject':
          endpoint = `${API_ROUTES.admin.activities}/${activity.id}/reject`;
          break;
        case 'Delete':
          endpoint = `${API_ROUTES.admin.activities}/${activity.id}`;
          method = 'DELETE';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        Alert.alert('Success', `Activity ${action.toLowerCase()}d successfully`);
        fetchActivities();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || `Failed to ${action.toLowerCase()} activity`);
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing activity:`, error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return Colors.success;
      case 'REJECTED': return Colors.error;
      case 'PENDING': return Colors.warning;
      default: return Colors.mutedForeground;
    }
  };

  const deleteActivity = async (activityId) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => performDeleteActivity(activityId)
        }
      ]
    );
  };

  const performDeleteActivity = async (activityId) => {
    try {
      const response = await fetch(`${API_ROUTES.activities.delete(activityId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Activity deleted successfully');
        fetchActivities();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      setError('Error deleting activity');
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setEditModalVisible(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'PENDING': return '⏳';
      default: return '📋';
    }
  };

  const ActivityCard = ({ activity }) => {
    return (
      <View style={styles.activityCard}>
        <TouchableOpacity 
          style={styles.activityCardMain}
          onPress={() => {
            setSelectedActivity(activity);
            setModalVisible(true);
          }}
        >
          <View style={styles.activityHeader}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description || 'No description'}
              </Text>
              <View style={styles.activityMeta}>
                <Text style={styles.activityCategory}>
                  � {activity.categoryType}
                </Text>
                <Text style={styles.activityPoints}>
                  🏆 {activity.points || 0} points
                </Text>
              </View>
            </View>

            <View style={styles.activityActions}>
              <View style={styles.statusBadgeContainer}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: activity.isPublished ? Colors.success : Colors.warning }
                ]}>
                  <Text style={styles.statusText}>
                    {activity.isPublished ? 'Published' : 'Draft'}
                  </Text>
                </View>
                
                {activity.allowOnlinePurchase && (
                  <View style={[styles.featureBadge, styles.onlineBadge]}>
                    <Text style={styles.featureBadgeText}>🌐</Text>
                  </View>
                )}
                
                {activity.allowPhotoUpload && (
                  <View style={[styles.featureBadge, styles.photoBadge]}>
                    <Text style={styles.featureBadgeText}>📸</Text>
                  </View>
                )}
                
                {activity.allowSubmission && (
                  <View style={[styles.featureBadge, styles.submissionBadge]}>
                    <Text style={styles.featureBadgeText}>✍️</Text>
                  </View>
                )}
              </View>
              
              {activity.submissionCount !== undefined && (
                <View style={styles.submissionStats}>
                  <Text style={styles.submissionStatsText}>
                    {activity.approvedCount || 0}✓ {activity.pendingCount || 0}⏳ {activity.submissionCount || 0} total
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.activityCardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditActivity(activity)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteActivity(activity.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ActivityDetailModal = () => {
    if (!selectedActivity) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{selectedActivity.title}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>
                  {selectedActivity.description || 'No description provided'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Submitted By</Text>
                <Text style={styles.detailValue}>
                  {selectedActivity.user?.firstName} {selectedActivity.user?.lastName}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Team</Text>
                <Text style={styles.detailValue}>
                  {selectedActivity.user?.teamName || 'No team assigned'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Points</Text>
                <Text style={styles.detailValue}>{selectedActivity.points || 0}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusIcon}>
                    {getStatusIcon(selectedActivity.status)}
                  </Text>
                  <Text style={[
                    styles.detailValue, 
                    { color: getStatusColor(selectedActivity.status) }
                  ]}>
                    {selectedActivity.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Submitted Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedActivity.createdAt).toLocaleString()}
                </Text>
              </View>

              {selectedActivity.reviewedAt && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reviewed Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedActivity.reviewedAt).toLocaleString()}
                  </Text>
                </View>
              )}

              {selectedActivity.reviewNotes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Review Notes</Text>
                  <Text style={styles.detailValue}>{selectedActivity.reviewNotes}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              {selectedActivity.status === 'PENDING' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleActivityAction(selectedActivity, 'Approve');
                    }}
                  >
                    <Text style={styles.actionButtonText}>✅ Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleActivityAction(selectedActivity, 'Reject');
                    }}
                  >
                    <Text style={styles.actionButtonText}>❌ Reject</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  setModalVisible(false);
                  handleActivityAction(selectedActivity, 'Delete');
                }}
              >
                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };



  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
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
          <Text style={styles.title}>Activity Management 🎯</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Activity Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activities.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {activities.filter(a => a.isPublished).length}
            </Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {activities.filter(a => !a.isPublished).length}
            </Text>
            <Text style={styles.statLabel}>Drafts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ACTIVITY_CATEGORIES.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities found</Text>
          </View>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>

      <ActivityDetailModal />
      
      {/* Create/Edit Activity Modal */}
      {(createModalVisible || editModalVisible) && (
        <ActivityForm
          activity={editingActivity}
          onClose={() => {
            setCreateModalVisible(false);
            setEditModalVisible(false);
            setEditingActivity(null);
          }}
          onSave={() => {
            fetchActivities();
            setCreateModalVisible(false);
            setEditModalVisible(false);
            setEditingActivity(null);
            setError('');
          }}
          token={token}
        />
      )}
    </SafeAreaView>
  );
};

const ActivityForm = ({ activity, onClose, onSave, token }) => {
  const [formData, setFormData] = useState({
    title: activity ? activity.title : '',
    description: activity?.description || '',
    points: activity?.points || 100,
    categoryType: activity?.categoryType || 'OTHER',
    requirements: activity?.requirements || {},
    isPublished: activity?.isPublished || false,
    allowOnlinePurchase: activity?.allowOnlinePurchase || false,
    allowPhotoUpload: activity?.allowPhotoUpload || false,
    allowSubmission: activity?.allowSubmission || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const url = activity
        ? `${API_ROUTES.admin.activityDetail(activity.id)}`
        : `${API_ROUTES.admin.activities}`;

      const method = activity ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      setError('Error saving activity');
    } finally {
      setLoading(false);
    }
  };

  const isPurchaseOrDonation = formData.categoryType === 'PURCHASE' || formData.categoryType === 'DONATION';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activity ? 'Edit Activity' : 'Create Activity'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {/* Title */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="Enter activity title"
                placeholderTextColor={Colors.mutedForeground}
              />
            </View>

            {/* Description */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Enter activity description"
                placeholderTextColor={Colors.mutedForeground}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Points */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Points</Text>
              <TextInput
                style={styles.textInput}
                value={formData.points.toString()}
                onChangeText={(text) => setFormData({...formData, points: parseInt(text) || 0})}
                placeholder="Enter points"
                placeholderTextColor={Colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>

            {/* Category */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.roleOption,
                      formData.categoryType === cat.value && styles.roleOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, categoryType: cat.value})}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      formData.categoryType === cat.value && styles.roleOptionTextSelected
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Published Status */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={[
                  styles.checkbox, 
                  formData.isPublished && styles.checkboxChecked
                ]}
                onPress={() => setFormData({...formData, isPublished: !formData.isPublished})}
              >
                {formData.isPublished && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Make Visible Now!</Text>
            </View>

            {/* Allow Online Purchase (only for purchase/donation) */}
            {isPurchaseOrDonation && (
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={[
                    styles.checkbox, 
                    formData.allowOnlinePurchase && styles.checkboxChecked
                  ]}
                  onPress={() => setFormData({...formData, allowOnlinePurchase: !formData.allowOnlinePurchase})}
                >
                  {formData.allowOnlinePurchase && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                  Allow Online {formData.categoryType === 'PURCHASE' ? 'Purchase' : 'Donation'}
                </Text>
              </View>
            )}

            {/* Allow Photo Upload */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={[
                  styles.checkbox, 
                  formData.allowPhotoUpload && styles.checkboxChecked
                ]}
                onPress={() => setFormData({...formData, allowPhotoUpload: !formData.allowPhotoUpload})}
              >
                {formData.allowPhotoUpload && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Allow Photo Upload</Text>
            </View>

            {/* Allow Submission */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={[
                  styles.checkbox, 
                  formData.allowSubmission && styles.checkboxChecked
                ]}
                onPress={() => setFormData({...formData, allowSubmission: !formData.allowSubmission})}
              >
                {formData.allowSubmission && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Allow Student Submission</Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>
                {loading ? 'Saving...' : (activity ? 'Update' : 'Create')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
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
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: 'bold',
    color: Colors.foreground,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 60,
  },

  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
  },

  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },





  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    justifyContent: 'space-between',
    ...Shadows.card,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginTop: 4,
  },

  scrollContainer: {
    flex: 1,
  },

  activityCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },

  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  activityInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },

  activityTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },

  activityDescription: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 8,
    lineHeight: FontSizes.sm * 1.3,
  },

  activityMeta: {
    marginBottom: 4,
  },

  activityUser: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    marginBottom: 2,
  },

  activityTeam: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    marginBottom: 2,
  },

  activityDate: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },

  activityActions: {
    alignItems: 'flex-end',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },

  statusIcon: {
    fontSize: FontSizes.xs,
    marginRight: 4,
  },

  statusText: {
    fontSize: FontSizes.xs,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  activityPoints: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: 'bold',
  },

  // Modal Styles (similar to previous modals)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxHeight: '80%',
    ...Shadows.modal,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
  },

  closeButton: {
    padding: Spacing.sm,
  },

  closeButtonText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  modalBody: {
    padding: Spacing.lg,
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalActions: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  approveButton: {
    backgroundColor: Colors.success,
  },

  rejectButton: {
    backgroundColor: Colors.error,
  },

  deleteButton: {
    backgroundColor: Colors.mutedForeground,
  },

  actionButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },

  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
  },

  footerSpace: {
    height: Spacing.xl,
  },

  // Form Styles
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.foreground,
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    marginTop: 4,
  },

  roleOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  roleOptionSelected: {
    backgroundColor: Colors.primary,
  },

  roleOptionText: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '500',
  },

  roleOptionTextSelected: {
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  checkboxCheck: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },

  checkboxLabel: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '600',
    flex: 1,
  },

  cancelButton: {
    backgroundColor: Colors.mutedForeground,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },

  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginLeft: Spacing.sm,
  },

  disabledButton: {
    opacity: 0.5,
  },

  cancelButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  // Activity Card Action Styles
  activityCardActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-between',
  },

  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },

  deleteButton: {
    backgroundColor: Colors.error,
  },

  actionButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  deleteButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  // Feature Badge Styles
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },

  featureBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 2,
    minWidth: 24,
    alignItems: 'center',
  },

  onlineBadge: {
    backgroundColor: Colors.primary + '20',
  },

  photoBadge: {
    backgroundColor: Colors.secondary + '20',
  },

  submissionBadge: {
    backgroundColor: Colors.success + '20',
  },

  featureBadgeText: {
    fontSize: 10,
  },

  submissionStats: {
    marginTop: Spacing.xs,
    alignItems: 'flex-end',
  },

  submissionStatsText: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },

  activityCardMain: {
    flex: 1,
  },

  // Stats container styles
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginTop: 4,
  },

  // Add button styles
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  addButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  // Error container
  errorContainer: {
    marginBottom: Spacing.lg,
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
};

export default ActivityManagement;
