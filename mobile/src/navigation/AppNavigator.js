import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
import GroupMeScreen from '../screens/groupme/GroupMeScreen';
import StoreScreen from '../screens/store/StoreScreen';

// Import admin management screens
import UserManagement from '../screens/admin/UserManagement';
import TeamManagement from '../screens/admin/TeamManagement';
import ActivityManagement from '../screens/admin/ActivityManagement';
import InventoryManagement from '../screens/admin/InventoryManagement';
import AnnouncementManagement from '../screens/admin/AnnouncementManagement';
import SettingsManagement from '../screens/admin/SettingsManagement';

// Import coach management screens
import ProductSales from '../screens/coach/ProductSales';
import ManagePoints from '../screens/coach/ManagePoints';
import Announcements from '../screens/coach/Announcements';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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

const CoachStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CoachDashboardMain" component={CoachDashboard} />
    <Stack.Screen name="ManagePoints" component={ManagePoints} />
    <Stack.Screen name="Announcements" component={Announcements} />
    <Stack.Screen name="ProductSales" component={ProductSales} />
  </Stack.Navigator>
);

const StaffStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StaffDashboardMain" component={StaffDashboard} />
    <Stack.Screen name="ManagePoints" component={ManagePoints} />
    <Stack.Screen name="ProductSales" component={ProductSales} />
  </Stack.Navigator>
);

const StudentStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudentDashboardMain" component={StudentDashboard} />
  </Stack.Navigator>
);

const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingTop: 12,
          paddingBottom: 25,
          height: 70,
        },
        tabBarShowLabel: false, // Remove labels
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        headerShown: false,
      }}
    >
      {/* Leaderboard Tab */}
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "trophy" : "trophy-outline"} 
              size={26} 
              color={focused ? '#FF6B6B' : color} 
            />
          ),
        }}
      />

      {/* Dashboard Tab */}
      {user?.role && (user?.role === 'STUDENT' || user?.role === 'ADMIN' || user?.role === 'COACH' || user?.role === 'STAFF') && (
        <Tab.Screen
          name="Dashboard"
          component={
            user?.role === 'ADMIN' ? AdminStackNavigator : 
            user?.role === 'COACH' ? CoachStackNavigator : 
            user?.role === 'STAFF' ? StaffStackNavigator :
            user?.role === 'STUDENT' ? StudentStackNavigator :
            getDashboardComponent(user?.role)
          }
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons 
                name={focused ? "grid" : "grid-outline"} 
                size={26} 
                color={focused ? '#0891b2' : color} 
              />
            ),
          }}
        />
      )}

      {/* GroupMe Tab */}
      {(user?.role === 'COACH' || user?.role === 'STUDENT') && (
        <Tab.Screen
          name="GroupMe"
          component={GroupMeScreen}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons 
                name={focused ? "chatbubbles" : "chatbubbles-outline"} 
                size={26} 
                color={focused ? '#00D4FF' : color} 
              />
            ),
          }}
        />
      )}

      {/* Store Tab */}
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "storefront" : "storefront-outline"} 
              size={26} 
              color={focused ? '#10b981' : color} 
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={26} 
              color={focused ? '#8b5cf6' : color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

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
      return StudentDashboard;
  }
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

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
