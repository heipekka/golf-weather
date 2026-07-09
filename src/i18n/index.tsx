import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { en } from './translations/en';
import { fi } from './translations/fi';
import type { TranslationKey } from './types';

export type Language = 'fi' | 'en';
export type Locale = 'fi-FI' | 'en-GB';

const STORAGE_KEY = 'golf-weather.language';

const DICTIONARIES = { fi, en };
const LOCALES: Record<Language, Locale> = { fi: 'fi-FI', en: 'en-GB' };

function isLanguage(value: unknown): value is Language {
  return value === 'fi' || value === 'en';
}

/** Uses the device's preferred language when there's no stored choice yet, defaulting to Finnish. */
function detectDeviceLanguage(): Language {
  const [primary] = Localization.getLocales();
  return primary?.languageCode === 'en' ? 'en' : 'fi';
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

type LanguageContextValue = {
  language: Language;
  locale: Locale;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fi');

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        setLanguageState(isLanguage(stored) ? stored : detectDeviceLanguage());
      })
      .catch(() => {
        if (!cancelled) setLanguageState(detectDeviceLanguage());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = DICTIONARIES[language] as unknown as Record<string, unknown>;
      const value = key
        .split('.')
        .reduce<unknown>(
          (acc, part) => (acc && typeof acc === 'object' && part in acc ? (acc as Record<string, unknown>)[part] : undefined),
          dict
        );
      return typeof value === 'string' ? interpolate(value, params) : key;
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, locale: LOCALES[language], setLanguage, t }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return context;
}

export type { TranslationKey } from './types';
