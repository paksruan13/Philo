import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors, FontSizes } from '../../styles/theme';

// Import your key screens for screenshots
import LoginScreen from '../auth/LoginScreen';
import StudentDashboard from '../dashboard/StudentDashboard';
import LeaderboardScreen from '../leaderboard/LeaderboardScreen';
import StoreScreen from '../store/StoreScreen';
import ProfileScreen from '../profile/ProfileScreen';

const ScreenshotDemo = () => {
  const [currentScreen, setCurrentScreen] = useState('login');

  const screens = [
    { key: 'login', title: 'Login', component: LoginScreen },
    { key: 'dashboard', title: 'Dashboard', component: StudentDashboard },
    { key: 'leaderboard', title: 'Leaderboard', component: LeaderboardScreen },
    { key: 'store', title: 'Store', component: StoreScreen },
    { key: 'profile', title: 'Profile', component: ProfileScreen },
  ];

  const CurrentComponent = screens.find(s => s.key === currentScreen)?.component || LoginScreen;

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Selector */}
      <View style={styles.selector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {screens.map((screen) => (
            <TouchableOpacity
              key={screen.key}
              style={[
                styles.screenButton,
                currentScreen === screen.key && styles.activeButton
              ]}
              onPress={() => setCurrentScreen(screen.key)}
            >
              <Text style={[
                styles.buttonText,
                currentScreen === screen.key && styles.activeButtonText
              ]}>
                {screen.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Current Screen */}
      <View style={styles.screenContainer}>
        <CurrentComponent />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  selector: {
    height: 60,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  screenButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#ffffff',
  },
  screenContainer: {
    flex: 1,
  },
});

export default ScreenshotDemo;