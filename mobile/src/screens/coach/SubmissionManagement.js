import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';
import { API_ROUTES, fetchWithTimeout } from '../../services/api';

const SubmissionManagement = ({ navigation }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setError('');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch pending submissions
      console.log('📝 Fetching pending submissions from:', API_ROUTES.coach.pendingSubmissions);
      const pendingResponse = await fetchWithTimeout(API_ROUTES.coach.pendingSubmissions, { headers }, 15000);
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingSubmissions(pendingData || []);
      } else {
        setError('Failed to load pending submissions');
      }

      // Fetch approved submissions
      try {
        console.log('✅ Fetching approved submissions from:', API_ROUTES.coach.approvedSubmissions);
        const approvedResponse = await fetchWithTimeout(API_ROUTES.coach.approvedSubmissions, { headers }, 15000);
        if (approvedResponse.ok) {
          const approvedData = await approvedResponse.json();
          setApprovedSubmissions(approvedData || []);
        }
      } catch (approvedError) {
        console.log('Approved submissions endpoint not available yet');
        setApprovedSubmissions([]);
      }
      
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubmissions();
  };

  const handleApproveSubmission = async (submissionId, points) => {
    try {
      setLoading(true);
      console.log('✅ Approving submission:', submissionId, 'with points:', points);
      const response = await fetchWithTimeout(API_ROUTES.coach.approveSubmission(submissionId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pointsAwarded: points,
          reviewNotes: 'Approved by coach'
        }),
      }, 15000);

      if (response.ok) {
        Alert.alert('Success', 'Submission approved successfully!');
        fetchSubmissions(); // Refresh the list
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to approve submission');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmission = async (submissionId, reason) => {
    try {
      setLoading(true);
      console.log('❌ Rejecting submission:', submissionId, 'reason:', reason);
      const response = await fetchWithTimeout(API_ROUTES.coach.rejectSubmission(submissionId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes: reason
        }),
      }, 15000);

      if (response.ok) {
        Alert.alert('Success', 'Submission rejected successfully!');
        fetchSubmissions(); // Refresh the list
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedSubmission(null);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnapproveSubmission = async (submissionId) => {
    Alert.alert(
      'Unapprove Submission',
      'Are you sure you want to unapprove this submission? This will remove the awarded points.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unapprove', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('↩️ Unapproving submission:', submissionId);
              const response = await fetchWithTimeout(API_ROUTES.coach.unapproveSubmission(submissionId), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  reviewNotes: 'Unapproved by coach'
                }),
              }, 15000);

              if (response.ok) {
                Alert.alert('Success', 'Submission unapproved successfully!');
                fetchSubmissions();
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to unapprove submission');
              }
            } catch (error) {
              console.error('Error unapproving submission:', error);
              Alert.alert('Error', 'Network error occurred');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteSubmission = async (submissionId) => {
    Alert.alert(
      'Delete Submission',
      'Are you sure you want to permanently delete this submission? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await fetchWithTimeout(`${API_ROUTES.coach.deleteSubmission(submissionId)}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              Alert.alert('Success', 'Submission deleted successfully');
              fetchSubmissions(); // Refresh the list
            } catch (error) {
              console.error('Error deleting submission:', error);
              Alert.alert('Error', 'Failed to delete submission');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const confirmApproval = (submission) => {
    Alert.alert(
      'Approve Submission',
      `Approve "${submission.activity?.title}" for ${submission.activity?.points || 0} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => handleApproveSubmission(submission.id, submission.activity?.points || 0)
        }
      ]
    );
  };

  const confirmRejection = (submission) => {
    setSelectedSubmission(submission);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      </View>
    );
  }

  const renderSubmissionCard = (submission, isApproved = false) => (
    <View key={submission.id} style={styles.submissionCard}>
      {/* Submission Info */}
      <View style={styles.submissionHeader}>
        <View style={styles.submissionInfo}>
          <Text style={styles.activityTitle}>{submission.activity?.title || 'Unknown Activity'}</Text>
          <Text style={styles.submissionUser}>
            {isApproved ? 'Approved: ' : 'Submitted by: '}{submission.user?.name || 'Unknown User'}
          </Text>
          <Text style={styles.submissionDate}>
            {isApproved ? 
              `Approved: ${new Date(submission.updatedAt).toLocaleDateString()}` :
              `${new Date(submission.createdAt).toLocaleDateString()} • ${new Date(submission.createdAt).toLocaleTimeString()}`
            }
          </Text>
        </View>
        <View style={[styles.pointsBadge, isApproved && styles.approvedBadge]}>
          <Text style={styles.pointsText}>{submission.activity?.points || 0} pts</Text>
        </View>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, isApproved ? styles.approvedStatus : styles.pendingStatus]}>
        <Text style={[styles.statusText, isApproved ? styles.approvedStatusText : styles.pendingStatusText]}>
          {isApproved ? '✅ APPROVED' : '⏳ PENDING'}
        </Text>
      </View>

      {/* Submission Details */}
      {submission.description && (
        <View style={styles.submissionDetails}>
          <Text style={styles.detailsLabel}>Description:</Text>
          <Text style={styles.detailsText}>{submission.description}</Text>
        </View>
      )}

      {/* Action Buttons */}
      {!isApproved ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => confirmApproval(submission)}
            disabled={loading}
          >
            <Text style={styles.approveButtonText}>✓ Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => confirmRejection(submission)}
            disabled={loading}
          >
            <Text style={styles.rejectButtonText}>✗ Reject</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.unapproveButton}
            onPress={() => handleUnapproveSubmission(submission.id)}
            disabled={loading}
          >
            <Text style={styles.unapproveButtonText}>↶ Unapprove</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteSubmission(submission.id)}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeTab === 'pending' ? pendingSubmissions : approvedSubmissions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderSubmissionCard(item, activeTab === 'approved')}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Submission Management</Text>
            </View>

            {/* Error Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Summary Stats */}
            <View style={styles.section}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>{pendingSubmissions.length}</Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>{approvedSubmissions.length}</Text>
                  <Text style={styles.summaryLabel}>Approved</Text>
                </View>
              </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                onPress={() => setActiveTab('pending')}
              >
                <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                  Pending ({pendingSubmissions.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
                onPress={() => setActiveTab('approved')}
              >
                <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
                  Approved ({approvedSubmissions.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'pending' ? 'No Pending Submissions' : 'No Approved Submissions'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'pending' ? 
                'All submissions have been reviewed or no submissions have been made yet.' :
                'No submissions have been approved yet.'
              }
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reject Submission</Text>
            <Text style={styles.modalSubtitle}>
              {selectedSubmission?.activity?.title} by {selectedSubmission?.user?.name}
            </Text>
            
            <Text style={styles.inputLabel}>Reason for rejection:</Text>
            <TextInput
              style={styles.textInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Enter reason for rejection..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedSubmission(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmRejectButton}
                onPress={() => handleRejectSubmission(selectedSubmission?.id, rejectReason)}
                disabled={!rejectReason.trim() || loading}
              >
                <Text style={styles.confirmRejectButtonText}>
                  {loading ? 'Rejecting...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
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
  errorContainer: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.md,
    backgroundColor: Colors.destructive,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    ...Shadows.sm,
  },
  summaryNumber: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.muted,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.card,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  activeTabText: {
    color: Colors.foreground,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  submissionCard: {
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  submissionInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  submissionUser: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  submissionDate: {
    fontSize: FontSizes.xs,
    color: Colors.mutedForeground,
  },
  pointsBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  approvedBadge: {
    backgroundColor: '#22c55e',
  },
  pointsText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
  },
  approvedStatus: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  pendingStatusText: {
    color: '#92400e',
  },
  approvedStatusText: {
    color: '#065f46',
  },
  submissionDetails: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  detailsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  detailsText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: Colors.destructive,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  unapproveButton: {
    backgroundColor: '#f59e0b',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flex: 1,
  },
  unapproveButtonText: {
    color: '#ffffff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: Colors.destructive,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flex: 1,
  },
  deleteButtonText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    backgroundColor: Colors.background,
    minHeight: 100,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.muted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.mutedForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  confirmRejectButton: {
    flex: 1,
    backgroundColor: Colors.destructive,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmRejectButtonText: {
    color: Colors.destructiveForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
};

export default SubmissionManagement;
