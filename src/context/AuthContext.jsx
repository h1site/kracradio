'use client';
// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Fetch user role from profiles table
  const fetchUserRole = useCallback(async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('[Auth] Failed to fetch user role:', profileError);
        return 'user';
      }
      return profileData?.role || 'user';
    } catch (err) {
      console.warn('[Auth] Error fetching user role:', err);
      return 'user';
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    console.log('[Auth] Setting up auth listener...');

    // Utiliser uniquement onAuthStateChange - ne pas appeler getSession() qui peut bloquer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('[Auth] Event:', event, session?.user?.email || 'no user');

      // Handle token refresh errors - clear invalid session
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[Auth] Token refresh failed, clearing session');
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // Fetch role in background (non-blocking)
      if (currentUser) {
        fetchUserRole(currentUser.id).then(role => {
          if (isMounted) setUserRole(role);
        });
      } else {
        setUserRole(null);
      }
    });

    // Check for invalid refresh token on mount
    supabase.auth.getSession().then(({ error }) => {
      if (error?.message?.includes('Refresh Token')) {
        console.warn('[Auth] Invalid refresh token, signing out');
        supabase.auth.signOut();
      }
    });

    return () => {
      console.log('[Auth] Cleanup');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserRole]);

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message || 'Sign-up failed');

    // Auto-login après inscription
    if (data.user) {
      setUser(data.user);
      setUserRole('user');
    }

    return data;
  };

  const signInWithGoogle = async () => {
    const isProduction = window.location.hostname === 'kracradio.com' ||
                        window.location.hostname === 'www.kracradio.com';
    const redirectUrl = isProduction
      ? 'https://kracradio.com/auth/callback'
      : `${window.location.origin}/auth/callback`;

    console.log('[Auth] signInWithGoogle redirectUrl:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) throw new Error(error.message || 'Google sign-in failed');
    return data;
  };

  const signOut = async () => {
    if (signingOut) {
      console.log('[Auth] signOut already in progress, ignoring');
      return;
    }

    console.log('[Auth] signOut called');
    setSigningOut(true);

    // Nettoyer l'état local immédiatement
    setUser(null);
    setUserRole(null);

    try {
      // Nettoyer localStorage AVANT l'appel API
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();

      // Appeler signOut avec scope local pour être sûr
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        console.error('[Auth] signOut error:', error);
        // Ne pas throw - la session locale est déjà nettoyée
      }
      console.log('[Auth] signOut successful');
    } catch (e) {
      console.error('[Auth] signOut exception:', e);
      // Session locale déjà nettoyée, ignorer l'erreur
    } finally {
      setSigningOut(false);
    }
  };

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
    signInWithGoogle,
    signOut,
    isAdmin,
    isCreator,
    isUser,
    hasRole
  }), [user, userRole, loading, signingOut]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
