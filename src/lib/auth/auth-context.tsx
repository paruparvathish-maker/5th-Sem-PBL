'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/pbl';
import { store } from '../data/store';
import { useRouter, usePathname } from 'next/navigation';
import { isExecutiveViewer } from './roles';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; requiresPasswordChange?: boolean; user?: UserProfile; error?: string; needsActivation?: boolean; email?: string }>;
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
      } catch (e) {
        console.error("Session restore failed", e);
      }
    }

    // Always sync database in background so mobile phones have latest credentials
    store.syncFromSupabase().catch(e => console.error("Initial background sync failed", e));
    setIsLoading(false);
  }, []);

  // Enforce Protected Route Guards & Role Redirects
  useEffect(() => {
    if (isLoading) return;

    const publicPages = ['/login', '/signup', '/register', '/forgot-password', '/activate'];
    const isPublic = pathname === '/' || publicPages.some(p => pathname.startsWith(p));

    if (!user && !isPublic) {
      router.push('/');
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

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; requiresPasswordChange?: boolean; user?: UserProfile; error?: string; needsActivation?: boolean; email?: string }> => {
    const cleanId = (identifier || '').trim();
    const cleanPass = password !== undefined ? (password || '').trim() : undefined;

    let foundUser = store.findUserByUsernameOrEmail(cleanId);

    // 1. Fast local verification if user profile is already cached with valid credentials and activated
    if (foundUser && cleanPass !== undefined && foundUser.isActivated !== false && store.verifyPassword(foundUser.id, cleanPass)) {
      setUser(foundUser);
      localStorage.setItem('pbl_session_user', JSON.stringify(foundUser));
      store.addAuditLog(foundUser.id, foundUser.name, foundUser.role, 'User Logged In', 'UserProfile', foundUser.id, {
        email: foundUser.email,
        usn: foundUser.usn,
        role: foundUser.role
      });
      fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: foundUser.id,
          userName: foundUser.name,
          userRole: foundUser.role,
          action: 'User Logged In',
          entityType: 'UserProfile',
          entityId: foundUser.id,
          details: { email: foundUser.email, usn: foundUser.usn, role: foundUser.role }
        })
      }).catch(() => {});

      if (foundUser.isFirstLogin) {
        return { success: true, requiresPasswordChange: true, user: foundUser };
      }
      return { success: true, requiresPasswordChange: false, user: foundUser };
    }

    // 2. Cross-device fallback: verify with server /api/auth/login
    // This allows phone logins to immediately authenticate if password was updated on a laptop/desktop!
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.user) {
          const authUser: UserProfile = data.user;
          
          // Update profile in local store
          const profiles = store.getAllProfiles();
          const pIdx = profiles.findIndex(p => p.id === authUser.id);
          if (pIdx >= 0) {
            profiles[pIdx] = { ...profiles[pIdx], ...authUser };
          } else {
            profiles.push(authUser);
          }
          store.save(true);

          // Update backup credentials in localStorage
          if (typeof window !== 'undefined' && authUser.password) {
            try {
              const creds = JSON.parse(localStorage.getItem('pbl_user_credentials_backup') || '{}');
              const record = {
                password: authUser.password,
                isFirstLogin: authUser.isFirstLogin,
                passwordUpdatedAt: authUser.passwordUpdatedAt
              };
              creds[authUser.id] = record;
              if (authUser.usn) creds[authUser.usn] = record;
              if (authUser.email) creds[authUser.email] = record;
              if (authUser.phone) creds[authUser.phone] = record;
              localStorage.setItem('pbl_user_credentials_backup', JSON.stringify(creds));
            } catch (e) {}
          }

          setUser(authUser);
          localStorage.setItem('pbl_session_user', JSON.stringify(authUser));
          store.addAuditLog(authUser.id, authUser.name, authUser.role, 'User Logged In', 'UserProfile', authUser.id, {
            email: authUser.email,
            usn: authUser.usn,
            role: authUser.role
          });
          fetch('/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authUser.id,
              userName: authUser.name,
              userRole: authUser.role,
              action: 'User Logged In',
              entityType: 'UserProfile',
              entityId: authUser.id,
              details: { email: authUser.email, usn: authUser.usn, role: authUser.role }
            })
          }).catch(() => {});

          // Background sync to ensure rest of store is fresh
          store.syncFromSupabase().catch(() => {});

          return {
            success: true,
            requiresPasswordChange: Boolean(data.requiresPasswordChange),
            user: authUser
          };
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        if (errData.error) {
          return {
            success: false,
            error: errData.error,
            needsActivation: Boolean(errData.needsActivation),
            email: errData.email
          };
        }
      }
    } catch (apiErr) {
      console.warn('API login call failed, checking local credentials:', apiErr);
    }

    // 3. Fallback error message if both local and server check failed
    if (!foundUser) {
      return { success: false, error: 'Invalid credentials. User not found in system.' };
    }

    if (foundUser.password && !foundUser.isFirstLogin && cleanPass && (cleanPass === foundUser.phone || cleanPass === foundUser.usn)) {
      return { success: false, error: 'Your initial credentials have expired. Please use your newly created password.' };
    }

    return { success: false, error: 'Invalid credentials. Incorrect password.' };
  };

  const changeFirstTimePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const cleanNewPass = newPassword.trim();
    const success = await store.updatePassword(user.id, cleanNewPass);
    if (success) {
      const updatedUser: UserProfile = { ...user, isFirstLogin: false, password: cleanNewPass };
      setUser(updatedUser);
      localStorage.setItem('pbl_session_user', JSON.stringify(updatedUser));

      // Direct sync to backend authentication APIs
      try {
        const getFastApiUrl = () => {
          if (typeof window !== 'undefined') {
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
              return '';
            }
            if (window.location.protocol === 'https:' && process.env.NEXT_PUBLIC_FASTAPI_URL?.startsWith('http://')) {
              return '';
            }
          }
          if (process.env.NEXT_PUBLIC_FASTAPI_URL && !process.env.NEXT_PUBLIC_FASTAPI_URL.includes('backend-beta-kohl-9pcedk6q96.vercel.app')) {
            return process.env.NEXT_PUBLIC_FASTAPI_URL;
          }
          return '';
        };

        const fastApiUrl = getFastApiUrl();
        if (fastApiUrl) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          await fetch(`${fastApiUrl}/api/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, newPassword: cleanNewPass }),
            mode: 'cors',
            signal: controller.signal
          }).catch(() => {}).finally(() => clearTimeout(timeoutId));
        }

        await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, newPassword: cleanNewPass })
        }).catch(() => {});
      } catch (err) {
        console.error('Remote change password sync error:', err);
      }
    }
    return success;
  };

  const logout = () => {
    if (user) {
      store.addAuditLog(user.id, user.name, user.role, 'User Logged Out', 'UserProfile', user.id, {
        email: user.email,
        usn: user.usn,
        role: user.role
      });
      try {
        const payload = JSON.stringify({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'User Logged Out',
          entityType: 'UserProfile',
          entityId: user.id,
          details: { email: user.email, usn: user.usn, role: user.role }
        });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/audit/log', payload);
        } else {
          fetch('/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      } catch {}
    }
    setUser(null);
    localStorage.removeItem('pbl_session_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.push('/');
    }
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
