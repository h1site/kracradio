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

  // Load user and their language preference on mount
  useEffect(() => {
    async function loadUserLanguage() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Get user's preferred language from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.preferred_language && dictionaries[profile.preferred_language]) {
            setLangState(profile.preferred_language);
          }
        }
      } catch (err) {
        console.error('Error loading user language:', err);
      }
    }

    loadUserLanguage();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        // Load language preference
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.preferred_language && dictionaries[profile.preferred_language]) {
          setLangState(profile.preferred_language);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setLangState(defaultLang);
      }
    });

    return () => {
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
        await supabase
          .from('profiles')
          .update({ preferred_language: newLang })
          .eq('id', userId);
      } catch (err) {
        console.error('Error saving language preference:', err);
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