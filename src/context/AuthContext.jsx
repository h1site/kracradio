// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);   // gate rendering until we know
  const [signingOut, setSigningOut] = useState(false); // prevent multiple signOut calls

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    // Check if we're in an OAuth callback flow
    const isOAuthCallback = window.location.pathname === '/auth/callback' &&
                            window.location.search.includes('code=');

    console.log('[Auth] useEffect starting, isOAuthCallback:', isOAuthCallback);

    async function init() {
      console.log('[Auth] init() starting...');

      // If we're in OAuth callback, skip init entirely - let onAuthStateChange handle it
      if (isOAuthCallback) {
        console.log('[Auth] OAuth callback detected, skipping init - onAuthStateChange will handle it');
        return;
      }

      try {
        console.log('[Auth] Getting session...');

        // Add timeout to prevent hanging
        const getSessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => {
            console.warn('[Auth] getSession timeout after 3s');
            resolve({ data: { session: null }, error: null });
          }, 3000)
        );

        const { data } = await Promise.race([getSessionPromise, timeoutPromise]);
        console.log('[Auth] Session retrieved:', data?.session?.user?.email || 'no session');

        if (!mounted) {
          console.log('[Auth] Component unmounted, exiting init');
          return;
        }

        const currentUser = data?.session?.user ?? null;
        console.log('[Auth] Setting user:', currentUser?.email || 'null');
        setUser(currentUser);

        if (currentUser) {
          console.log('[Auth] User exists, fetching role from profiles table');
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .maybeSingle();

            if (profileError) {
              console.warn('[Auth] Failed to fetch user role:', profileError);
              setUserRole('user');
            } else {
              const role = profileData?.role || 'user';
              setUserRole(role);
              console.log('[Auth] Role set to:', role);
            }
          } catch (err) {
            console.warn('[Auth] Error fetching user role:', err);
            setUserRole('user');
          }
        } else {
          console.log('[Auth] No user, setting role to null');
          setUserRole(null);
        }

        console.log('[Auth] init() try block completed successfully');
      } catch (e) {
        console.error('[Auth] init error:', e);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          console.log('[Auth] Setting loading to false');
          setLoading(false);
          console.log('[Auth] Loading set to false');
        }
      }
      console.log('[Auth] init() function completed');
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
      console.log('[Auth] onAuthStateChange setting user:', currentUser?.email || 'null');
      setUser(currentUser);

      if (currentUser) {
        // If this is a SIGNED_IN event during OAuth callback, set loading to false IMMEDIATELY
        if (event === 'SIGNED_IN' && isOAuthCallback) {
          console.log('[Auth] SIGNED_IN during OAuth callback, setting loading to false immediately');
          setLoading(false);
        }

        console.log('[Auth] Fetching role from profiles table on auth change');

        // Fetch role with timeout
        const fetchRolePromise = supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => {
            console.warn('[Auth] Profile fetch timeout, using default role');
            resolve({ data: null, error: null });
          }, 2000)
        );

        try {
          const { data: profileData, error: profileError } = await Promise.race([fetchRolePromise, timeoutPromise]);

          if (profileError) {
            console.warn('[Auth] Failed to fetch user role on auth change:', profileError);
            setUserRole('user');
          } else {
            const role = profileData?.role || 'user';
            setUserRole(role);
            console.log('[Auth] Role set to:', role);
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
      emailRedirectTo: `${process.env.REACT_APP_SITE_URL || window.location.origin}/verify-email`
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });

    if (error) throw new Error(error.message || 'Sign-up failed');
    return data;
  };

  const signInWithGoogle = async () => {
    // Determine the correct redirect URL based on environment
    const isProduction = window.location.hostname === 'kracradio.com' ||
                        window.location.hostname === 'www.kracradio.com';
    const redirectUrl = isProduction
      ? 'https://kracradio.com/auth/callback'
      : `${window.location.origin}/auth/callback`;

    console.log('[Auth] signInWithGoogle redirectUrl:', redirectUrl);

    // Use PKCE flow which works better with localhost
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

    // The browser will redirect automatically, don't need to return anything
    return data;
  };

  const signOut = async () => {
    // Prevent multiple simultaneous signOut calls
    if (signingOut) {
      console.log('[Auth] signOut already in progress, ignoring');
      return;
    }

    console.log('[Auth] signOut called');
    setSigningOut(true);

    try {
      // Create a promise with timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      );

      // Race between signOut and timeout
      const { error } = await Promise.race([signOutPromise, timeoutPromise]);

      if (error) {
        console.error('[Auth] signOut error:', error);
        throw error;
      }
      console.log('[Auth] signOut successful');

      // Clear local state after Supabase confirms sign out
      setUser(null);
      setUserRole(null);

      // Clear only Supabase auth keys instead of wiping everything
      // This preserves user preferences like theme, language, etc.
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      console.log('[Auth] Auth storage cleared');
    } catch (e) {
      console.error('[Auth] signOut exception:', e);
      // Even on error, force cleanup
      setUser(null);
      setUserRole(null);

      // Clear only Supabase auth keys on error too
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      throw e; // Re-throw to let caller handle
    } finally {
      setSigningOut(false);
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
    signInWithGoogle,
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
