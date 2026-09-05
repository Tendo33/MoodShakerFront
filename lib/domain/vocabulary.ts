/**
 * Single source of truth for the closed vocabularies: base spirit, alcohol
 * level, flavour profile, and skill level.
 *
 * These four concepts used to be stored as free text (`base_spirit: "朗姆酒"`),
 * which forced every boundary to do bilingual substring matching and spawned
 * `normalizeAlcoholLevel`, `normalizeBaseSpirit`, `inferEnglishBaseSpirit`,
 * `inferEnglishAlcoholLevel` and three keyword maps. They are enumerable, so
 * they are stored as codes and rendered through the label maps below.
 *
 * Before this module there were three disagreeing sets:
 *   - `SPIRIT_FILTER_KEYWORDS` etc. in `lib/cocktail-data.ts`
 *   - the `AlcoholLevel` / `DifficultyLevel` enums in `lib/cocktail-types.ts`
 *   - the hand-written JSON schema text in `utils/prompts.ts`
 *
 * Notable reconciliations, recorded because they were silent conflicts:
 *   - Flavours: the filter map had `salty`/`creamy` while the prompt had
 *     `floral`/`refreshing`/`other`. The union is used, so nothing that was
 *     previously filterable or generatable is lost.
 *   - Skill: the questionnaire answers `beginner`/`intermediate`/`advanced` but
 *     `DifficultyLevel` said `easy`/`medium`/`hard`. The questionnaire wins
 *     because it is what users actually send.
 *   - Alcohol: `normalizeAlcoholLevel` turned codes into the display strings
 *     `低度`/`中度`/`高度` inside the data layer. Codes stay codes here; display
 *     text is a rendering concern.
 *
 * Label maps live here for now so display text has one home during the
 * refactor. They move into the i18n dictionaries once those are namespaced,
 * at which point this module keeps only the codes.
 */

export const BASE_SPIRITS = [
  "gin",
  "vodka",
  "rum",
  "tequila",
  "whiskey",
  "brandy",
  "other",
  "none",
] as const;

export const ALCOHOL_LEVELS = ["none", "low", "medium", "high"] as const;

export const FLAVOR_PROFILES = [
  "sweet",
  "sour",
  "bitter",
  "spicy",
  "fruity",
  "herbal",
  "floral",
  "smoky",
  "refreshing",
  "creamy",
  "salty",
  "other",
] as const;

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type BaseSpirit = (typeof BASE_SPIRITS)[number];
export type AlcoholLevelCode = (typeof ALCOHOL_LEVELS)[number];
export type FlavorProfile = (typeof FLAVOR_PROFILES)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type VocabularyLocale = "cn" | "en";

type LabelMap<T extends string> = Record<T, Record<VocabularyLocale, string>>;

export const BASE_SPIRIT_LABELS: LabelMap<BaseSpirit> = {
  gin: { cn: "金酒", en: "Gin" },
  vodka: { cn: "伏特加", en: "Vodka" },
  rum: { cn: "朗姆酒", en: "Rum" },
  tequila: { cn: "龙舌兰", en: "Tequila" },
  whiskey: { cn: "威士忌", en: "Whiskey" },
  brandy: { cn: "白兰地", en: "Brandy" },
  other: { cn: "其他", en: "Other" },
  none: { cn: "无酒精", en: "Non-alcoholic" },
};

export const ALCOHOL_LEVEL_LABELS: LabelMap<AlcoholLevelCode> = {
  none: { cn: "无酒精", en: "Non-alcoholic" },
  low: { cn: "低度", en: "Low" },
  medium: { cn: "中度", en: "Medium" },
  high: { cn: "高度", en: "High" },
};

