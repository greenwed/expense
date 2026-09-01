import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Production Vercel backend URL for Android App
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://trackrupee.vercel.app';

export function getFullUrl(endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // In native Android webview, window.location.origin is capacitor://localhost
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rupee_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('rupee_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(getFullUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('rupee_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session validation error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const setSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('rupee_token', newToken);
    } else {
      localStorage.removeItem('rupee_token');
    }
    if (newUser) {
      localStorage.setItem('rupee_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('rupee_user');
    }
  };

  const login = async (identifierOrToken, passwordOrUser) => {
    // 1. If called with already authenticated token & user: login(token, user)
    if (
      (typeof identifierOrToken === 'string' && identifierOrToken.split('.').length === 3) ||
      (passwordOrUser && typeof passwordOrUser === 'object')
    ) {
      const tokenVal = identifierOrToken;
      const userVal = passwordOrUser;
      setSession(tokenVal, userVal);
      return { token: tokenVal, user: userVal };
    }

    // 2. Otherwise called with credentials: login(identifier, password)
    const res = await fetch(getFullUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifierOrToken,
        username: identifierOrToken,
        email: identifierOrToken,
        password: passwordOrUser
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }
    setSession(data.token, data.user);
    return data;
  };

  const register = async (name, email, username, password, otp) => {
    const res = await fetch(getFullUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, username, password, otp })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register');
    }
    setSession(data.token, data.user);
    return data;
  };

  const logout = () => {
    setSession(null, null);
  };

  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const targetUrl = getFullUrl(endpoint);

    const res = await fetch(targetUrl, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      throw new Error(data?.error || `Request failed with status ${res.status}`);
    }

    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, setSession, register, logout, apiFetch, API_BASE_URL, getFullUrl }}>
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
