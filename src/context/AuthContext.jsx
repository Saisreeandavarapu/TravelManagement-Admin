import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  // No localStorage — session lives only in React state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // First find the user by email from allUsers, then use login endpoint
      const allRes = await api.get('/registration/allUsers');
      const allUsers = Array.isArray(allRes.data) ? allRes.data : [];
      const match = allUsers.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (!match) throw new Error('No account found with this email.');

      // GET /registration/login/{id}/{password}
      const loginRes = await api.get(`/registration/login/${match.id}/${encodeURIComponent(password)}`);
      const loggedUser = loginRes.data;

      if (!loggedUser) throw new Error('Invalid credentials.');

      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