export const FLAVOR_PROFILE_LABELS: LabelMap<FlavorProfile> = {
  sweet: { cn: "甜", en: "Sweet" },
  sour: { cn: "酸", en: "Sour" },
  bitter: { cn: "苦", en: "Bitter" },
  spicy: { cn: "辛辣", en: "Spicy" },
  fruity: { cn: "果味", en: "Fruity" },
  herbal: { cn: "草本", en: "Herbal" },
  floral: { cn: "花香", en: "Floral" },
  smoky: { cn: "烟熏", en: "Smoky" },
  refreshing: { cn: "清爽", en: "Refreshing" },
  creamy: { cn: "奶香", en: "Creamy" },
  salty: { cn: "咸", en: "Salty" },
  other: { cn: "其他", en: "Other" },
};

export const SKILL_LEVEL_LABELS: LabelMap<SkillLevel> = {
  beginner: { cn: "新手", en: "Beginner" },
  intermediate: { cn: "进阶", en: "Intermediate" },
  advanced: { cn: "高级", en: "Advanced" },
};

export function isBaseSpirit(value: unknown): value is BaseSpirit {
  return (
    typeof value === "string" &&
    (BASE_SPIRITS as readonly string[]).includes(value)
  );
}

export function isAlcoholLevel(value: unknown): value is AlcoholLevelCode {
  return (
    typeof value === "string" &&
    (ALCOHOL_LEVELS as readonly string[]).includes(value)
  );
}

export function isFlavorProfile(value: unknown): value is FlavorProfile {
  return (
    typeof value === "string" &&
    (FLAVOR_PROFILES as readonly string[]).includes(value)
  );
}

export function isSkillLevel(value: unknown): value is SkillLevel {
  return (
    typeof value === "string" &&
    (SKILL_LEVELS as readonly string[]).includes(value)
  );
}

function label<T extends string>(
  map: LabelMap<T>,
  code: T,
  locale: VocabularyLocale,
): string {
  return map[code]?.[locale] ?? code;
}

export function baseSpiritLabel(
  code: BaseSpirit,
  locale: VocabularyLocale,
): string {
  return label(BASE_SPIRIT_LABELS, code, locale);
}

export function alcoholLevelLabel(
  code: AlcoholLevelCode,
  locale: VocabularyLocale,
): string {
  return label(ALCOHOL_LEVEL_LABELS, code, locale);
}

export function flavorProfileLabel(
  code: FlavorProfile,
  locale: VocabularyLocale,
): string {
  return label(FLAVOR_PROFILE_LABELS, code, locale);
}

export function skillLevelLabel(
  code: SkillLevel,
  locale: VocabularyLocale,
): string {
  return label(SKILL_LEVEL_LABELS, code, locale);
}

/**
 * Maps legacy free-text values onto codes.
 *
 * Needed only while the database still holds display strings written before the
 * vocabulary existed. Delete together with the legacy columns in the data-model
 * batch — new writes always store codes.
 */
export function coerceBaseSpirit(value: string | null | undefined): BaseSpirit {
  if (!value) return "other";
  const normalized = value.trim().toLowerCase();
  if (isBaseSpirit(normalized)) return normalized;

  if (normalized.includes("gin") || value.includes("金酒")) return "gin";
  if (normalized.includes("vodka") || value.includes("伏特加")) return "vodka";
  if (normalized.includes("rum") || value.includes("朗姆")) return "rum";
  if (normalized.includes("tequila") || value.includes("龙舌兰")) return "tequila";
  if (
    normalized.includes("whiskey") ||
    normalized.includes("whisky") ||
    value.includes("威士忌")
  ) {
    return "whiskey";
  }
  if (normalized.includes("brandy") || value.includes("白兰地")) return "brandy";
  return "other";
}

export function coerceAlcoholLevel(
  value: string | null | undefined,
): AlcoholLevelCode {
  if (!value) return "medium";
  const normalized = value.trim().toLowerCase();
  if (isAlcoholLevel(normalized)) return normalized;

  if (normalized.includes("low") || value.includes("低")) return "low";
  if (normalized.includes("high") || value.includes("高")) return "high";
  if (
    normalized.includes("none") ||
    normalized.includes("non") ||
    value.includes("无酒精")
  ) {
    return "none";
  }
  return "medium";
}

