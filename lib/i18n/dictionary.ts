import { cn } from "@/locales/cn";
import { en } from "@/locales/en";
import { type Locale } from "@/lib/i18n/config";

/**
 * Typed access to the translation dictionaries.
 *
 * `cn` is the reference: its keys define `TranslationKey`, and `en` is checked
 * against it at compile time. Previously both were `Record<string, string>` and
 * `t()` accepted any string, so a typo or a key that existed in only one language
 * rendered the key itself — users saw the literal text `nav.home`.
 *
 * Keys stay flat and dotted rather than nested objects. 16 of them are both a
 * leaf and a prefix (`spirits.gin` alongside `spirits.gin.description`), and a
 * nested shape cannot have one name be both a string and an object.
 */

export type TranslationKey = keyof typeof cn;

/**
 * Every language must supply exactly the reference key set.
 *
 * `Record<TranslationKey, string>` alone would accept extra keys, which is how a
 * dictionary drifts: a key gets renamed in one language and the old one lingers.
 */
type Dictionary = Record<TranslationKey, string>;

type ExactDictionary<T extends Dictionary> = T &
  Record<Exclude<keyof T, TranslationKey>, never>;

const dictionaries: Record<Locale, Dictionary> = {
  cn: cn satisfies ExactDictionary<typeof cn>,
  en: en satisfies ExactDictionary<typeof en>,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function translate(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key] ?? dictionaries.cn[key] ?? key;
}

/**
 * Resolves a key assembled at runtime from data, e.g. a spirit name coming from
 * the database.
 *
 * Returns `null` for an unknown key instead of echoing it, so a caller must
 * decide what to show. `t()` cannot express this: it is typed to reject a
 * non-literal key precisely so these sites are visible.
 */
export function translateDynamic(locale: Locale, key: string): string | null {
  return lookupOwn(dictionaries[locale], key) ?? lookupOwn(dictionaries.cn, key);
}

/**
 * Reads a dictionary entry without walking the prototype chain.
 *
 * Plain indexing would resolve `toString` to `Object.prototype.toString` and hand
 * a function back to a caller expecting a string — and these keys are assembled
 * from data, so the key is not always something we chose.
 */
function lookupOwn(dictionary: Dictionary, key: string): string | null {
  if (!Object.prototype.hasOwnProperty.call(dictionary, key)) return null;

  const value = (dictionary as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export function isTranslationKey(value: string): value is TranslationKey {
  return Object.prototype.hasOwnProperty.call(cn, value);
}
