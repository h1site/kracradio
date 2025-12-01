'use client';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import en from './en.json';
import fr from './fr.json';
import es from './es.json';


const dictionaries = { en, fr, es };


const I18nContext = createContext();


export function I18nProvider({ children, defaultLang = 'en' }) {
  const [lang, setLangState] = useState(defaultLang);
  const [userId, setUserId] = useState(null);

  // Load user language preference via onAuthStateChange only
  useEffect(() => {
    let isMounted = true;

    const loadLanguageForUser = async (user) => {
      if (!user || !isMounted) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .maybeSingle();

        // Silently ignore if column doesn't exist (42703) - migration may not be applied yet
        if (error?.code === '42703') {
          return;
        }

        if (isMounted && profile?.preferred_language && dictionaries[profile.preferred_language]) {
          setLangState(profile.preferred_language);
        }
      } catch (err) {
        // Silently ignore column-not-found errors
        if (err?.code !== '42703') {
          console.error('Error loading user language:', err);
        }
      }
    };

    // Listen for auth changes - this will fire INITIAL_SESSION on page load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        loadLanguageForUser(session.user);
      } else {
        setUserId(null);
        setLangState(defaultLang);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [defaultLang]);

  // Wrapped setLang that also saves to profile
  const setLang = useCallback(async (newLang) => {
    if (!dictionaries[newLang]) return;

    setLangState(newLang);

    // Save to profile if user is logged in
    if (userId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: newLang })
          .eq('id', userId);

        // Silently ignore if column doesn't exist yet
        if (error && error.code !== '42703') {
          console.error('Error saving language preference:', error);
        }
      } catch (err) {
        // Silently ignore column-not-found errors
        if (err?.code !== '42703') {
          console.error('Error saving language preference:', err);
        }
      }
    }
  }, [userId]);

  const dict = dictionaries[lang] || dictionaries.en;
  const ctx = useMemo(() => ({ t: dict, lang, setLang }), [dict, lang, setLang]);
  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
}


export function useI18n() {
  return useContext(I18nContext);
}