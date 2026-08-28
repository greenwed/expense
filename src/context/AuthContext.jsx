import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('rupee_user');
    return savedUser ? JSON.parse(savedUser) : null;
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
        const res = await fetch('/api/auth/me', {
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

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to login');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('rupee_token', data.token);
    localStorage.setItem('rupee_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (name, username, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('rupee_token', data.token);
    localStorage.setItem('rupee_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rupee_token');
    localStorage.removeItem('rupee_user');
  };

  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(endpoint, {
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
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, apiFetch }}>
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
