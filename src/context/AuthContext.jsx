import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Spring Boot endpoint: GET /registration/login/{id}/{password}
      // Note: id corresponds to the email/username
      const response = await axios.post(`http://localhost:8080/registration/login`, { email, password });
      
      // If the API returns a response that represents the user:
      if (response.data) {
        setUser(response.data);
        return response.data;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Backend might return an error message, let's propagate it
      const message = error.response?.data?.message || error.message || 'Login failed. Please check your connection and try again.';
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
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
