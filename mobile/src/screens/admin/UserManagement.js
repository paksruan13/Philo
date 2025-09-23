import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const UserManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  
  
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const roleDropdownAnimation = useRef(new Animated.Value(0)).current;
  const teamDropdownAnimation = useRef(new Animated.Value(0)).current;

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
        
        const usersWithDonations = (Array.isArray(data) ? data : data.users || []).map(user => ({
          ...user,
          donations: user.donations || []
        }));
        setUsers(usersWithDonations);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
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
      
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`${API_ROUTES.admin.coaches}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoaches(Array.isArray(data) ? data : data.coaches || []);
      } else {
        setCoaches([]);
      }
    } catch (error) {
      setCoaches([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchCoaches();
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
    
    
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
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
        
        setShowRoleDropdown(false);
        setShowTeamDropdown(false);
        roleDropdownAnimation.setValue(0);
        teamDropdownAnimation.setValue(0);
        
        
        setEditModalVisible(false);
        setEditingUser(null);
        modalAnimation.setValue(0);
        
        
        await fetchUsers();
        await fetchTeams();
        
        setError('');
        setSuccessMessage('User updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update user');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      
      setShowRoleDropdown(false);
      setShowTeamDropdown(false);
      
      updateUser(editingUser.id, {
        role: editingUser.role,
        teamId: editingUser.teamId || null,
        isActive: editingUser.isActive
      });
    }
  };

  const handleCloseModal = () => {
    
    setShowRoleDropdown(false);
    setShowTeamDropdown(false);
    roleDropdownAnimation.setValue(0);
    teamDropdownAnimation.setValue(0);
    
    
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setEditModalVisible(false);
    });
  };

  const toggleRoleDropdown = () => {
    const isOpen = showRoleDropdown;
    
    
    if (showTeamDropdown) {
      Animated.timing(teamDropdownAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowTeamDropdown(false);
      });
    }
    
    if (!isOpen) {
      setShowRoleDropdown(true);
      
      setTimeout(() => {
        Animated.timing(roleDropdownAnimation, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 16); 
    } else {
      Animated.timing(roleDropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowRoleDropdown(false);
      });
    }
  };

  const toggleTeamDropdown = () => {
    const isOpen = showTeamDropdown;
    
    
    if (showRoleDropdown) {
      Animated.timing(roleDropdownAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowRoleDropdown(false);
      });
    }
    
    if (!isOpen) {
      setShowTeamDropdown(true);
      
      setTimeout(() => {
        Animated.timing(teamDropdownAnimation, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 16); 
    } else {
      Animated.timing(teamDropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowTeamDropdown(false);
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
    const totalDonations = user.donations?.reduce((sum, donation) => sum + donation.amount, 0) || 0;

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Ionicons 
              name={user.role === 'ADMIN' ? 'shield-checkmark' : 'person'} 
              size={20} 
              color="#ffffff" 
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            <View style={styles.userMeta}>
              <Text style={[styles.userRole, { color: roleColor }]}>
                {user.role}
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.userTeam} numberOfLines={1}>
                {user.team ? `Team ${user.team.name}` : 'No Team'}
              </Text>
            </View>
            <View style={styles.donationInfo}>
              <Ionicons name="wallet-outline" size={14} color="#7c3aed" />
              <Text style={styles.donationText}>
                ${totalDonations.toFixed(2)} donated
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditUser(user)}
          >
            <Ionicons name="create-outline" size={20} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EditUserModal = () => {
    if (!editingUser) return null;

    const roles = ['STUDENT', 'COACH', 'STAFF', 'ADMIN'];
    const selectedRole = editingUser.role;
    const selectedTeam = teams.find(team => team.id === editingUser.teamId);

    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={handleCloseModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimation,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: modalAnimation,
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="person-circle-outline" size={28} color="#7c3aed" />
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Edit User</Text>
                  <Text style={styles.modalSubtitle}>Update user permissions and team assignment</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* User Info Display */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle-outline" size={20} color="#7c3aed" />
                  <Text style={styles.infoTitle}>User Information</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{editingUser.name}</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{editingUser.email}</Text>
                </View>
              </View>

              {/* Role Selection */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Role Assignment</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    showRoleDropdown && styles.dropdownButtonActive
                  ]}
                  onPress={toggleRoleDropdown}
                >
                  <View style={styles.dropdownButtonContent}>
                    <Ionicons name="shield-outline" size={18} color="#7c3aed" />
                    <Text style={styles.dropdownButtonText}>{selectedRole}</Text>
                  </View>
                  <Ionicons 
                    name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
                
                {showRoleDropdown && (
                  <Animated.View 
                    style={[
                      styles.dropdownMenu,
                      {
                        opacity: roleDropdownAnimation,
                        transform: [
                          {
                            translateY: roleDropdownAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            }),
                          },
                          {
                            scaleY: roleDropdownAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                        ],
                      }
                    ]}
                  >
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {roles.map((role, index) => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.dropdownItem,
                            selectedRole === role && styles.dropdownItemSelected,
                            index === roles.length - 1 && styles.dropdownItemLast
                          ]}
                          onPress={() => {
                            
                            const newUser = { ...editingUser, role };
                            setEditingUser(newUser);
                            
                            
                            setTimeout(() => {
                              Animated.timing(roleDropdownAnimation, {
                                toValue: 0,
                                duration: 200,
                                useNativeDriver: true,
                              }).start(() => {
                                setShowRoleDropdown(false);
                              });
                            }, 50);
                          }}
                        >
                          <Ionicons 
                            name={role === 'ADMIN' ? 'shield-checkmark' : role === 'COACH' ? 'megaphone' : role === 'STAFF' ? 'person-add' : 'school'} 
                            size={18} 
                            color={selectedRole === role ? "#ffffff" : "#7c3aed"} 
                          />
                          <Text style={[
                            styles.dropdownItemText,
                            selectedRole === role && styles.dropdownItemTextSelected
                          ]}>
                            {role}
                          </Text>
                          {selectedRole === role && (
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </View>

              {/* Team Selection */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Team Assignment</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    showTeamDropdown && styles.dropdownButtonActive
                  ]}
                  onPress={toggleTeamDropdown}
                >
                  <View style={styles.dropdownButtonContent}>
                    <Ionicons name="people-outline" size={18} color="#7c3aed" />
                    <Text style={styles.dropdownButtonText}>
                      {selectedTeam ? `${selectedTeam.name} (${selectedTeam.teamCode || selectedTeam.code})` : 'No Team'}
                    </Text>
                  </View>
                  <Ionicons 
                    name={showTeamDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>
                
                {showTeamDropdown && (
                  <Animated.View 
                    style={[
                      styles.dropdownMenu,
                      {
                        opacity: teamDropdownAnimation,
                        transform: [
                          {
                            translateY: teamDropdownAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-10, 0],
                            }),
                          },
                          {
                            scaleY: teamDropdownAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                        ],
                      }
                    ]}
                  >
                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          !editingUser.teamId && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          
                          const newUser = { ...editingUser, teamId: '' };
                          setEditingUser(newUser);
                          
                          
                          setTimeout(() => {
                            Animated.timing(teamDropdownAnimation, {
                              toValue: 0,
                              duration: 200,
                              useNativeDriver: true,
                            }).start(() => {
                              setShowTeamDropdown(false);
                            });
                          }, 50);
                        }}
                      >
                        <Ionicons name="remove-circle-outline" size={18} color={!editingUser.teamId ? "#ffffff" : "#6b7280"} />
                        <Text style={[
                          styles.dropdownItemText,
                          !editingUser.teamId && styles.dropdownItemTextSelected
                        ]}>
                          No Team
                        </Text>
                        {!editingUser.teamId && (
                          <Ionicons name="checkmark" size={18} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                      
                      {teams.map((team, index) => (
                        <TouchableOpacity
                          key={team.id}
                          style={[
                            styles.dropdownItem,
                            editingUser.teamId === team.id && styles.dropdownItemSelected,
                            index === teams.length - 1 && styles.dropdownItemLast
                          ]}
                          onPress={() => {
                            
                            const newUser = { ...editingUser, teamId: team.id };
                            setEditingUser(newUser);
                            
                            
                            setTimeout(() => {
                              Animated.timing(teamDropdownAnimation, {
                                toValue: 0,
                                duration: 200,
                                useNativeDriver: true,
                              }).start(() => {
                                setShowTeamDropdown(false);
                              });
                            }, 50);
                          }}
                        >
                          <Ionicons name="basketball-outline" size={18} color={editingUser.teamId === team.id ? "#ffffff" : "#7c3aed"} />
                          <Text style={[
                            styles.dropdownItemText,
                            editingUser.teamId === team.id && styles.dropdownItemTextSelected
                          ]}>
                            {team.name} ({team.teamCode || team.code})
                          </Text>
                          {editingUser.teamId === team.id && (
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </View>

              {/* Active Status */}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Account Status</Text>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setEditingUser({ ...editingUser, isActive: !editingUser.isActive })}
                >
                  <View style={styles.toggleContent}>
                    <Ionicons 
                      name={editingUser.isActive ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={editingUser.isActive ? "#16a34a" : "#dc2626"} 
                    />
                    <Text style={styles.toggleLabel}>Active User</Text>
                  </View>
                  <View style={[
                    styles.toggleSwitch,
                    editingUser.isActive && styles.toggleSwitchActive
                  ]}>
                    <View style={[
                      styles.toggleKnob,
                      editingUser.isActive && styles.toggleKnobActive
                    ]} />
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close-outline" size={18} color="#6b7280" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveUser}
              >
                <Ionicons name="checkmark-outline" size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  const filteredUsers = users.filter(user => 
    `${user.name} ${user.email}`.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Users List with Header */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header inside scroll */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>User Management</Text>
                <Text style={styles.subtitle}>Manage system users and permissions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name or email..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Users will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.usersSection}>
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
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
    backgroundColor: '#f8fafc',
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
    marginTop: Spacing.md,
  },

  headerContainer: {
    backgroundColor: '#ffffff',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  header: {
    paddingHorizontal: Spacing.lg,
  },

  backButton: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  headerContent: {
    marginBottom: Spacing.sm,
  },

  headerText: {
    marginBottom: 0,
  },

  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },

  subtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
  },

  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#ffffff',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: Spacing.md,
  },

  searchIcon: {
    marginRight: Spacing.sm,
  },

  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: '#1f2937',
  },

  scrollContainer: {
    flex: 1,
  },

  usersSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  errorContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },

  errorText: {
    color: '#dc2626',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  successContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: '#f0fdf4',
    borderColor: '#4ade80',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
  },

  successText: {
    color: '#16a34a',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  userInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  userName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },

  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  userRole: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  separator: {
    fontSize: FontSizes.sm,
    color: '#d1d5db',
    marginHorizontal: Spacing.xs,
  },

  userTeam: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
    flex: 1,
  },

  donationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  donationText: {
    fontSize: FontSizes.xs,
    color: '#7c3aed',
    fontWeight: '500',
    marginLeft: 4,
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },

  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  emptySubtext: {
    fontSize: FontSizes.sm,
    color: '#9ca3af',
    textAlign: 'center',
  },

  footerSpace: {
    height: Spacing.xl,
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },

  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modalHeaderText: {
    marginLeft: Spacing.md,
    flex: 1,
  },

  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },

  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBody: {
    padding: Spacing.lg,
    maxHeight: '70%',
  },

  
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  infoTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: Spacing.sm,
  },

  infoContent: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },

  infoLabel: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '600',
    width: 60,
  },

  infoValue: {
    fontSize: FontSizes.sm,
    color: '#1f2937',
    fontWeight: '400',
    flex: 1,
  },

  
  formSection: {
    marginBottom: Spacing.lg,
  },

  sectionLabel: {
    fontSize: FontSizes.sm,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: Spacing.lg,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  dropdownButtonActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf5ff',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.15,
  },

  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dropdownButtonText: {
    fontSize: FontSizes.base,
    color: '#1f2937',
    fontWeight: '600',
    marginLeft: Spacing.sm,
    flex: 1,
  },

  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    marginTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    maxHeight: 240,
    overflow: 'hidden',
  },

  dropdownScrollView: {
    maxHeight: 240,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },

  dropdownItemLast: {
    borderBottomWidth: 0,
  },

  dropdownItemSelected: {
    backgroundColor: '#7c3aed',
    borderBottomColor: '#7c3aed',
  },

  dropdownItemText: {
    fontSize: FontSizes.base,
    color: '#374151',
    fontWeight: '500',
    marginLeft: Spacing.sm,
    flex: 1,
  },

  dropdownItemTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },

  
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: Spacing.md,
  },

  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  toggleLabel: {
    fontSize: FontSizes.base,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },

  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  toggleSwitchActive: {
    backgroundColor: '#16a34a',
  },

  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },

  
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: Spacing.md,
  },

  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },

  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
  },

  cancelButtonText: {
    fontSize: FontSizes.base,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },

  saveButtonText: {
    fontSize: FontSizes.base,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
};

export default UserManagement;
