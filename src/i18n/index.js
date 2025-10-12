import React, { createContext, useContext, useMemo, useState } from 'react';
import en from './en.json';
import fr from './fr.json';
import es from './es.json';


const dictionaries = { en, fr, es };


const I18nContext = createContext();


export function I18nProvider({ children, defaultLang = 'fr' }) {
const [lang, setLang] = useState(defaultLang);
const dict = dictionaries[lang] || dictionaries.fr;
const ctx = useMemo(() => ({ t: dict, lang, setLang }), [dict, lang]);
return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
}


export function useI18n() {
return useContext(I18nContext);
}