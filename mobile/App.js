import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/styles/theme';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar 
          style="light" 
          backgroundColor={Colors.background}
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
