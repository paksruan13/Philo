import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';

// Modern Date Picker Component
const DatePickerDropdown = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "Select date and time",
  icon = "calendar",
  mode = "datetime" 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(selectedDate.toISOString());
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate.toISOString());
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange('');
    setShowPicker(false);
  };

  return (
    <View style={styles.datePickerContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      
      <TouchableOpacity
        style={[styles.datePickerButton, value && styles.datePickerButtonSelected]}
        onPress={() => setShowPicker(true)}
      >
        <View style={styles.datePickerButtonContent}>
          <Ionicons 
            name={icon} 
            size={18} 
            color={value ? "#7c3aed" : "#9ca3af"} 
            style={styles.datePickerIcon}
          />
          <Text style={[
            styles.datePickerText,
            value ? styles.datePickerTextSelected : styles.datePickerTextPlaceholder
          ]}>
            {value ? formatDateTime(value) : placeholder}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={16} 
            color={value ? "#7c3aed" : "#9ca3af"} 
          />
        </View>
      </TouchableOpacity>

      {value && (
        <TouchableOpacity
          style={styles.clearDateButton}
          onPress={handleClear}
        >
          <Text style={styles.clearDateText}>Clear</Text>
        </TouchableOpacity>
      )}

      {showPicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select {label}</Text>
                <TouchableOpacity 
                  onPress={() => setShowPicker(false)}
                  style={styles.datePickerCloseButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={styles.dateTimePicker}
              />
              
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={styles.datePickerCancelButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.datePickerConfirmButton}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.datePickerConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const ActivityManagement = ({ navigation }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4243'}/api/admin/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        setError('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Error fetching activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
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
          onPress: async () => {
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4243'}/api/activities/${activityId}`, {
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
          }
        }
      ]
    );
  };

  const ActivityCard = ({ activity }) => {
    const getStatusColor = () => {
      if (activity.isPublished) return '#10b981';
      return '#f59e0b';
    };

    const formatDate = (dateString) => {
      if (!dateString) return null;
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    };

    return (
      <TouchableOpacity 
        style={styles.activityCard}
        onPress={() => {
          setSelectedActivity(activity);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {activity.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>
                {activity.isPublished ? 'Published' : 'Draft'}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditingActivity(activity)}
            >
              <Ionicons name="pencil" size={16} color="#7c3aed" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
              onPress={() => deleteActivity(activity.id)}
            >
              <Ionicons name="trash" size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {activity.description || 'No description provided'}
        </Text>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="trophy" size={14} color="#f59e0b" />
            <Text style={styles.detailText}>{activity.points} pts</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="pricetag" size={14} color="#6b7280" />
            <Text style={styles.detailText}>{activity.categoryType}</Text>
          </View>
        </View>

        {(activity.startDate || activity.endDate) && (
          <View style={styles.scheduleSection}>
            {activity.startDate && (
              <View style={styles.scheduleRow}>
                <Ionicons name="play" size={12} color="#10b981" />
                <Text style={styles.scheduleText}>Start: {formatDate(activity.startDate)}</Text>
              </View>
            )}
            {activity.endDate && (
              <View style={styles.scheduleRow}>
                <Ionicons name="stop" size={12} color="#dc2626" />
                <Text style={styles.scheduleText}>End: {formatDate(activity.endDate)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.featuresSection}>
          {activity.allowOnlinePurchase && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>🌐 Online</Text>
            </View>
          )}
          {activity.allowPhotoUpload && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>📸 Photo</Text>
            </View>
          )}
          {activity.allowSubmission && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>✍️ Submit</Text>
            </View>
          )}
        </View>

        <View style={styles.submissionStats}>
          <Text style={styles.submissionText}>
            <Text style={{ color: '#10b981' }}>{activity.approvedCount || 0} ✓</Text>
            {' • '}
            <Text style={{ color: '#f59e0b' }}>{activity.pendingCount || 0} ⏳</Text>
            {' • '}
            <Text style={{ color: '#6b7280' }}>{activity.submissionCount || 0} total</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={32} color="#7c3aed" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#7c3aed" />
            </TouchableOpacity>
            <Ionicons name="flash" size={24} color="#7c3aed" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
                Activity Management
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1} adjustsFontSizeToFit>
                Create and manage activities
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={styles.createButtonText} numberOfLines={1} adjustsFontSizeToFit>
              Create
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError('');
              fetchActivities();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Activities List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.activitiesContainer}>
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flash-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No activities yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first activity to get started
              </Text>
            </View>
          ) : (
            activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        visible={showDetailModal && selectedActivity !== null}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedActivity(null);
        }}
      />

      {/* Create/Edit Activity Modal */}
      <ActivityForm
        activity={editingActivity}
        visible={showCreateForm || editingActivity !== null}
        onClose={() => {
          setShowCreateForm(false);
          setEditingActivity(null);
        }}
        onSave={() => {
          fetchActivities();
          setShowCreateForm(false);
          setEditingActivity(null);
        }}
        token={token}
      />
    </SafeAreaView>
  );
};

