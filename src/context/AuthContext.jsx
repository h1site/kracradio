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
          // Fetch the real role from profiles table
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .single();

            if (profileError) {
              console.warn('[Auth] Failed to fetch user role:', profileError);
              setUserRole('user'); // Default to 'user' if fetch fails
            } else {
              setUserRole(profileData?.role || 'user');
            }
          } catch (err) {
            console.warn('[Auth] Error fetching user role:', err);
            setUserRole('user');
          }
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

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change:', event, session?.user?.email || 'no user');

      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('[Auth] User signed out, clearing state');
        setUser(null);
        setUserRole(null);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch the real role from profiles table
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

          if (profileError) {
            console.warn('[Auth] Failed to fetch user role on auth change:', profileError);
            setUserRole('user');
          } else {
            setUserRole(profileData?.role || 'user');
          }
        } catch (err) {
          console.warn('[Auth] Error fetching user role on auth change:', err);
          setUserRole('user');
        }
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

    // Block sign-in until Supabase email confirmation is complete
    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    // Update the profile flag if it exists (best-effort)
    if (data?.user?.email_confirmed_at) {
      try {
        await supabase
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', data.user.id);
      } catch (updateError) {
        console.warn('Unable to sync profile email_verified flag:', updateError);
      }
    }

    return data;
  };

  const signUp = async ({ email, password }) => {
    // Configuration pour l'envoi d'email de confirmation
    const options = {
      emailRedirectTo: `${process.env.REACT_APP_URL || window.location.origin}/auth/verify-email`
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });

    if (error) throw new Error(error.message || 'Sign-up failed');
    return data;
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');
    try {
      // Call Supabase signOut FIRST to properly clear the session
      // Use scope: 'local' to clear only this browser's session
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('[Auth] signOut error:', error);
        throw error;
      }
      console.log('[Auth] signOut successful');

      // Clear local state after Supabase confirms sign out
      setUser(null);
      setUserRole(null);

      // Clear storage to ensure no stale data remains
      localStorage.clear();
      sessionStorage.clear();
      console.log('[Auth] Local storage cleared');
    } catch (e) {
      console.error('[Auth] signOut exception:', e);
      // Even on error, force cleanup
      setUser(null);
      setUserRole(null);
      localStorage.clear();
      sessionStorage.clear();
      throw e; // Re-throw to let caller handle
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
