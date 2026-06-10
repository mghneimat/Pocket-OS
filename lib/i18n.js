/**
 * i18n system - simple translation helper
 * Supports EN and CS languages
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { getData, setData } from './storage';
import enTranslations from './locales/en.json';
import csTranslations from './locales/cs.json';

const translations = {
  en: enTranslations,
  cs: csTranslations,
};

const warnedKeys = new Set();

const I18nContext = createContext(null);

function normalizeLocale(locale) {
  if (translations[locale]) return locale;
  if (typeof locale === 'string') {
    if (locale.startsWith('en')) return 'en';
    if (locale.startsWith('cs')) return 'cs';
  }
  return 'en';
}

/**
 * Get nested object value by dot notation path
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., 'app.name')
 * @returns {any} Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Translate a key with optional interpolation
 * @param {string} locale - Current locale
 * @param {string} key - Translation key in dot notation
 * @param {Object} [params] - Optional parameters for interpolation
 * @returns {string} Translated string
 */
export function translate(locale, key, params = {}) {
  const resolvedLocale = normalizeLocale(locale);
  const translation = getNestedValue(translations[resolvedLocale], key);

  if (!translation) {
    const warnKey = `${resolvedLocale}:${key}`;
    if (!warnedKeys.has(warnKey)) {
      warnedKeys.add(warnKey);
      console.warn(`Translation missing for key: ${key} in locale: ${resolvedLocale}`);
    }
    return key;
  }

  if (typeof translation !== 'string') {
    const warnKey = `${resolvedLocale}:${key}:non-string`;
    if (!warnedKeys.has(warnKey)) {
      warnedKeys.add(warnKey);
      console.warn(`Translation key "${key}" resolved to a non-string in locale: ${resolvedLocale}`);
    }
    return key;
  }

  // Simple interpolation: replace {{param}} with values
  if (Object.keys(params).length > 0) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
  
  return translation;
}

/**
 * I18n Provider Component
 */
export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved locale from storage
    async function loadLocale() {
      try {
        const settings = await getData('pocketos_settings');
        if (settings?.language) {
          setLocaleState(settings.language);
        }
      } catch (error) {
        console.error('Error loading locale:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadLocale();
  }, []);

  const setLocale = async (newLocale) => {
    try {
      setLocaleState(newLocale);
      const settings = await getData('pocketos_settings') || {};
      await setData('pocketos_settings', { ...settings, language: newLocale });
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  };

  const t = (key, params) => translate(locale, key, params);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n in components
 * @returns {{ locale: string, setLocale: (locale: string) => void, t: (key: string, params?: Object) => string }}
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

/**
 * Simple t() function for use outside React components
 * Defaults to 'en' locale
 * @param {string} key - Translation key
 * @param {Object} [params] - Optional parameters
 * @returns {string} Translated string
 */
export function t(key, params) {
  return translate('en', key, params);
}
