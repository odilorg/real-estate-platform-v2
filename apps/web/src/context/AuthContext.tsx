'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { getMe, logout as authLogout, getToken, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      // Try to get user data - works with both localStorage token and HTTP-only cookie
      const userData = await getMe();
      setUser(userData);
      console.log('AuthContext: User refreshed successfully', userData.id);
    } catch (error: any) {
      // Not authenticated (no valid token in localStorage or cookie)
      const token = getToken();
      console.error('AuthContext: Failed to refresh user', error);

      // Only clear token if we get a 401 Unauthorized
      if (error?.message?.includes('401') || error?.status === 401) {
        if (token) {
          console.warn('AuthContext: Invalid token found, logging out');
          authLogout();
        }
        setUser(null);
      } else {
        // For other errors (network, 500, etc), don't log out immediately
        // allowing retries or keeping the optimistic state if possible
        console.warn('AuthContext: Non-401 error, keeping token if present');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    // Redirect to home page after logout
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
