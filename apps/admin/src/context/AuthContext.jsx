import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('taw_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('taw_admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await api.getMe();
          setAdmin(profile);
          localStorage.setItem('taw_admin_user', JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, [token]);

  async function login(email, password) {
    const data = await api.login(email, password);
    setToken(data.token);
    setAdmin(data.admin);
    localStorage.setItem('taw_admin_token', data.token);
    localStorage.setItem('taw_admin_user', JSON.stringify(data.admin));
    return data.admin;
  }

  function logout() {
    api.logout();
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('taw_admin_token');
    localStorage.removeItem('taw_admin_user');
  }

  return (
    <AuthContext.Provider value={{ admin, token, isAuthenticated: Boolean(token), isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
