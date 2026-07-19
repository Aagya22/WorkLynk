import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  role: 'employee' | 'hr_manager' | 'admin';
  mfaEnabled: boolean;
  createdAt?: string;
  passwordChangedAt?: string;
  previousLogin?: string | null;
  previousLoginIP?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, captchaText: string, captchaKey: string) => Promise<any>;
  verifyMfa: (tempToken: string, code: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data?.user) {
        const u = response.data.user;
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check cache first for immediate layout UI load
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, password: string, captchaText: string, captchaKey: string) => {
    const response = await api.post('/api/auth/login', { email, password, captchaText, captchaKey });

    if (response.data?.user) {
      const u = response.data.user;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    }
    return response.data;
  };

  const verifyMfa = async (tempToken: string, code: string) => {
    const response = await api.post('/api/auth/mfa/verify', { tempToken, code });
    if (response.data?.user) {
      const u = response.data.user;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMfa, logout, updateUser, checkAuth }}>
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
