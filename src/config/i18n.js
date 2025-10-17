import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';

// Set the key-value pairs for the different languages you want to support.
const i18n = new I18n({
  en,
  es,
  fr,
});

// Set the locale once at the beginning of your app.
// Get the device's locale
const deviceLocale = getLocales()[0];
i18n.locale = deviceLocale?.languageCode || 'en';

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export { i18n, getLocales };
