'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { Admin } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  admin: Admin | null;
  user: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAssistant: boolean;
  assignedDoctor: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.success && (res.data.data?.admin || (res.data as any).admin || (res.data as any).user)) {
        const u = res.data.data?.admin || (res.data as any).user || (res.data as any).admin;
        if (u?.name === 'System Administrator' || u?.name === 'Administrator') {
          u.name = 'Admin';
        }
        setAdmin(u);
        sessionStorage.setItem('dt_admin', JSON.stringify(u));
      }
    } catch {
      // Ignore background refresh failure
    }
  }, []);

  // Initialize from sessionStorage on mount (and clean legacy localStorage)
  useEffect(() => {
    try {
      // Clean any lingering permanent storage from previous sessions
      localStorage.removeItem('dt_token');
      localStorage.removeItem('dt_admin');
    } catch {
      // ignore
    }

    const storedToken = sessionStorage.getItem('dt_token');
    const storedAdmin = sessionStorage.getItem('dt_admin');

    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        const parsed = JSON.parse(storedAdmin);
        if (parsed?.name === 'System Administrator' || parsed?.name === 'Administrator') {
          parsed.name = 'Admin';
          sessionStorage.setItem('dt_admin', JSON.stringify(parsed));
        }
        setAdmin(parsed);
      } catch {
        sessionStorage.removeItem('dt_token');
        sessionStorage.removeItem('dt_admin');
      }
    }
    setIsLoading(false);
  }, []);

  // Proactively sync profile on mount, on window focus, and on polling for instant reassignment detection
  useEffect(() => {
    if (!token) return;
    refreshProfile();

    const onFocus = () => refreshProfile();

    window.addEventListener('focus', onFocus);

    const interval = setInterval(() => {
      refreshProfile();
    }, 8000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [token, refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    if (data.success) {
      const userData = (data.user || data.admin) as Admin;
      if (userData.name === 'System Administrator' || userData.name === 'Administrator') {
        userData.name = 'Admin';
      }
      if (data.token) {
        sessionStorage.setItem('dt_token', data.token);
        sessionStorage.setItem('dt_admin', JSON.stringify(userData));
        setToken(data.token);
        setAdmin(userData);
      }
      router.push('/dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('dt_token');
    sessionStorage.removeItem('dt_admin');
    localStorage.removeItem('dt_token');
    localStorage.removeItem('dt_admin');
    setToken(null);
    setAdmin(null);
    router.push('/login');
  }, [router]);

  const isAdmin = admin?.role === 'admin';
  const isAssistant = admin?.role === 'assistant';
  const assignedDoctor = admin?.assignedDoctor;

  return (
    <AuthContext.Provider
      value={{
        admin,
        user: admin,
        token,
        isLoading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!token && !!admin,
        isAdmin,
        isAssistant,
        assignedDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
