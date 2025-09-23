import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { registerWithTeam } = useAuth();

  
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'BitcountGridDouble': require('../../../assets/fonts/BitcountGridDouble-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf'),
        });
        setFontLoaded(true);
      } catch (error) {
        
      }
    }
    loadFonts();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 5) {
      Alert.alert('Error', 'Password must be at least 5 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithTeam(
        name.trim(),
        email.toLowerCase().trim(),
        password,
        teamCode.trim() 
      );
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!');
      } else {
        Alert.alert('Registration Failed', result.error || 'Registration failed. Please check your details and try again.');
      }
    } catch (error) {
      Alert.alert('Error', `Registration failed: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#faf5ff', '#f3e8ff', '#e9d5ff']} 
        style={styles.backgroundGradient}
      >
        {/* Subtle Pattern Overlay */}
        <View style={styles.patternOverlay}>
          <View style={styles.pattern}>
            {/* Create a subtle dot pattern */}
            {Array.from({ length: 50 }).map((_, i) => (
              <View key={i} style={[
                styles.dot,
                {
                  left: `${(i * 23) % 100}%`,
                  top: `${Math.floor(i / 4) * 15}%`,
                  opacity: 0.1,
                }
              ]} />
            ))}
          </View>
        </View>
        
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section */}
              <View style={styles.header}>
                <Text style={[
                  styles.title,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  Join
                </Text>
                <Text style={[
                  styles.title,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  Philo
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <View style={styles.formCard}>
                  {/* Full Name Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[
                      styles.inputLabel,
                      fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                    ]}>
                      Full Name
                    </Text>
                    <View style={[
                      styles.inputWrapper,
                      name && styles.inputWrapperFocused
                    ]}>
                      <Ionicons 
                        name="person-outline" 
                        size={20} 
                        color={name ? "#8b5cf6" : "#94a3b8"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[
                      styles.inputLabel,
                      fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                    ]}>
                      Email Address
                    </Text>
                    <View style={[
                      styles.inputWrapper,
                      email && styles.inputWrapperFocused
                    ]}>
                      <Ionicons 
                        name="mail-outline" 
                        size={20} 
                        color={email ? "#8b5cf6" : "#94a3b8"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[
                      styles.inputLabel,
                      fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                    ]}>
                      Password
                    </Text>
                    <View style={[
                      styles.inputWrapper,
                      password && styles.inputWrapperFocused
                    ]}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color={password ? "#8b5cf6" : "#94a3b8"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a password (min 6 chars)"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Team Code Input */}
                  <View style={styles.inputGroup}>
                    <Text style={[
                      styles.inputLabel,
                      fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                    ]}>
                      Team Code (Optional)
                    </Text>
                    <View style={[
                      styles.inputWrapper,
                      teamCode && styles.inputWrapperFocused
                    ]}>
                      <Ionicons 
                        name="people-outline" 
                        size={20} 
                        color={teamCode ? "#8b5cf6" : "#94a3b8"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={teamCode}
                        onChangeText={setTeamCode}
                        placeholder="Enter team code (optional)"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    onPress={handleRegister}
                    disabled={loading || !name || !email || !password}
                  >
                    <LinearGradient
                      colors={loading ? ['#94a3b8', '#64748b'] : ['#8b5cf6', '#7c3aed']} 
                      style={styles.registerButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={[
                          styles.registerButtonText,
                          fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                        ]}>
                          Create Account
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer Section */}
              <View style={styles.footer}>
                <View style={styles.footerContent}>
                  <Text style={styles.footerText}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Login')}
                    style={styles.signInButton}
                  >
                    <Text style={[
                      styles.signInText,
                      fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                    ]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  pattern: {
    flex: 1,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8b5cf6',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
  },

  
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#8b5cf6', 
    marginBottom: 8,
    
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },

  
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },

  
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    transition: 'all 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 16,
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 8,
  },

  
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  registerButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  registerButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  
  footer: {
    marginTop: 32,
    marginBottom: 16,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  signInButton: {
    marginLeft: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signInText: {
    fontSize: 15,
    color: '#8b5cf6',
    fontWeight: '700',
  },
};

export default RegisterScreen;
