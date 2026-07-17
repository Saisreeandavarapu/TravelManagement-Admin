import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('travel_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Spring Boot endpoint
      const response = await axios.post(`https://travelmanagement-spring-boot-api.onrender.com/registration/login`, { email, password });
      
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('travel_admin_user', JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to mock admin if matching default credentials, or if backend fails
      if (email === 'admin@example.com' && password === 'admin') {
        const mockAdmin = {
          id: 9999,
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: 'ADMIN',
          status: 'ACTIVE'
        };
        setUser(mockAdmin);
        localStorage.setItem('travel_admin_user', JSON.stringify(mockAdmin));
        return mockAdmin;
      }
      
      const message = error.response?.data?.message || error.message || 'Login failed. Please check your connection and try again.';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('travel_admin_user');
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