/**
 * Compound terms that must be matched before the single-character hints below.
 *
 * `碳酸感` means carbonated, but contains `酸` and would otherwise be read as sour.
 * A match here also removes the term from the string before the hint scan, so its
 * characters cannot be counted twice.
 */
const FLAVOR_COMPOUNDS: ReadonlyArray<readonly [string, FlavorProfile]> = [
  ["碳酸", "refreshing"],
  ["气泡", "refreshing"],
  ["焦糖", "sweet"],
  ["巧克力", "sweet"],
  ["蜂蜜", "sweet"],
];

/**
 * Substrings that imply a flavour code.
 *
 * Every matching rule contributes, rather than the first one winning, because
 * stored values are often compound: `甜酸` and `Sweet & Sour` each name two
 * flavours and must not collapse to one.
 */
const FLAVOR_HINTS: ReadonlyArray<readonly [string, FlavorProfile]> = [
  ["sweet", "sweet"],
  ["甜", "sweet"],
  ["sour", "sour"],
  ["酸", "sour"],
  ["bitter", "bitter"],
  ["苦", "bitter"],
  ["spic", "spicy"],
  ["辛辣", "spicy"],
  ["辣", "spicy"],
  ["fruit", "fruity"],
  ["citrus", "fruity"],
  ["果", "fruity"],
  ["柑橘", "fruity"],
  ["herbal", "herbal"],
  ["mint", "herbal"],
  ["草本", "herbal"],
  ["薄荷", "herbal"],
  ["floral", "floral"],
  ["花", "floral"],
  ["smok", "smoky"],
  ["烟熏", "smoky"],
  ["refresh", "refreshing"],
  ["清", "refreshing"],
  ["爽", "refreshing"],
  ["cream", "creamy"],
  ["奶", "creamy"],
  ["salt", "salty"],
  ["咸", "salty"],
];

/**
 * Maps stored flavour values onto codes.
 *
 * The column accumulated 25 distinct values of which only 9 were codes; the rest
 * were free text like `薄荷香`, `醇厚`, and `甜酸`. Anything with no recognisable
 * flavour becomes `other` rather than being dropped, so a row never ends up with
 * an empty profile list.
 *
 * Capped at five to match the generation contract in
 * `lib/ai/cocktail-schema.ts`; earlier entries win.
 */
export function coerceFlavorProfiles(
  values: readonly string[] | null | undefined,
): FlavorProfile[] {
  if (!values || values.length === 0) return ["other"];

  const collected = new Set<FlavorProfile>();
  let sawUnrecognized = false;

  for (const raw of values) {
    if (typeof raw !== "string") continue;

    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;

    const normalized = trimmed.toLowerCase();

    if (isFlavorProfile(normalized)) {
      collected.add(normalized);
      continue;
    }

    let matched = false;

    // Consume compound terms first so their characters cannot also satisfy a
    // single-character hint.
    let remaining = normalized;
    for (const [term, code] of FLAVOR_COMPOUNDS) {
      if (remaining.includes(term)) {
        collected.add(code);
        remaining = remaining.split(term).join(" ");
        matched = true;
      }
    }

    for (const [hint, code] of FLAVOR_HINTS) {
      if (remaining.includes(hint)) {
        collected.add(code);
        matched = true;
      }
    }

    if (!matched) sawUnrecognized = true;
  }

  // Recognised flavours outrank the `other` placeholder. It used to be added in
  // encounter order, so a drink whose first stored value was unrecognisable spent
  // one of its five slots on the placeholder and dropped a real flavour.
  const codes = [...collected].slice(0, 5);

  if (codes.length === 0) return ["other"];
  if (sawUnrecognized && codes.length < 5) codes.push("other");

  return codes;
}
