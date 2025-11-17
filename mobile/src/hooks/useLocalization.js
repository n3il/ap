import { useState, useEffect } from 'react';
import { i18n, getLocales } from '@/config/i18n';

/**
 * Hook to use localization in React components
 * @returns {Object} { t: translation function, locale: current locale, changeLocale: function to change locale }
 */
export function useLocalization() {
  const [locale, setLocale] = useState(i18n.locale);

  useEffect(() => {
    // Update locale when device locale changes
    const deviceLocale = getLocales()[0];
    if (deviceLocale?.languageCode && deviceLocale.languageCode !== locale) {
      i18n.locale = deviceLocale.languageCode;
      setLocale(deviceLocale.languageCode);
    }
  }, []);

  /**
   * Translation function
   * @param {string} key - Translation key (e.g., 'login.title')
   * @param {Object} options - Optional parameters for interpolation
   * @returns {string} Translated string
   */
  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  /**
   * Change the app locale
   * @param {string} newLocale - New locale code (e.g., 'en', 'es', 'fr')
   */
  const changeLocale = (newLocale) => {
    i18n.locale = newLocale;
    setLocale(newLocale);
  };

  return { t, locale, changeLocale };
}
