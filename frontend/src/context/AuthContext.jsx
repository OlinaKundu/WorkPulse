/**
 * WorkPulse Authentication & Session Context Provider
 * Manages user authentication state, session persistence, and role-based helpers
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('inner_eye_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('inner_eye_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('inner_eye_user', JSON.stringify(res.user));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }

    const handleExpired = () => logout();
    window.addEventListener('auth-expired', handleExpired);

    verifyAuth();

    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('inner_eye_token', res.token);
      localStorage.setItem('inner_eye_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Authentication response malformed');
  };

  const register = async ({ fullName, email, password, role, departmentId, adminPasscode }) => {
    const res = await api.post('/auth/register', {
      fullName,
      email,
      password,
      role,
      departmentId,
      adminPasscode,
    });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('inner_eye_token', res.token);
      localStorage.setItem('inner_eye_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Registration response malformed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('inner_eye_token');
    localStorage.removeItem('inner_eye_user');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('inner_eye_user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isHR: user?.role === 'HR',
        isEmployee: user?.role === 'Employee',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
