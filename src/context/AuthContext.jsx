// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);   // gate rendering until we know

  // Fetch user role from user_profiles table
  const fetchUserRole = async (userId) => {
    if (!userId) {
      setUserRole(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        // If table doesn't exist or other error, default to null (no role)
        console.warn('[Auth] Could not fetch user role. Setting role to null. Error:', error.message);
        setUserRole(null);
        return;
      }

      if (!data) {
        // User has no profile yet, default to creator
        console.warn('[Auth] User profile not found. Defaulting to creator role.');
        setUserRole('creator');
        return;
      }

      setUserRole(data.role || 'creator');
    } catch (e) {
      // Catch any unexpected errors and don't crash the app
      console.warn('[Auth] Exception fetching user role. Defaulting to creator:', e.message);
      setUserRole('creator'); // Default to creator instead of admin
    }
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Auth] getSession error:', error);
        }
        if (!mounted) return;
        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchUserRole(currentUser.id);
        } else {
          setUserRole(null); // Important: reset role when no user
        }
      } catch (e) {
        console.error('[Auth] init exception:', e);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      } else {
        setUserRole(null);
      }
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
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message || 'Sign-out failed');
    // Réinitialiser manuellement les états
    setUser(null);
    setUserRole(null);
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
