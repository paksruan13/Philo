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

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const savedToken = await AsyncStorage.getItem('token');
            if (savedToken) {
                console.log('🔐 Checking saved token with API:', API_ROUTES.auth.me);
                const response = await fetchWithTimeout(API_ROUTES.auth.me, {
                    headers: createAuthHeaders(savedToken)
                }, 15000); // 15 second timeout for auth check
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Auth check successful');
                    setUser(data.user);
                    setToken(savedToken);
                } else {
                    console.log('❌ Token invalid, clearing storage');
                    // Token is invalid, clear it
                    await AsyncStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } else {
                console.log('ℹ️ No saved token found');
            }
        } catch (error) {
            console.error('Auth Check Failed:', error);
            console.error('API URL:', API_ROUTES.auth.me);
            await AsyncStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log('🚀 Attempting login to:', API_ROUTES.auth.login);
            console.log('📧 Email:', email);
            
            const response = await fetchWithTimeout(API_ROUTES.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            }, 15000); // 15 second timeout
            
            console.log('📡 Login response status:', response.status);
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Login successful');
                setUser(data.user);
                setToken(data.token);
                await AsyncStorage.setItem('token', data.token);
                return {
                    success: true,
                    mustChangePassword: data.mustChangePassword || data.user?.mustChangePassword
                };
            } else {
                console.log('❌ Login failed:', data.error);
                return { success: false, error: data.error || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login Failed:', error);
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

  const registerWithTeam = async (name, email, password, teamCode) => {
    try {
      const response = await fetch(`${API_ROUTES.AUTH.REGISTER_WITH_TEAM}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, teamCode }),
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
      console.error('Registration with team error:', error);
      return { success: false, error: 'Network error' };
    }
  };

    const logout = async () => {
        try {
            setUser(null);
            setToken(null);
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
        isAuthenticated: !!user,
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
