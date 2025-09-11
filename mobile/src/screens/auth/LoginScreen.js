import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Styles, Spacing, BorderRadius, FontSizes } from '../../styles/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
    <SafeAreaView style={Styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.logo}>🎯</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your Project Phi account
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    Styles.textInput,
                    styles.textInput,
                    { borderColor: email ? Colors.primary : Colors.border }
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[
                    Styles.textInput,
                    styles.textInput,
                    { borderColor: password ? Colors.primary : Colors.border }
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.mutedForeground}
                  secureTextEntry
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  Styles.buttonPrimary,
                  styles.loginButton,
                  loading && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  
  header: {
    alignItems: 'center',
    marginTop: Spacing['3xl'],
    marginBottom: Spacing['2xl'],
  },
  
  logo: {
    fontSize: FontSizes['5xl'],
    marginBottom: Spacing.lg,
  },
  
  title: {
    fontSize: FontSizes['4xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  
  label: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  
  textInput: {
    borderWidth: 2,
    backgroundColor: Colors.card,
  },
  
  loginButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  
  loginButtonText: {
    color: Colors.primaryForeground,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  
  footerText: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
  },
  
  linkText: {
    fontSize: FontSizes.base,
    color: Colors.primary,
    fontWeight: '600',
  },
};

export default LoginScreen;
