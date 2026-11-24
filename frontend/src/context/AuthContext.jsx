import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import i18n from '../i18n';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ── Use sessionStorage so the session ends when the browser tab/window is closed ──
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const applyLanguage = (userData) => {
    if (userData?.preferred_language) {
      const lang = userData.preferred_language;
      i18n.changeLanguage(lang);
      // Keep language preference in localStorage (not sensitive)
      localStorage.setItem('i18nextLng', lang);
    }
  };

  // Validate the token on startup (re-fetch user from backend)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          sessionStorage.setItem('user', JSON.stringify(res.data));
          applyLanguage(res.data);
        } catch (err) {
          console.error('Session invalid or expired — logging out.', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchCurrentUser();
  }, [token]);

  /**
   * Login using username or email + password, plus expected role.
   * @param {string} identifier - username or email
   * @param {string} password
   * @param {string} expectedRole - required role selected on the login form
   */
  const login = async (identifier, password, expectedRole) => {
    const payload = { identifier, password };
    if (expectedRole) {
      payload.role = expectedRole;
    }
    const res = await api.post('/api/auth/login', payload);
    const { access_token, user: userData } = res.data;
    if (expectedRole && userData.role !== expectedRole) {
      throw new Error('The selected role does not match this account. Please choose the correct role.');
    }
    setToken(access_token);
    setUser(userData);
    sessionStorage.setItem('token', access_token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    applyLanguage(userData);
    return userData;
  };

  /**
   * Register a new user.
   * After successful registration we do NOT auto-login;
   * we redirect to the login page.
   */
  const register = async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    return res.data; // { access_token, user } — caller decides what to do
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
