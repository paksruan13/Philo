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
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { API_ROUTES } from '../../services/api';
import { Colors, Styles, Spacing, FontSizes, BorderRadius, Shadows } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const TeamManagement = ({ navigation }) => {
  const { token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', coachId: '', groupMeLink: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateCoachDropdown, setShowCreateCoachDropdown] = useState(false);
  const [showEditCoachDropdown, setShowEditCoachDropdown] = useState(false);
  const [editModalOpacity] = useState(new Animated.Value(0));

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
      } else {
        setError('Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`${API_ROUTES.users.coaches}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoaches(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch coaches, continuing without coach data');
        setCoaches([]);
      }
    } catch (error) {
      console.warn('Error fetching coaches, continuing without coach data:', error);
      setCoaches([]);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchCoaches();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };

  const handleTeamAction = (team, action) => {
    setSelectedTeam(team);
    Alert.alert(
      `${action} Team`,
      `Are you sure you want to ${action.toLowerCase()} ${team.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: action === 'Delete' ? 'destructive' : 'default',
          onPress: () => performTeamAction(team, action)
        }
      ]
    );
  };

  const performTeamAction = async (team, action) => {
    try {
      let endpoint = '';
      let method = 'PUT';

      switch (action) {
        case 'Activate':
          endpoint = `${API_ROUTES.admin.teams}/${team.id}/activate`;
          break;
        case 'Deactivate':
          endpoint = `${API_ROUTES.admin.teams}/${team.id}/deactivate`;
          break;
        case 'Delete':
          endpoint = `${API_ROUTES.admin.teams}/${team.id}`;
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
      });

      if (response.ok) {
        Alert.alert('Success', `Team ${action.toLowerCase()}d successfully`);
        fetchTeams();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || `Failed to ${action.toLowerCase()} team`);
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing team:`, error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const createTeam = async () => {
    try {
      const response = await fetch(`${API_ROUTES.teams.create}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeam.name,
          coachId: newTeam.coachId || null,
          groupMeLink: newTeam.groupMeLink || null
        })
      });

      if (response.ok) {
        await fetchTeams();
        setCreateModalVisible(false);
        setNewTeam({ name: '', coachId: '', groupMeLink: '' });
        setShowCreateCoachDropdown(false);
        setError('');
        setSuccessMessage('Team created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create team');
      }
    } catch (error) {
      setError('Error creating team');
      console.error('Error:', error);
    }
  };

  const handleResetPoints = async (team) => {
    Alert.alert(
      'Reset Points',
      `Are you sure you want to reset ${team.name}'s points to 0?\n\nThis will:\n- Set total points to 0\n- Clear all manual points awards\n- Keep donations and activity points\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Points', 
          style: 'destructive',
          onPress: () => performResetPoints(team)
        }
      ]
    );
  };

  const performResetPoints = async (team) => {
    try {
      const response = await fetch(`${API_ROUTES.teams.resetPoints(team.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        Alert.alert('Success', `${team.name}'s points have been reset successfully!`);
        await fetchTeams();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reset points');
      }
    } catch (error) {
      setError('Error resetting points');
      console.error('Error:', error);
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam({
      ...team,
      coachId: team.coachId || '',
      groupMeLink: team.groupMeLink || ''
    });
    setEditModalVisible(true);
    
    // Fade in animation
    Animated.timing(editModalOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeEditModal = () => {
    Animated.timing(editModalOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setEditModalVisible(false);
      setShowEditCoachDropdown(false);
      setEditingTeam(null);
    });
  };

  const updateTeam = async () => {
    try {
      const response = await fetch(`${API_ROUTES.teams.adminDetail(editingTeam.id)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTeam.name,
          coachId: editingTeam.coachId || null,
          groupMeLink: editingTeam.groupMeLink || null,
          isActive: editingTeam.isActive
        })
      });

      if (response.ok) {
        await fetchTeams();
        closeEditModal();
        setError('');
        setSuccessMessage('Team updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update team');
      }
    } catch (error) {
      setError('Error updating team');
      console.error('Error:', error);
    }
  };

  const TeamCard = ({ team }) => {
    const isActive = team.isActive !== false;
    
    // Try multiple ways to get member count
    const memberCount = team.members?.length || team._count?.members || 0;
    
    // Try multiple ways to get donation total
    let totalDonations = 0;
    if (team.stats?.totalDonations) {
      totalDonations = team.stats.totalDonations;
    } else if (team.donations && Array.isArray(team.donations)) {
      totalDonations = team.donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    } else {
      totalDonations = 0;
    }

    return (
      <View style={styles.teamCard}>
        <TouchableOpacity 
          style={styles.teamCardMain}
          onPress={() => {
            setSelectedTeam(team);
            setModalVisible(true);
          }}
        >
          <View style={styles.teamHeader}>
            <View style={styles.teamAvatar}>
              <Ionicons 
                name="basketball" 
                size={20} 
                color="#ffffff" 
              />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
              <View style={styles.teamMeta}>
                <Text style={styles.teamCode}>Code: {team.teamCode || team.code || 'N/A'}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.teamMembers}>{memberCount} members</Text>
              </View>
              <View style={styles.donationInfo}>
                <Ionicons name="wallet-outline" size={14} color="#7c3aed" />
                <Text style={styles.donationText}>
                  ${totalDonations.toFixed(2)} raised
                </Text>
              </View>
            </View>
            <View style={styles.teamActions}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? '#10b981' : '#6b7280' }
              ]}>
                <Text style={styles.statusText}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {team.rank && (
                <Text style={styles.teamRank}>#{team.rank}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.teamCardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditTeam(team)}
          >
            <Ionicons name="create-outline" size={16} color="#7c3aed" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]}
            onPress={() => handleResetPoints(team)}
          >
            <Ionicons name="refresh-outline" size={16} color="#ffffff" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TeamDetailModal = () => {
    if (!selectedTeam) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="basketball-outline" size={28} color="#f59e0b" />
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Team Details</Text>
                  <Text style={styles.modalSubtitle}>View team information and statistics</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Team Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle-outline" size={20} color="#f59e0b" />
                  <Text style={styles.infoTitle}>Team Information</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{selectedTeam.name}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Code:</Text>
                    <Text style={styles.infoValue}>{selectedTeam.teamCode || selectedTeam.code || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Members:</Text>
                    <Text style={styles.infoValue}>{selectedTeam.members?.length || 0}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Donations:</Text>
                    <Text style={styles.infoValue}>${(selectedTeam.stats?.totalDonations || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Rank:</Text>
                    <Text style={styles.infoValue}>#{selectedTeam.rank || 'Unranked'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoValue, { 
                      color: selectedTeam.isActive !== false ? '#10b981' : '#dc2626',
                      fontWeight: '600'
                    }]}>
                      {selectedTeam.isActive !== false ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Coach Info */}
              {selectedTeam.coach && (
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="person-outline" size={20} color="#7c3aed" />
                    <Text style={styles.infoTitle}>Coach Information</Text>
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>{selectedTeam.coach.name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{selectedTeam.coach.email}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Team Members */}
              {selectedTeam.members && selectedTeam.members.length > 0 && (
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="people-outline" size={20} color="#059669" />
                    <Text style={styles.infoTitle}>Team Members</Text>
                  </View>
                  <View style={styles.membersList}>
                    {selectedTeam.members.map((member, index) => (
                      <View key={index} style={styles.memberCard}>
                        <View style={styles.memberAvatar}>
                          <Ionicons 
                            name={member.role === 'COACH' ? 'whistle' : 'person'} 
                            size={16} 
                            color="#ffffff" 
                          />
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name || `${member.firstName} ${member.lastName}`}</Text>
                          <Text style={styles.memberRole}>{member.role}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Created Date */}
              <View style={styles.timestampCard}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.timestampText}>
                  Created: {selectedTeam.createdAt ? new Date(selectedTeam.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setModalVisible(false);
                  handleEditTeam(selectedTeam);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#7c3aed" />
                <Text style={styles.editButtonText}>Edit Team</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.activateButton}
                onPress={() => {
                  setModalVisible(false);
                  handleTeamAction(selectedTeam, selectedTeam.isActive ? 'Deactivate' : 'Activate');
                }}
              >
                <Ionicons 
                  name={selectedTeam.isActive ? "pause-outline" : "play-outline"} 
                  size={18} 
                  color="#ffffff" 
                />
                <Text style={styles.activateButtonText}>
                  {selectedTeam.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredTeams = teams.filter(team => 
    team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Success/Error Messages */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Teams List with Header */}
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
                <Text style={styles.greeting}>Team Management</Text>
                <Text style={styles.subtitle}>Manage teams and assignments</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teams by name or code..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        {filteredTeams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No teams found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Teams will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.teamsSection}>
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </View>
        )}
        
        <View style={styles.footerSpace} />
      </ScrollView>

      <TeamDetailModal />
      
      {/* Create Team Modal */}
      {createModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={createModalVisible}
          onRequestClose={() => {
            setCreateModalVisible(false);
            setShowCreateCoachDropdown(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <Ionicons name="add-circle-outline" size={28} color="#10b981" />
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>Create New Team</Text>
                    <Text style={styles.modalSubtitle}>Add a new team to the system</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => {
                    setCreateModalVisible(false);
                    setShowCreateCoachDropdown(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Success/Error Messages */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {successMessage && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
                
                {/* Team Name */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Team Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTeam.name}
                    onChangeText={(text) => setNewTeam({...newTeam, name: text})}
                    placeholder="Enter team name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Coach Assignment */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Assign Coach (Optional)</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowCreateCoachDropdown(!showCreateCoachDropdown)}
                  >
                    <View style={styles.dropdownButtonContent}>
                      <Ionicons name="person-outline" size={18} color="#7c3aed" />
                      <Text style={styles.dropdownButtonText}>
                        {newTeam.coachId ? 
                          coaches.find(c => c.id === newTeam.coachId)?.name || 'Selected Coach' : 
                          'No Coach Assigned'
                        }
                      </Text>
                    </View>
                    <Ionicons 
                      name={showCreateCoachDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                  
                  {showCreateCoachDropdown && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          !newTeam.coachId && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setNewTeam({...newTeam, coachId: ''});
                          setShowCreateCoachDropdown(false);
                        }}
                      >
                        <Ionicons name="remove-circle-outline" size={18} color={!newTeam.coachId ? "#ffffff" : "#6b7280"} />
                        <Text style={[
                          styles.dropdownItemText,
                          !newTeam.coachId && styles.dropdownItemTextSelected
                        ]}>
                          No Coach
                        </Text>
                        {!newTeam.coachId && (
                          <Ionicons name="checkmark" size={18} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                      
                      {coaches.map((coach) => (
                        <TouchableOpacity
                          key={coach.id}
                          style={[
                            styles.dropdownItem,
                            newTeam.coachId === coach.id && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setNewTeam({...newTeam, coachId: coach.id});
                            setShowCreateCoachDropdown(false);
                          }}
                        >
                          <Ionicons name="person" size={18} color={newTeam.coachId === coach.id ? "#ffffff" : "#7c3aed"} />
                          <Text style={[
                            styles.dropdownItemText,
                            newTeam.coachId === coach.id && styles.dropdownItemTextSelected
                          ]}>
                            {coach.name} ({coach.email})
                          </Text>
                          {newTeam.coachId === coach.id && (
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* GroupMe Link */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>GroupMe Invite Link (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTeam.groupMeLink}
                    onChangeText={(text) => setNewTeam({...newTeam, groupMeLink: text})}
                    placeholder="https://groupme.com/join_group/..."
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <View style={styles.infoContainer}>
                    <Ionicons name="chatbubbles-outline" size={16} color="#0ea5e9" />
                    <Text style={styles.infoText}>
                      Enter the GroupMe group invite link for team chat
                    </Text>
                  </View>
                </View>

                {/* Info Message */}
                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle-outline" size={20} color="#7c3aed" />
                  <Text style={styles.infoText}>
                    A unique team code will be automatically generated for registration.
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setCreateModalVisible(false);
                    setNewTeam({ name: '', coachId: '', groupMeLink: '' });
                    setShowCreateCoachDropdown(false);
                  }}
                >
                  <Ionicons name="close-outline" size={18} color="#6b7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, !newTeam.name.trim() && styles.disabledButton]}
                  onPress={createTeam}
                  disabled={!newTeam.name.trim()}
                >
                  <Ionicons name="add-outline" size={18} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Create Team</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Team Modal */}
      {editModalVisible && editingTeam && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={closeEditModal}
        >
          <Animated.View style={[styles.modalOverlay, { opacity: editModalOpacity }]}>
            <Animated.View style={[
              styles.modalContent,
              {
                opacity: editModalOpacity,
                transform: [{
                  scale: editModalOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }]
              }
            ]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <Ionicons name="create-outline" size={28} color="#7c3aed" />
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>Edit Team</Text>
                    <Text style={styles.modalSubtitle}>Update team information and settings</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeEditModal}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Success/Error Messages */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {successMessage && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
                
                {/* Team Name */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Team Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingTeam.name}
                    onChangeText={(text) => setEditingTeam({...editingTeam, name: text})}
                    placeholder="Enter team name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Team Code Display */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Team Code</Text>
                  <View style={styles.codeDisplayContainer}>
                    <Ionicons name="key-outline" size={18} color="#6b7280" />
                    <Text style={styles.codeDisplayText}>
                      {editingTeam.teamCode || editingTeam.code} (Cannot be changed)
                    </Text>
                  </View>
                </View>

                {/* Coach Assignment */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Coach Assignment</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowEditCoachDropdown(!showEditCoachDropdown)}
                  >
                    <View style={styles.dropdownButtonContent}>
                      <Ionicons name="person-outline" size={18} color="#7c3aed" />
                      <Text style={styles.dropdownButtonText}>
                        {editingTeam.coachId ? 
                          coaches.find(c => c.id === editingTeam.coachId)?.name || 'Selected Coach' : 
                          'No Coach Assigned'
                        }
                      </Text>
                    </View>
                    <Ionicons 
                      name={showEditCoachDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                  
                  {showEditCoachDropdown && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          !editingTeam.coachId && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setEditingTeam({...editingTeam, coachId: ''});
                          setShowEditCoachDropdown(false);
                        }}
                      >
                        <Ionicons name="remove-circle-outline" size={18} color={!editingTeam.coachId ? "#ffffff" : "#6b7280"} />
                        <Text style={[
                          styles.dropdownItemText,
                          !editingTeam.coachId && styles.dropdownItemTextSelected
                        ]}>
                          No Coach
                        </Text>
                        {!editingTeam.coachId && (
                          <Ionicons name="checkmark" size={18} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                      
                      {coaches.map((coach) => (
                        <TouchableOpacity
                          key={coach.id}
                          style={[
                            styles.dropdownItem,
                            editingTeam.coachId === coach.id && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setEditingTeam({...editingTeam, coachId: coach.id});
                            setShowEditCoachDropdown(false);
                          }}
                        >
                          <Ionicons name="person" size={18} color={editingTeam.coachId === coach.id ? "#ffffff" : "#7c3aed"} />
                          <Text style={[
                            styles.dropdownItemText,
                            editingTeam.coachId === coach.id && styles.dropdownItemTextSelected
                          ]}>
                            {coach.name} ({coach.email})
                          </Text>
                          {editingTeam.coachId === coach.id && (
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* GroupMe Link */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>GroupMe Invite Link (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingTeam.groupMeLink || ''}
                    onChangeText={(text) => setEditingTeam({...editingTeam, groupMeLink: text})}
                    placeholder="https://groupme.com/join_group/..."
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <View style={styles.infoContainer}>
                    <Ionicons name="chatbubbles-outline" size={16} color="#0ea5e9" />
                    <Text style={styles.infoText}>
                      Enter the GroupMe group invite link for team chat
                    </Text>
                  </View>
                </View>

                {/* Active Status */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Team Status</Text>
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setEditingTeam({...editingTeam, isActive: !editingTeam.isActive})}
                  >
                    <View style={styles.toggleContent}>
                      <Ionicons 
                        name={editingTeam.isActive ? "checkmark-circle" : "close-circle"} 
                        size={20} 
                        color={editingTeam.isActive ? "#16a34a" : "#dc2626"} 
                      />
                      <Text style={styles.toggleLabel}>Active Team</Text>
                    </View>
                    <View style={[
                      styles.toggleSwitch,
                      editingTeam.isActive && styles.toggleSwitchActive
                    ]}>
                      <View style={[
                        styles.toggleKnob,
                        editingTeam.isActive && styles.toggleKnobActive
                      ]} />
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeEditModal}
                >
                  <Ionicons name="close-outline" size={18} color="#6b7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateTeam}
                >
                  <Ionicons name="checkmark-outline" size={18} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },

  headerContent: {
    flex: 1,
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

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
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

  teamsSection: {
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

  teamCard: {
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

  teamCardMain: {
    marginBottom: Spacing.md,
  },

  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  teamInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },

  teamName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },

  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  teamCode: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '400',
  },

  separator: {
    fontSize: FontSizes.sm,
    color: '#d1d5db',
    marginHorizontal: Spacing.xs,
  },

  teamMembers: {
    fontSize: FontSizes.sm,
    color: '#059669',
    fontWeight: '500',
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

  teamActions: {
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },

  statusText: {
    fontSize: FontSizes.xs,
    color: '#ffffff',
    fontWeight: '600',
  },

  teamRank: {
    fontSize: FontSizes.lg,
    color: '#f59e0b',
    fontWeight: 'bold',
  },

  teamCardActions: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: Spacing.sm,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    gap: Spacing.xs,
  },

  resetButton: {
    backgroundColor: '#dc2626',
  },

  actionButtonText: {
    fontSize: FontSizes.sm,
    color: '#7c3aed',
    fontWeight: '600',
  },

  resetButtonText: {
    fontSize: FontSizes.sm,
    color: '#ffffff',
    fontWeight: '600',
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

  // Modal Styles
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

  // Info Cards
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

  infoGrid: {
    gap: Spacing.sm,
  },

  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontWeight: '600',
    flex: 1,
  },

  infoValue: {
    fontSize: FontSizes.sm,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },

  // Members List
  membersList: {
    gap: Spacing.sm,
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },

  memberRole: {
    fontSize: FontSizes.xs,
    color: '#6b7280',
    fontWeight: '400',
  },

  // Timestamp Card
  timestampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },

  timestampText: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    marginLeft: Spacing.sm,
  },

  // Form Sections
  formSection: {
    marginBottom: Spacing.lg,
  },

  sectionLabel: {
    fontSize: FontSizes.sm,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  // Text Input
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: '#1f2937',
    minHeight: 50,
  },

  // Code Display
  codeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  codeDisplayText: {
    fontSize: FontSizes.sm,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginLeft: Spacing.sm,
  },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: Spacing.md,
    minHeight: 50,
  },

  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dropdownButtonText: {
    fontSize: FontSizes.base,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },

  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  dropdownItemSelected: {
    backgroundColor: '#7c3aed',
  },

  dropdownItemText: {
    fontSize: FontSizes.base,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: Spacing.sm,
    flex: 1,
  },

  dropdownItemTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Toggle Switch
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

  // Info Container
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },

  infoText: {
    fontSize: FontSizes.sm,
    color: '#0369a1',
    marginLeft: Spacing.sm,
    flex: 1,
  },

  // Success/Error Containers
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#4ade80',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  successText: {
    color: '#16a34a',
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  errorText: {
    color: '#dc2626',
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },

  // Action Buttons
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: Spacing.md,
  },

  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },

  editButtonText: {
    fontSize: FontSizes.base,
    color: '#7c3aed',
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },

  activateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: '#10b981',
  },

  activateButtonText: {
    fontSize: FontSizes.base,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: Spacing.xs,
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

  disabledButton: {
    opacity: 0.5,
  },
};

export default TeamManagement;
