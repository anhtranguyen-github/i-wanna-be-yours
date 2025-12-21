'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_SESSION_EXPIRED_EVENT } from '@/lib/authFetch';

interface User {
  id: number;
  email: string;
  role: string;
  is_verified: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  handleSessionExpired: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    router.refresh();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Handle session expiry - just clear user state, don't redirect
  // The GlobalAuth modal will be triggered by the event listener
  const handleSessionExpired = useCallback(() => {
    console.log('[UserContext] Session expired, clearing user state');
    setUser(null);
    // Don't call logout API since session is already invalid
    // Don't redirect - let the auth modal handle it
  }, []);

  // Listen for session expiry events from authFetch
  useEffect(() => {
    const handler = () => {
      handleSessionExpired();
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handler);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handler);
    };
  }, [handleSessionExpired]);

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser, handleSessionExpired }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
