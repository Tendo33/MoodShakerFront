/**
 * Locales index - centralized translation management
 * 
 * This module exports all translations and provides type-safe access
 * to translation keys across the application.
 */

import { cn, type TranslationKey as CnKey } from "./cn";
import { en, type TranslationKey as EnKey } from "./en";

// Supported languages
export type Language = "en" | "cn";

// Translation dictionary type
export type TranslationDictionary = Record<Language, Record<string, string>>;

// Combined translation key type (union of all language keys)
export type TranslationKey = CnKey | EnKey;

// Export translations object
export const translations: TranslationDictionary = {
  cn,
  en,
};

// Available languages with display names
export const availableLanguages: Record<Language, string> = {
  en: "English",
  cn: "中文",
};

// Default language
export const defaultLanguage: Language = "cn";

// Helper function to get translation
export function getTranslation(language: Language, key: string): string {
  return translations[language]?.[key] || key;
}

// Re-export individual translations for direct access
export { cn, en };
