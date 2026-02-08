import React, { createContext, useState, useEffect } from 'react';
import translations from '../locales/translations.json';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fa');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('theme', theme);
    localStorage.setItem('lang', lang);
  }, [theme, lang]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const toggleLang = () => setLang(prev => (prev === 'fa' ? 'en' : 'fa'));

  return (
    <SettingsContext.Provider value={{ theme, lang, toggleTheme, toggleLang, strings: translations[lang] }}>
      {children}
    </SettingsContext.Provider>
  );
};