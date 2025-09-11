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
import { Colors, Styles, Spacing, FontSizes } from '../../styles/theme';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerWithTeam } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !teamCode) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithTeam(
        name.trim(),
        email.toLowerCase().trim(),
        password,
        teamCode.toUpperCase().trim()
      );
      
      if (result.success) {
        // Navigation will be handled automatically by AppNavigator
        Alert.alert('Success', 'Account created successfully!');
      } else {
        Alert.alert('Registration Failed', result.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
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
              <Text style={styles.title}>Join Project Phi</Text>
              <Text style={styles.subtitle}>
                Create your account and join a team
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[
                    Styles.textInput,
                    styles.textInput,
                    { borderColor: name ? Colors.primary : Colors.border }
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.mutedForeground}
                  autoCapitalize="words"
                />
              </View>

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
                  placeholder="Create a password (min 6 characters)"
                  placeholderTextColor={Colors.mutedForeground}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Team Code</Text>
                <TextInput
                  style={[
                    Styles.textInput,
                    styles.textInput,
                    { borderColor: teamCode ? Colors.primary : Colors.border }
                  ]}
                  value={teamCode}
                  onChangeText={setTeamCode}
                  placeholder="Enter your team code"
                  placeholderTextColor={Colors.mutedForeground}
                  autoCapitalize="characters"
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  Styles.buttonPrimary,
                  styles.registerButton,
                  loading && styles.buttonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Sign In</Text>
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
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  
  logo: {
    fontSize: FontSizes['4xl'],
    marginBottom: Spacing.md,
  },
  
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  
  form: {
    flex: 1,
    paddingVertical: Spacing.lg,
  },
  
  inputContainer: {
    marginBottom: Spacing.md,
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
  
  registerButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  
  registerButtonText: {
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

export default RegisterScreen;
