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

import { da } from './translations/da';
import { en } from './translations/en';
import { et } from './translations/et';
import { fi } from './translations/fi';
import { lt } from './translations/lt';
import { lv } from './translations/lv';
import { no } from './translations/no';
import { sv } from './translations/sv';
import type { TranslationKey } from './types';

export type Language = 'fi' | 'en' | 'sv' | 'no' | 'et' | 'lt' | 'lv' | 'da';
export type Locale = 'fi-FI' | 'en-GB' | 'sv-SE' | 'nb-NO' | 'et-EE' | 'lt-LT' | 'lv-LV' | 'da-DK';

const STORAGE_KEY = 'golf-weather.language';

const DICTIONARIES = { fi, en, sv, no, et, lt, lv, da };
const LOCALES: Record<Language, Locale> = {
  fi: 'fi-FI',
  en: 'en-GB',
  sv: 'sv-SE',
  no: 'nb-NO',
  et: 'et-EE',
  lt: 'lt-LT',
  lv: 'lv-LV',
  da: 'da-DK',
};

function isLanguage(value: unknown): value is Language {
  return value === 'fi' || value === 'en' || value === 'sv' || value === 'no' || value === 'et' || value === 'lt' || value === 'lv' || value === 'da';
}

/** Uses the device's preferred language when there's no stored choice yet, defaulting to Finnish. */
function detectDeviceLanguage(): Language {
  const [primary] = Localization.getLocales();
  const code = primary?.languageCode;
  return isLanguage(code) ? code : 'fi';
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
