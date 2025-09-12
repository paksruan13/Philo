import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ROUTES, createAuthHeaders, fetchWithTimeout } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('token');
            if (savedToken) {
                const response = await fetchWithTimeout(API_ROUTES.auth.me, {
                    headers: createAuthHeaders(savedToken)
                }, 15000); // 15 second timeout for auth check
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('🔍 AuthContext: User data from API:', data.user);
                    console.log('🔍 AuthContext: User team:', data.user?.team);
                    console.log('🔍 AuthContext: User teamId:', data.user?.teamId);
                    setUser(data.user);
                    setToken(savedToken);
                    setIsAuthenticated(true);
                } else {
                    // Token is invalid, clear it
                    await AsyncStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        } catch (error) {
            await AsyncStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            
            const response = await fetchWithTimeout(API_ROUTES.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            }, 15000); // 15 second timeout
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('🔍 AuthContext: Login response data:', data);
                console.log('🔍 AuthContext: Login user data:', data.user);
                console.log('🔍 AuthContext: Login user team:', data.user?.team);
                setUser(data.user);
                setToken(data.token);
                await AsyncStorage.setItem('token', data.token);
                return {
                    success: true,
                    mustChangePassword: data.mustChangePassword || data.user?.mustChangePassword
                };
            } else {
                return { success: false, error: data.error || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('API URL:', API_ROUTES.auth.login);
            
            // Provide more specific error messages
            let errorMessage = 'Login failed';
            if (error.message.includes('timeout')) {
                errorMessage = 'Connection timeout. Please check your network and try again.';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.message.includes('Request timed out')) {
                errorMessage = 'Request timed out. Please try again.';
            }
            
            return { success: false, error: errorMessage };
        }
    };

  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_ROUTES.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const registerWithTeam = async (name, email, password, teamCode = '') => {
    try {

      const requestBody = { name, email, password };
      // Only include teamCode if it's provided and not empty
      if (teamCode && teamCode.trim()) {
        requestBody.teamCode = teamCode.trim();
      }

      const response = await fetch(`${API_ROUTES.AUTH.REGISTER_WITH_TEAM}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        
        // Handle validation errors with detailed messages
        let errorMessage = data.message || data.error || 'Registration failed';
        
        if (data.details && data.details.length > 0) {
          // Extract the first validation error message
          errorMessage = data.details[0].msg || errorMessage;
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

    const logout = async () => {
        try {
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
            await AsyncStorage.removeItem('token');
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        registerWithTeam,
        checkAuth,
        isAuthenticated,
        isCoach: user?.role === 'COACH',
        isAdmin: user?.role === 'ADMIN',
        isStaff: user?.role === 'STAFF',
        isStudent: user?.role === 'STUDENT',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
