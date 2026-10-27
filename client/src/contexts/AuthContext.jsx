import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('powergrid_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch {
      localStorage.removeItem('powergrid_token');
      localStorage.removeItem('powergrid_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, session } = response.data;
    const token = session?.access_token || 'demo-token';

    localStorage.setItem('powergrid_token', token);
    localStorage.setItem('powergrid_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (registerData) => {
    const response = await api.post('/auth/register', registerData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('powergrid_token');
    localStorage.removeItem('powergrid_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: user?.role || null,
        isAdmin: user?.role === 'admin',
        isConsumer: user?.role === 'consumer',
        login,
        register,
        logout,
        refreshProfile: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
