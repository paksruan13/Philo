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
import MaskedView from '@react-native-masked-view/masked-view';
import * as Font from 'expo-font';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Styles, Spacing, BorderRadius, FontSizes } from '../../styles/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Load custom font
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'BitcountGridDouble': require('../../../assets/fonts/BitcountGridDouble-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf'),
        });
        setFontLoaded(true);
        console.log('BitcountGridDouble font loaded successfully in LoginScreen!');
      } catch (error) {
        console.error('Error loading BitcountGridDouble font:', error);
      }
    }
    loadFonts();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.toLowerCase().trim(), password);
      
      if (result.success) {
        // Navigation will be handled automatically by AppNavigator
        // when the user state changes in AuthContext
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#faf5ff', '#f3e8ff', '#e9d5ff']} // light purple gradient
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
                  Welcome
                </Text>
                <Text style={[
                  styles.title,
                  fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                ]}>
                  To
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
                        color={email ? "#0891b2" : "#94a3b8"} 
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
                        color={password ? "#0891b2" : "#94a3b8"} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
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

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading || !email || !password}
                  >
                    <LinearGradient
                      colors={loading ? ['#94a3b8', '#64748b'] : ['#8b5cf6', '#7c3aed']} // purple gradient
                      style={styles.loginButtonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={[
                          styles.loginButtonText,
                          fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                        ]}>
                          Sign In
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
                    Don't have an account?
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Register')}
                    style={styles.signUpButton}
                  >
                    <Text style={[
                      styles.signUpText,
                      fontLoaded ? { fontFamily: 'BitcountGridDouble' } : {}
                    ]}>
                      Sign Up
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

  // Header Section
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#8b5cf6', // purple color
    marginBottom: 8,
    // Shadow properties
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Form Section
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

  // Input Styles
  inputGroup: {
    marginBottom: 24,
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
    borderColor: '#0891b2',
    backgroundColor: '#f0f9ff',
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

  // Button Styles
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Footer Section
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
  signUpButton: {
    marginLeft: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signUpText: {
    fontSize: 15,
    color: '#0891b2',
    fontWeight: '700',
  },
};

export default LoginScreen;
