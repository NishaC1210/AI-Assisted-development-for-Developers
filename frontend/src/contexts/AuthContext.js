import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_URL}/auth/me`);
          setUser(response.data);
        } catch (err) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      const { token, user: newUser } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(newUser);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

