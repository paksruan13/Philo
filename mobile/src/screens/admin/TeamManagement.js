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
  const [newTeam, setNewTeam] = useState({ name: '', coachId: '' });
  const [editingTeam, setEditingTeam] = useState(null);
  const [error, setError] = useState('');

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
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
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
          coachId: newTeam.coachId || null
        })
      });

      if (response.ok) {
        await fetchTeams();
        setCreateModalVisible(false);
        setNewTeam({ name: '', coachId: '' });
        setError('');
        Alert.alert('Success', 'Team created successfully');
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
      coachId: team.coachId || ''
    });
    setEditModalVisible(true);
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
          isActive: editingTeam.isActive
        })
      });

      if (response.ok) {
        await fetchTeams();
        setEditModalVisible(false);
        setEditingTeam(null);
        setError('');
        Alert.alert('Success', 'Team updated successfully');
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
    const memberCount = team.members?.length || 0;
    const totalPoints = team.totalScore || 0;

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
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCode}>Team Code: {team.code || 'N/A'}</Text>
              <View style={styles.teamMeta}>
                <Text style={styles.teamMembers}>👥 {memberCount} members</Text>
                <Text style={styles.teamPoints}>🏆 {totalPoints} points</Text>
              </View>
            </View>

            <View style={styles.teamActions}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? Colors.success : Colors.mutedForeground }
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
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]}
            onPress={() => handleResetPoints(team)}
          >
            <Text style={styles.resetButtonText}>Reset Points</Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Team Details</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Team Name</Text>
                <Text style={styles.detailValue}>{selectedTeam.name}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Team Code</Text>
                <Text style={styles.detailValue}>{selectedTeam.code || 'N/A'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Members</Text>
                <Text style={styles.detailValue}>
                  {selectedTeam.members?.length || 0} members
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Total Points</Text>
                <Text style={styles.detailValue}>{selectedTeam.totalScore || 0}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Rank</Text>
                <Text style={styles.detailValue}>#{selectedTeam.rank || 'Unranked'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>
                  {selectedTeam.isActive !== false ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {selectedTeam.createdAt ? new Date(selectedTeam.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>

              {selectedTeam.members && selectedTeam.members.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Team Members</Text>
                  {selectedTeam.members.map((member, index) => (
                    <Text key={index} style={styles.memberItem}>
                      • {member.firstName} {member.lastName} ({member.role})
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.activateButton]}
                onPress={() => {
                  setModalVisible(false);
                  handleTeamAction(selectedTeam, selectedTeam.isActive ? 'Deactivate' : 'Activate');
                }}
              >
                <Text style={styles.actionButtonText}>
                  {selectedTeam.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  setModalVisible(false);
                  handleTeamAction(selectedTeam, 'Delete');
                }}
              >
                <Text style={styles.actionButtonText}>Delete Team</Text>
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
          <Text style={styles.loadingText}>Loading teams...</Text>
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
        <Text style={styles.title}>Team Management 🏆</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search teams by name or code..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Teams List */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{teams.length}</Text>
            <Text style={styles.statLabel}>Total Teams</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {teams.filter(t => t.isActive !== false).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {teams.reduce((sum, team) => sum + (team.members?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {teams.reduce((sum, team) => sum + (team.totalScore || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>
        {filteredTeams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No teams found</Text>
          </View>
        ) : (
          filteredTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))
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
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Team</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setCreateModalVisible(false)}
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
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Team Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newTeam.name}
                    onChangeText={(text) => setNewTeam({...newTeam, name: text})}
                    placeholder="Enter team name"
                    placeholderTextColor={Colors.mutedForeground}
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Assign Coach (Optional)</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.teamOption,
                        !newTeam.coachId && styles.teamOptionSelected
                      ]}
                      onPress={() => setNewTeam({...newTeam, coachId: ''})}
                    >
                      <Text style={[
                        styles.teamOptionText,
                        !newTeam.coachId && styles.teamOptionTextSelected
                      ]}>
                        No Coach
                      </Text>
                    </TouchableOpacity>
                    
                    {coaches.map((coach) => (
                      <TouchableOpacity
                        key={coach.id}
                        style={[
                          styles.teamOption,
                          newTeam.coachId === coach.id && styles.teamOptionSelected
                        ]}
                        onPress={() => setNewTeam({...newTeam, coachId: coach.id})}
                      >
                        <Text style={[
                          styles.teamOptionText,
                          newTeam.coachId === coach.id && styles.teamOptionTextSelected
                        ]}>
                          {coach.name} ({coach.email})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>
                    💡 A unique team code will be automatically generated for registration.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setCreateModalVisible(false);
                    setNewTeam({ name: '', coachId: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, !newTeam.name.trim() && styles.disabledButton]}
                  onPress={createTeam}
                  disabled={!newTeam.name.trim()}
                >
                  <Text style={styles.actionButtonText}>Create Team</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Team Modal */}
      {editModalVisible && editingTeam && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Team</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setEditModalVisible(false)}
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
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Team Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingTeam.name}
                    onChangeText={(text) => setEditingTeam({...editingTeam, name: text})}
                    placeholder="Enter team name"
                    placeholderTextColor={Colors.mutedForeground}
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Team Code</Text>
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeText}>{editingTeam.teamCode || editingTeam.code} (Cannot be changed)</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Coach</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.teamOption,
                        !editingTeam.coachId && styles.teamOptionSelected
                      ]}
                      onPress={() => setEditingTeam({...editingTeam, coachId: ''})}
                    >
                      <Text style={[
                        styles.teamOptionText,
                        !editingTeam.coachId && styles.teamOptionTextSelected
                      ]}>
                        No Coach
                      </Text>
                    </TouchableOpacity>
                    
                    {coaches.map((coach) => (
                      <TouchableOpacity
                        key={coach.id}
                        style={[
                          styles.teamOption,
                          editingTeam.coachId === coach.id && styles.teamOptionSelected
                        ]}
                        onPress={() => setEditingTeam({...editingTeam, coachId: coach.id})}
                      >
                        <Text style={[
                          styles.teamOptionText,
                          editingTeam.coachId === coach.id && styles.teamOptionTextSelected
                        ]}>
                          {coach.name} ({coach.email})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.checkbox, 
                      editingTeam.isActive && styles.checkboxChecked
                    ]}
                    onPress={() => setEditingTeam({...editingTeam, isActive: !editingTeam.isActive})}
                  >
                    {editingTeam.isActive && (
                      <Text style={styles.checkboxCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Active Team</Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={updateTeam}
                >
                  <Text style={styles.actionButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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

  teamCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },

  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamInfo: {
    flex: 1,
  },

  teamName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: 4,
  },

  teamCode: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    marginBottom: 8,
  },

  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamMembers: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    marginRight: Spacing.md,
  },

  teamPoints: {
    fontSize: FontSizes.sm,
    color: Colors.success,
  },

  teamActions: {
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },

  statusText: {
    fontSize: FontSizes.xs,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  teamRank: {
    fontSize: FontSizes.lg,
    color: Colors.primary,
    fontWeight: 'bold',
  },

  // Modal Styles (similar to UserManagement)
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

  memberItem: {
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    marginBottom: 4,
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

  activateButton: {
    backgroundColor: Colors.success,
  },

  deleteButton: {
    backgroundColor: Colors.error,
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

  // New styles for team card actions
  teamCardMain: {
    flex: 1,
  },

  teamCardActions: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },

  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },

  resetButton: {
    backgroundColor: Colors.error,
  },

  resetButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  // Modal styles
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.foreground,
    backgroundColor: Colors.background,
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

  codeContainer: {
    backgroundColor: Colors.muted,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },

  codeText: {
    fontSize: FontSizes.sm,
    color: Colors.mutedForeground,
    fontFamily: 'monospace',
  },

  infoContainer: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },

  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    textAlign: 'center',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
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

  disabledButton: {
    opacity: 0.5,
  },

  cancelButton: {
    backgroundColor: Colors.mutedForeground,
  },

  cancelButtonText: {
    fontSize: FontSizes.base,
    color: Colors.primaryForeground,
    fontWeight: '600',
  },

  saveButton: {
    backgroundColor: Colors.primary,
  },

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

export default TeamManagement;
