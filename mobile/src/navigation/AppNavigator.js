import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { Colors, FontSizes } from '../styles/theme';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import StudentDashboard from '../screens/dashboard/StudentDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import CoachDashboard from '../screens/dashboard/CoachDashboard';
import StaffDashboard from '../screens/dashboard/StaffDashboard';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import admin management screens
import UserManagement from '../screens/admin/UserManagement';
import TeamManagement from '../screens/admin/TeamManagement';
import ActivityManagement from '../screens/admin/ActivityManagement';
import InventoryManagement from '../screens/admin/InventoryManagement';
import AnnouncementManagement from '../screens/admin/AnnouncementManagement';
import SettingsManagement from '../screens/admin/SettingsManagement';

// Import coach management screens
import TeamOverview from '../screens/coach/TeamOverview';
import SubmissionManagement from '../screens/coach/SubmissionManagement';

import ProductSales from '../screens/coach/ProductSales';
import ManagePoints from '../screens/coach/ManagePoints';
import Announcements from '../screens/coach/Announcements';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigator for Admin Dashboard and Management Screens
const AdminStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboardMain" component={AdminDashboard} />
    <Stack.Screen name="UserManagement" component={UserManagement} />
    <Stack.Screen name="TeamManagement" component={TeamManagement} />
    <Stack.Screen name="ActivityManagement" component={ActivityManagement} />
    <Stack.Screen name="InventoryManagement" component={InventoryManagement} />
    <Stack.Screen name="AnnouncementManagement" component={AnnouncementManagement} />
    <Stack.Screen name="SettingsManagement" component={SettingsManagement} />
  </Stack.Navigator>
);

// Stack Navigator for Coach Dashboard and Management Screens
const CoachStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CoachDashboardMain" component={CoachDashboard} />
    <Stack.Screen name="TeamOverview" component={TeamOverview} />
    <Stack.Screen name="ManagePoints" component={ManagePoints} />
    <Stack.Screen name="Announcements" component={Announcements} />
    <Stack.Screen name="SubmissionManagement" component={SubmissionManagement} />
    <Stack.Screen name="ProductSales" component={ProductSales} />
  </Stack.Navigator>
);

// Stack Navigator for Student Dashboard
const StudentStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudentDashboardMain" component={StudentDashboard} />
  </Stack.Navigator>
);

// Tab Navigator for authenticated users
const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingTop: 8,
          paddingBottom: 25,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        headerShown: false,
      }}
    >
      {/* Dashboard Tab - Different based on role */}
      <Tab.Screen
        name="Dashboard"
        component={
          user?.role === 'ADMIN' ? AdminStackNavigator : 
          user?.role === 'COACH' ? CoachStackNavigator : 
          user?.role === 'STUDENT' ? StudentStackNavigator :
          getDashboardComponent(user?.role)
        }
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 24, color }}>🎯</Text>
          ),
        }}
      />

      {/* Leaderboard Tab */}
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Leaderboard',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 24, color }}>🏆</Text>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Helper function to get dashboard component based on role
const getDashboardComponent = (role) => {
  switch (role) {
    case 'STUDENT':
      return StudentDashboard;
    case 'COACH':
      return CoachDashboard;
    case 'ADMIN':
      return AdminDashboard;
    case 'STAFF':
      return StaffDashboard;
    default:
      return StudentDashboard; // Default to student dashboard
  }
};

// Auth Stack Navigator
  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.background 
      }}>
        <Text style={{ fontSize: FontSizes['2xl'], color: Colors.primary }}>🎯</Text>
        <Text style={{ 
          fontSize: FontSizes.lg, 
          color: Colors.foreground, 
          marginTop: 16 
        }}>
          Loading Project Phi...
        </Text>
      </View>
    );
  }

  return user ? <MainTabNavigator /> : <AuthStack />;
};

export default AppNavigator;
