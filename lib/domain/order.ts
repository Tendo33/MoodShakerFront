import { z } from "zod";
import {
  MOODS,
  SKILL_LEVELS,
  STOCKABLE_SPIRITS,
  STRENGTHS,
  STYLES,
} from "@/lib/domain/vocabulary";
import { LOCALES } from "@/lib/i18n";

export const MAX_NOTES_LENGTH = 300;

/** What the questionnaire sends. Every field except `notes` is a closed code. */
export const orderSchema = z.object({
  locale: z.enum(LOCALES),
  mood: z.enum(MOODS),
  strength: z.enum(STRENGTHS),
  spirits: z.array(z.enum(STOCKABLE_SPIRITS)).max(STOCKABLE_SPIRITS.length).default([]),
  skill: z.enum(SKILL_LEVELS),
  style: z.enum(STYLES),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).default(""),
});

export type Order = z.infer<typeof orderSchema>;

/** Access to a private drink. The token only ever travels in a POST body. */
export const accessSchema = z.object({
  editToken: z.string().trim().min(1).max(256),
});