// Activity Categories - matching web app
const ACTIVITY_CATEGORIES = [
  { value: 'PHOTO', label: 'Photo' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'DONATION', label: 'Donation' },
  { value: 'OTHER', label: 'Other' },
];

// Activity Detail Modal Component
const ActivityDetailModal = ({ activity, visible, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!activity) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="flash" size={24} color="#7c3aed" />
              <Text style={styles.modalTitle}>Activity Details</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>
                  {activity.description || 'No description provided'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Points & Category</Text>
                <Text style={styles.infoValue}>{activity.points} points</Text>
                <Text style={styles.infoSubValue}>{activity.categoryType}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Schedule</Text>
                <Text style={styles.infoValue}>
                  Start: {formatDate(activity.startDate)}
                </Text>
                <Text style={styles.infoSubValue}>
                  End: {formatDate(activity.endDate)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Status & Features</Text>
                <Text style={styles.infoValue}>
                  {activity.isPublished ? 'Published' : 'Draft'}
                </Text>
                <View style={styles.featuresGrid}>
                  {activity.allowOnlinePurchase && (
                    <Text style={styles.featureItem}>🌐 Online Purchase</Text>
                  )}
                  {activity.allowPhotoUpload && (
                    <Text style={styles.featureItem}>📸 Photo Upload</Text>
                  )}
                  {activity.allowSubmission && (
                    <Text style={styles.featureItem}>✍️ Submissions</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Submission Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemNumber}>{activity.approvedCount || 0}</Text>
                    <Text style={styles.statItemLabel}>Approved</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemNumber}>{activity.pendingCount || 0}</Text>
                    <Text style={styles.statItemLabel}>Pending</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemNumber}>{activity.submissionCount || 0}</Text>
                    <Text style={styles.statItemLabel}>Total</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Activity Form Component - matching web app fields
const ActivityForm = ({ activity, visible, onClose, onSave, token }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 100,
    categoryType: 'OTHER',
    isPublished: false,
    allowOnlinePurchase: false,
    allowPhotoUpload: false,
    allowSubmission: false,
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        points: activity.points || 100,
        categoryType: activity.categoryType || 'OTHER',
        isPublished: activity.isPublished || false,
        allowOnlinePurchase: activity.allowOnlinePurchase || false,
        allowPhotoUpload: activity.allowPhotoUpload || false,
        allowSubmission: activity.allowSubmission || false,
        startDate: activity.startDate || '',
        endDate: activity.endDate || ''
      });
    } else {
      // Reset form for new activity
      setFormData({
        title: '',
        description: '',
        points: 100,
        categoryType: 'OTHER',
        isPublished: false,
        allowOnlinePurchase: false,
        allowPhotoUpload: false,
        allowSubmission: false,
        startDate: '',
        endDate: ''
      });
    }
    // Clear any previous errors when activity changes
    setError('');
  }, [activity]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('Description is required');
        setLoading(false);
        return;
      }

      // Validate date range
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
          setError('End date must be after start date');
          setLoading(false);
          return;
        }
      }

      const url = activity
        ? `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4243'}/api/admin/activities/${activity.id}`
        : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4243'}/api/admin/activities`;

      const method = activity ? 'PUT' : 'POST';

      // Prepare form data with proper date formatting
      const submitData = {
        ...formData,
        points: parseInt(formData.points),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          `Activity ${activity ? 'updated' : 'created'} successfully!`
        );
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
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.formModalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="flash" size={24} color="#7c3aed" />
              <Text style={styles.modalTitle}>
                {activity ? 'Edit Activity' : 'Create Activity'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.formErrorContainer}>
              <Text style={styles.formErrorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.formBody}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter activity title"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter activity description"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Points and Category */}
              <View style={styles.rowContainer}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Points *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.points.toString()}
                    onChangeText={(text) => setFormData({ ...formData, points: parseInt(text) || 0 })}
                    placeholder="100"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerValue}>{formData.categoryType}</Text>
                    {/* Note: In a real implementation, you'd use a proper picker/dropdown */}
                  </View>
                </View>
              </View>

              {/* Start Date & Time */}
              <DatePickerDropdown
                label="Start Date & Time"
                value={formData.startDate}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
                placeholder="Select start date and time"
                icon="play-circle"
              />

              {/* End Date & Time */}
              <DatePickerDropdown
                label="End Date & Time"
                value={formData.endDate}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
                placeholder="Select end date and time"
                icon="stop-circle"
              />

              {/* Publish Status */}
              <View style={styles.switchGroup}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Make Visible Now!</Text>
                  <Text style={styles.switchHelper}>Publish this activity immediately</Text>
                </View>
                <Switch
                  value={formData.isPublished}
                  onValueChange={(value) => setFormData({ ...formData, isPublished: value })}
                  trackColor={{ false: '#d1d5db', true: '#7c3aed' }}
                  thumbColor={formData.isPublished ? '#ffffff' : '#ffffff'}
                />
              </View>

              {/* Online Purchase (conditional) */}
              {isPurchaseOrDonation && (
                <View style={styles.switchGroup}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>
                      Allow Online {formData.categoryType === 'PURCHASE' ? 'Purchase' : 'Donation'}
                    </Text>
                    <Text style={styles.switchHelper}>Shows online button to students</Text>
                  </View>
                  <Switch
                    value={formData.allowOnlinePurchase}
                    onValueChange={(value) => setFormData({ ...formData, allowOnlinePurchase: value })}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor={formData.allowOnlinePurchase ? '#ffffff' : '#ffffff'}
                  />
                </View>
              )}

              {/* Photo Upload */}
              <View style={styles.switchGroup}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Allow Photo Upload</Text>
                  <Text style={styles.switchHelper}>Shows upload button to students</Text>
                </View>
                <Switch
                  value={formData.allowPhotoUpload}
                  onValueChange={(value) => setFormData({ ...formData, allowPhotoUpload: value })}
                  trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                  thumbColor={formData.allowPhotoUpload ? '#ffffff' : '#ffffff'}
                />
              </View>

              {/* Submissions */}
              <View style={styles.switchGroup}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Allow Student Submission</Text>
                  <Text style={styles.switchHelper}>Enables submission forms and buttons</Text>
                </View>
                <Switch
                  value={formData.allowSubmission}
                  onValueChange={(value) => setFormData({ ...formData, allowSubmission: value })}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={formData.allowSubmission ? '#ffffff' : '#ffffff'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : (activity ? 'Update' : 'Create')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header Styles
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },

  backButton: {
    marginRight: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginTop: 2,
  },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    justifyContent: 'center',
  },

  createButtonText: {
    color: 'white',
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 14,
  },

  // Activity Card Styles
  scrollView: {
    flex: 1,
  },

  activitiesContainer: {
    padding: 16,
    paddingTop: 0,
  },

  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },

  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },

  scheduleSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  scheduleText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },

  featuresSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },

  featureBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  featureText: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '600',
  },

  submissionStats: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },

  submissionText: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Loading & Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },

  errorContainer: {
    backgroundColor: '#fee2e2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },

  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  retryButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    maxWidth: 500,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  formModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    height: '90%',
    maxWidth: 500,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    display: 'flex',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalScrollView: {
    flex: 1,
  },

  modalBody: {
    padding: 20,
  },

  activityTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  infoSubValue: {
    fontSize: 14,
    color: '#6b7280',
  },

  featuresGrid: {
    marginTop: 8,
  },

  featureItem: {
    fontSize: 14,
    color: '#7c3aed',
    marginBottom: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  statItem: {
    alignItems: 'center',
  },

  statItemNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  statItemLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  // Form Styles
  formScrollView: {
    flex: 1,
    backgroundColor: 'white',
  },

  formBody: {
    padding: 20,
    minHeight: 200,
  },

  formErrorContainer: {
    backgroundColor: '#fee2e2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  formErrorText: {
    color: '#dc2626',
    fontSize: 14,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  inputHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  rowContainer: {
    flexDirection: 'row',
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },

  pickerValue: {
    fontSize: 16,
    color: '#111827',
  },

  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  switchInfo: {
    flex: 1,
    marginRight: 16,
  },

  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  switchHelper: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  formActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },

  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Date Picker Dropdown Styles
  datePickerContainer: {
    marginBottom: 16,
  },

  datePickerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },

  datePickerButtonSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf7ff',
  },

  datePickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  datePickerIcon: {
    marginRight: 12,
  },

  datePickerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },

  datePickerTextSelected: {
    color: '#111827',
    fontWeight: '500',
  },

  datePickerTextPlaceholder: {
    color: '#9ca3af',
  },

  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },

  clearDateText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  datePickerModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  datePickerCloseButton: {
    padding: 4,
  },

  dateTimePicker: {
    margin: 20,
  },

  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },

  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },

  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },

  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    alignItems: 'center',
  },

  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default ActivityManagement;