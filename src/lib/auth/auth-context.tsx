'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/pbl';
import { store } from '../data/store';
import { useRouter, usePathname } from 'next/navigation';
import { isExecutiveViewer } from './roles';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => { success: boolean; requiresPasswordChange?: boolean; user?: UserProfile; error?: string };
  logout: () => void;
  changeFirstTimePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check saved session in localStorage
    const savedUser = localStorage.getItem('pbl_session_user');
    if (savedUser) {
      try {
        const parsed: UserProfile = JSON.parse(savedUser);
        // Refresh profile from store
        const refreshed = store.getAllProfiles().find(p => p.id === parsed.id);
        if (refreshed) {
          setUser(refreshed);
        } else {
          setUser(parsed);
        }
        
        // Background sync to ensure we have the latest data across devices
        store.syncFromSupabase().catch(e => console.error("Background sync failed", e));
        
      } catch (e) {
        console.error("Session restore failed", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Enforce Protected Route Guards & Role Redirects
  useEffect(() => {
    if (isLoading) return;

    const publicPages = ['/login'];
    const isPublic = publicPages.some(p => pathname.startsWith(p));

    if (!user && !isPublic) {
      router.push('/login');
      return;
    }

    if (user) {
      // Force first time password change if required
      if (user.isFirstLogin && pathname !== '/first-time-password-change') {
        router.push('/first-time-password-change');
        return;
      }

      // Role Based Access Guard
      if (pathname.startsWith('/student') && user.role !== 'student') {
        router.push(user.role === 'faculty' ? '/faculty/dashboard' : '/admin/dashboard');
      } else if (pathname.startsWith('/faculty') && user.role !== 'faculty') {
        router.push(user.role === 'student' ? '/student/dashboard' : '/admin/dashboard');
      } else if (pathname.startsWith('/admin') && user.role !== 'admin') {
        router.push(user.role === 'student' ? '/student/dashboard' : '/faculty/dashboard');
      } else if (user.role === 'admin' && isExecutiveViewer(user)) {
        // Executive leadership (HOD, Principal, Industry Expert) can view 4th sem papers & 5th sem projects only
        const restrictedAdminPaths = [
          '/admin/deadlines',
          '/admin/students',
          '/admin/faculty',
          '/admin/import',
          '/admin/audit-logs'
        ];
        if (restrictedAdminPaths.some(p => pathname.startsWith(p))) {
          router.push('/admin/teams');
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (identifier: string, password?: string) => {
    const foundUser = store.findUserByUsernameOrEmail(identifier);
    if (!foundUser) {
      return { success: false, error: 'Invalid credentials. User not found in system.' };
    }

    if (password !== undefined && !store.verifyPassword(foundUser.id, password)) {
      if (foundUser.password && !foundUser.isFirstLogin && (password === foundUser.phone || password === foundUser.usn)) {
        return { success: false, error: 'Your initial credentials have expired. Please use your newly created password.' };
      }
      return { success: false, error: 'Invalid credentials. Incorrect password.' };
    }

    setUser(foundUser);
    localStorage.setItem('pbl_session_user', JSON.stringify(foundUser));
    store.addAuditLog(foundUser.id, foundUser.name, foundUser.role, 'User Logged In', 'UserProfile', foundUser.id);

    if (foundUser.isFirstLogin) {
      return { success: true, requiresPasswordChange: true, user: foundUser };
    }

    return { success: true, requiresPasswordChange: false, user: foundUser };
  };

  const changeFirstTimePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const success = await store.updatePassword(user.id, newPassword);
    if (success) {
      const updatedUser: UserProfile = { ...user, isFirstLogin: false, password: newPassword };
      setUser(updatedUser);
      localStorage.setItem('pbl_session_user', JSON.stringify(updatedUser));

      // Direct sync to backend authentication APIs
      try {
        const getFastApiUrl = () => {
          if (process.env.NEXT_PUBLIC_FASTAPI_URL) return process.env.NEXT_PUBLIC_FASTAPI_URL;
          if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return 'https://backend-beta-kohl-9pcedk6q96.vercel.app';
          }
          return 'http://127.0.0.1:8000';
        };

        const fastApiUrl = getFastApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        await fetch(`${fastApiUrl}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, newPassword }),
          mode: 'cors',
          signal: controller.signal
        }).catch(() => {}).finally(() => clearTimeout(timeoutId));

        await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, newPassword })
        }).catch(() => {});
      } catch (err) {
        console.error('Remote change password sync error:', err);
      }
    }
    return success;
  };

  const logout = () => {
    if (user) {
      store.addAuditLog(user.id, user.name, user.role, 'User Logged Out', 'UserProfile', user.id);
    }
    setUser(null);
    localStorage.removeItem('pbl_session_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, changeFirstTimePassword }}>
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
