import arTranslations from '../locales/ar.json';
import enTranslations from '../locales/en.json';
import swTranslations from '../locales/sw.json';
import rwTranslations from '../locales/rw.json';
import nyTranslations from '../locales/ny.json';

export type SupportedLanguageCode = 'ar' | 'en' | 'sw' | 'rw' | 'ny';
export type SupportedCountryCode = 'sudan' | 'rwanda' | 'kenya' | 'uganda' | 'ghana' | 'malawi';
export type LayoutDirection = 'rtl' | 'ltr';

export interface CountryConfig {
  id: SupportedCountryCode;
  nameEn: string;
  nameNative: string;
  flag: string;
  primaryLanguage: SupportedLanguageCode;
  fallbackLanguage: SupportedLanguageCode;
  direction: LayoutDirection;
}

export type LocaleStrings = typeof enTranslations;

export const COUNTRY_CONFIGS: Record<SupportedCountryCode, CountryConfig> = {
  sudan: {
    id: 'sudan',
    nameEn: 'Sudan',
    nameNative: 'السودان',
    flag: '🇸🇩',
    primaryLanguage: 'ar',
    fallbackLanguage: 'en',
    direction: 'rtl'
  },
  rwanda: {
    id: 'rwanda',
    nameEn: 'Rwanda',
    nameNative: 'Rwanda',
    flag: '🇷🇼',
    primaryLanguage: 'rw',
    fallbackLanguage: 'en',
    direction: 'ltr'
  },
  kenya: {
    id: 'kenya',
    nameEn: 'Kenya',
    nameNative: 'Kenya',
    flag: '🇰🇪',
    primaryLanguage: 'sw',
    fallbackLanguage: 'en',
    direction: 'ltr'
  },
  uganda: {
    id: 'uganda',
    nameEn: 'Uganda',
    nameNative: 'Uganda',
    flag: '🇺🇬',
    primaryLanguage: 'en',
    fallbackLanguage: 'sw',
    direction: 'ltr'
  },
  ghana: {
    id: 'ghana',
    nameEn: 'Ghana',
    nameNative: 'Ghana',
    flag: '🇬🇭',
    primaryLanguage: 'en',
    fallbackLanguage: 'en',
    direction: 'ltr'
  },
  malawi: {
    id: 'malawi',
    nameEn: 'Malawi',
    nameNative: 'Malawi',
    flag: '🇲🇼',
    primaryLanguage: 'ny',
    fallbackLanguage: 'en',
    direction: 'ltr'
  }
};

export const RAW_DICTIONARIES: Record<SupportedLanguageCode, Record<string, string>> = {
  ar: arTranslations,
  en: enTranslations,
  sw: swTranslations,
  rw: rwTranslations,
  ny: nyTranslations
};

/**
 * Creates a merged string object with safe fallback hierarchy.
 * If a key is missing in primary locale, it checks fallback locale, then English.
 */
export function getStringsForCountry(countryCode: SupportedCountryCode): LocaleStrings {
  const config = COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS.sudan;
  const primaryDict = RAW_DICTIONARIES[config.primaryLanguage] || RAW_DICTIONARIES.en;
  const fallbackDict = RAW_DICTIONARIES[config.fallbackLanguage] || RAW_DICTIONARIES.en;
  const enDict = RAW_DICTIONARIES.en;

  // Build safe proxy with 3-tier fallback
  const result: Record<string, string> = {};
  const allKeys = Object.keys(enDict) as (keyof LocaleStrings)[];

  for (const key of allKeys) {
    result[key] = primaryDict[key] || fallbackDict[key] || enDict[key] || '';
  }

  return result as LocaleStrings;
}

// Backward compatibility alias for legacy imports
export type SupportedLocale = SupportedLanguageCode;
export const STRINGS: Record<SupportedLanguageCode, LocaleStrings> = {
  ar: getStringsForCountry('sudan'),
  rw: getStringsForCountry('rwanda'),
  sw: getStringsForCountry('kenya'),
  en: getStringsForCountry('ghana'),
  ny: getStringsForCountry('malawi')
};
