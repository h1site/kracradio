'use client';
// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Vérification...');

  useEffect(() => {
    let mounted = true;
    let authListener;

    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] URL:', window.location.href);
        console.log('[AuthCallback] Search params:', window.location.search);

        setStatus('Connexion en cours...');

        // Listen for auth state changes FIRST
        const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[AuthCallback] Auth event:', event, session?.user?.email || 'no user');

          if (event === 'SIGNED_IN' && session) {
            console.log('[AuthCallback] ✓ User signed in:', session.user.email);
            if (mounted) {
              setStatus('Connexion réussie! Redirection...');
              router.push('/profile', { replace: true });
            }
          }
        });

        authListener = authData.subscription;

        // Check if we have an authorization code (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          console.log('[AuthCallback] Authorization code detected, exchanging for session...');

          // Exchange the code for a session (async, listener will catch the SIGNED_IN event)
          supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            if (error) {
              console.error('[AuthCallback] Error exchanging code:', error);
            } else {
              console.log('[AuthCallback] Code exchange completed:', data?.session?.user?.email);
            }
          });

          // Don't wait for the exchange, the listener will handle it
          return;
        }

        // Also try to get session immediately
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Error getting session:', error);
          if (mounted) {
            setStatus('Erreur de connexion');
            setTimeout(() => {
              router.push('/login');
            }, 1000);
          }
          return;
        }

        if (session) {
          console.log('[AuthCallback] ✓ Session already exists:', session.user.email);
          if (mounted) {
            setStatus('Déjà connecté! Redirection...');
            router.push('/profile', { replace: true });
          }
          return;
        }

        // If no session after 3 seconds, something went wrong
        setTimeout(() => {
          if (mounted) {
            console.warn('[AuthCallback] Timeout waiting for session');
            router.push('/login');
          }
        }, 3000);

      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        if (mounted) {
          setStatus('Erreur inattendue');
          setTimeout(() => {
            router.push('/login');
          }, 1000);
        }
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          {status}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Veuillez patienter
        </p>
      </div>
    </div>
  );
}
