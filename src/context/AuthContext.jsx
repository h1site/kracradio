// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);   // gate rendering until we know

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Set role to creator by default without fetching
          setUserRole('creator');
        } else {
          setUserRole(null);
        }
      } catch (e) {
        console.error('[Auth] init error:', e);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole(null);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setUserRole(currentUser ? 'creator' : null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Sign-in failed');
    return data;
  };

  const signUp = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message || 'Sign-up failed');
    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] signOut error, forcing cleanup:', e);
    } finally {
      // Force cleanup local
      setUser(null);
      setUserRole(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  // Helper functions to check user roles
  const isAdmin = () => userRole === 'admin';
  const isCreator = () => userRole === 'creator' || userRole === 'admin';
  const isUser = () => userRole === 'user';
  const hasRole = (role) => userRole === role;

  const value = useMemo(() => ({
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isCreator,
    isUser,
    hasRole
  }), [user, userRole, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
