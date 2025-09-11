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

const UserManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_ROUTES.admin.users}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_ROUTES.admin.teams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      teamId: user.teamId || ''
    });
    setEditModalVisible(true);
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await fetch(`${API_ROUTES.admin.users}/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        await fetchTeams();
        setEditingUser(null);
        setEditModalVisible(false);
        setError('');
        setSuccessMessage('User updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      updateUser(editingUser.id, {
        role: editingUser.role,
        teamId: editingUser.teamId || null,
        isActive: editingUser.isActive
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return Colors.error;
      case 'STAFF': return Colors.warning;
      case 'COACH': return Colors.primary;
      case 'STUDENT': return Colors.success;
      default: return Colors.mutedForeground;
    }
  };

  const UserCard = ({ user }) => {
    const roleColor = getRoleColor(user.role);

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.name}
            </Text>
            <View style={styles.userMeta}>
              <Text style={[styles.userRole, { color: roleColor }]}>
                {user.role}
              </Text>
              <Text style={styles.userTeam}>
                {user.team ? `Team ${user.team.name}` : 'No Team'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditUser(user)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EditUserModal = () => {
    if (!editingUser) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* User Info Display */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>User</Text>
                <Text style={styles.detailValue}>
                  {editingUser.name} ({editingUser.email})
                </Text>
              </View>

              {/* Role Selection */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Role</Text>
                <View style={styles.pickerContainer}>
                  {['STUDENT', 'COACH', 'STAFF', 'ADMIN'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        editingUser.role === role && styles.roleOptionSelected
                      ]}
                      onPress={() => setEditingUser({ ...editingUser, role })}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        editingUser.role === role && styles.roleOptionTextSelected
                      ]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Team Selection */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Team</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={[
                      styles.teamOption,
                      !editingUser.teamId && styles.teamOptionSelected
                    ]}
                    onPress={() => setEditingUser({ ...editingUser, teamId: '' })}
                  >
                    <Text style={[
                      styles.teamOptionText,
                      !editingUser.teamId && styles.teamOptionTextSelected
                    ]}>
                      No Team
                    </Text>
                  </TouchableOpacity>
                  
                  {teams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      style={[
                        styles.teamOption,
                        editingUser.teamId === team.id && styles.teamOptionSelected
                      ]}
                      onPress={() => setEditingUser({ ...editingUser, teamId: team.id })}
                    >
                      <Text style={[
                        styles.teamOptionText,
                        editingUser.teamId === team.id && styles.teamOptionTextSelected
                      ]}>
                        {team.name} ({team.code || team.teamCode})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Active Status */}
              <View style={styles.detailSection}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setEditingUser({ ...editingUser, isActive: !editingUser.isActive })}
                >
                  <View style={[
                    styles.checkbox,
                    editingUser.isActive && styles.checkboxChecked
                  ]}>
                    {editingUser.isActive && (
                      <Text style={styles.checkboxCheck}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Active User</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveUser}
              >
                <Text style={styles.actionButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management 👥</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Error/Success Messages */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter(u => u.isActive !== false).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter(u => u.role === 'ADMIN').length}
            </Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter(u => u.role === 'COACH').length}
            </Text>
            <Text style={styles.statLabel}>Coaches</Text>
          </View>
        </View>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>

      <EditUserModal />
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
    width: 40, // Balance the back button width
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

  userCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },

  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000', // Pure black for maximum visibility
    marginBottom: 4,
    textAlign: 'left',
  },

  userMeta: {
    flexDirection: 'column',
  },

  userRole: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },

  userTeam: {
    fontSize: 14,
    color: '#333333', // Darker gray for better visibility
    textAlign: 'left',
  },

  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  editButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  // Modal Styles
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

  teamOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  teamOptionSelected: {
    backgroundColor: Colors.primary,
  },

  teamOptionText: {
    fontSize: FontSizes.base,
    color: Colors.foreground,
    fontWeight: '500',
  },

  teamOptionTextSelected: {
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  },

  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-between',
  },

  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.sm,
  },

  cancelButton: {
    backgroundColor: Colors.mutedForeground,
  },

  saveButton: {
    backgroundColor: Colors.primary,
  },

  cancelButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
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
};

export default UserManagement;
