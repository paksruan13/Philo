import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';
import { API_ROUTES } from '../../services/api';

const ProfileScreen = () => {
  const { user, logout, token } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const startEditingEmail = () => {
    setEditedEmail(user?.email || '');
    setIsEditingEmail(true);
  };

  const cancelEditingEmail = () => {
    setIsEditingEmail(false);
    setEditedEmail('');
  };

  const saveEmail = async () => {
    try {
      if (!editedEmail || !editedEmail.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      if (editedEmail === user?.email) {
        setIsEditingEmail(false);
        return;
      }

      setIsLoading(true);

      const response = await fetch(API_ROUTES.users.update(user.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editedEmail,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'Email updated successfully!',
          [{ text: 'OK', onPress: () => setIsEditingEmail(false) }]
        );
        
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to update email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      
      if (!passwordForm.currentPassword) {
        Alert.alert('Error', 'Current password is required');
        return;
      }

      if (!passwordForm.newPassword || passwordForm.newPassword.length < 5) {
        Alert.alert('Error', 'New password must be at least 5 characters long');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }

      setIsLoading(true);

      const response = await fetch(API_ROUTES.auth.changePassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'Password changed successfully!',
          [{ text: 'OK', onPress: closePasswordModal }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ProfileItem = ({ label, value, icon }) => (
    <View style={styles.profileCard}>
      <View style={styles.profileCardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#667eea" />
        </View>
        <View style={styles.profileContent}>
          <Text style={styles.profileLabel}>{label}</Text>
          <Text style={styles.profileValue}>{value || 'Not set'}</Text>
        </View>
      </View>
    </View>
  );

  const EditableEmailItem = () => (
    <View style={styles.profileCard}>
      <View style={styles.profileCardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={20} color="#667eea" />
        </View>
        <View style={styles.profileContent}>
          <Text style={styles.profileLabel}>Email Address</Text>
          {isEditingEmail ? (
            <View style={styles.editEmailContainer}>
              <TextInput
                style={styles.editEmailInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
              <View style={styles.editEmailButtons}>
                <TouchableOpacity 
                  onPress={saveEmail} 
                  style={[styles.editEmailButton, styles.saveButton]}
                  disabled={isLoading}
                >
                  <Ionicons name={isLoading ? "hourglass" : "checkmark"} size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={cancelEditingEmail} 
                  style={[styles.editEmailButton, styles.cancelButton]}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.profileValue}>{user?.email || 'Not set'}</Text>
          )}
        </View>
        {!isEditingEmail && (
          <TouchableOpacity onPress={startEditingEmail} style={styles.editButton}>
            <Ionicons name="pencil" size={16} color="#667eea" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Simple Header */}
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color="#667eea" />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{user?.role?.toLowerCase()}</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={20} color="#2d3748" />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>
            
            <ProfileItem
              label="Full Name"
              value={user?.name}
              icon="person"
            />
            
            <EditableEmailItem />
          </View>

          {/* Settings */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cog-outline" size={20} color="#2d3748" />
              <Text style={styles.sectionTitle}>Account Settings</Text>
            </View>
            
            <TouchableOpacity style={styles.settingCard} onPress={openPasswordModal}>
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="lock-closed" size={20} color="#667eea" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Change Password</Text>
                  <Text style={styles.settingDescription}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="white" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSpace} />
        </ScrollView>
      </SafeAreaView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={closePasswordModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="lock-closed" size={20} color="#667eea" />
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              <TouchableOpacity onPress={closePasswordModal}>
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                  secureTextEntry={true}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                  secureTextEntry={true}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry={true}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Change Password Button */}
              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isLoading) && styles.disabledButton
                ]}
                onPress={handlePasswordChange}
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isLoading}
              >
                <Ionicons name={isLoading ? "hourglass" : "checkmark-circle"} size={20} color="white" />
                <Text style={styles.changePasswordText}>
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  
  headerSection: {
    padding: 20,
    paddingTop: 10,
  },

  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#f7fafc',
  },

  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },

  userRole: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 8,
  },

  
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  profileContent: {
    flex: 1,
  },

  profileLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
    fontWeight: '500',
  },

  profileValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
  },

  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#edf2f7',
  },

  
  editEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  editEmailInput: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#2d3748',
    marginRight: 10,
  },

  editEmailButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  editEmailButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButton: {
    backgroundColor: '#48bb78',
  },

  cancelButton: {
    backgroundColor: '#f56565',
  },

  
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  settingIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
    marginBottom: 2,
  },

  settingDescription: {
    fontSize: 14,
    color: '#718096',
  },

  
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 10,
  },

  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  footerSpace: {
    height: 20,
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },

  formContainer: {
    gap: 16,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
  },

  changePasswordButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.5,
  },

  changePasswordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default ProfileScreen;