/* eslint-disable @next/next/no-img-element */

import type { Cocktail } from "@/lib/cocktail-types";
import { forwardRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Martini,
  Zap,
  GlassWater,
  ShoppingBasket,
  ScrollText,
  Wine,
} from "lucide-react";

interface PolaroidCardProps {
  cocktail: Cocktail;
  imageUrl: string;
  userName?: string;
}

export const PolaroidCard = forwardRef<HTMLDivElement, PolaroidCardProps>(
  ({ cocktail, imageUrl }, ref) => {
    const { language, t } = useLanguage();

    // Helper to get content based on language
    const getLocalizedContent = (field: string, englishField: string) => {
      if (language === "en" && cocktail[englishField as keyof Cocktail]) {
        return cocktail[englishField as keyof Cocktail] as string;
      }
      return cocktail[field as keyof Cocktail] as string;
    };

    const name = getLocalizedContent("name", "english_name");
    const alcoholLevel = getLocalizedContent(
      "alcohol_level",
      "english_alcohol_level",
    );
    const glass = getLocalizedContent("serving_glass", "english_serving_glass");
    const baseSpirit = getLocalizedContent(
      "base_spirit",
      "english_base_spirit",
    );
    const flavors =
      language === "en" && cocktail.english_flavor_profiles
        ? cocktail.english_flavor_profiles
        : cocktail.flavor_profiles || [];

    // Helper for Flavor Emojis
    const getFlavorEmoji = (flavor: string) => {
      const lower = flavor.toLowerCase();
      if (lower.includes("sour") || lower.includes("酸")) return "🍋";
      if (lower.includes("sweet") || lower.includes("甜")) return "🍬";
      if (lower.includes("bitter") || lower.includes("苦")) return "☕";
      if (lower.includes("spicy") || lower.includes("辣")) return "🌶️";
      if (lower.includes("fruity") || lower.includes("果")) return "🍓";
      if (
        lower.includes("fresh") ||
        lower.includes("refresh") ||
        lower.includes("清")
      )
        return "🍃";
      if (lower.includes("herbal") || lower.includes("草")) return "🌿";
      if (lower.includes("smoky") || lower.includes("烟")) return "💨";
      if (lower.includes("strong") || lower.includes("烈")) return "🔥";
      if (lower.includes("dry") || lower.includes("干")) return "🌵";
      return "✨";
    };

    // Get all ingredients & steps
    const ingredients = cocktail.ingredients;
    const steps = cocktail.steps;

    return (
      <div
        ref={ref}
        className="relative flex flex-col box-border overflow-hidden"
        style={{
          width: "375px",
          minHeight: "750px",
          backgroundColor: "#0F172A", // Slate-900
          padding: "40px 32px",
          fontFamily: "var(--font-source-sans), sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Dynamic Background Glow based on "Mood" */}
        <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[60%] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Noise Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07] z-0 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Typographic Watermark */}
        {cocktail.english_name && (
          <div className="absolute top-[20%] -right-10 rotate-90 origin-bottom-right text-[80px] font-black text-white/[0.02] whitespace-nowrap pointer-events-none font-playfair z-0">
            {cocktail.english_name}
          </div>
        )}

        {/* Main Content Z-Index Wrapper */}
        <div className="relative z-10 flex flex-col h-full">
          {/* 1. Hero Image */}
          <div className="w-full aspect-[1/1] rounded-2xl overflow-hidden shadow-2xl mb-8 relative bg-white/5">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Martini className="w-16 h-16" />
              </div>
            )}
            <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl pointer-events-none"></div>
          </div>

          {/* 2. Typography Header */}
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-black font-playfair tracking-tight mb-2 leading-tight text-white">
              {name}
            </h2>

            {/* English Subtitle */}
            {cocktail.english_name && language !== "en" && (
              <p className="text-lg font-serif italic text-white/60 mb-4">
                {cocktail.english_name}
              </p>
            )}

            {/* Flavor Tags - Simplified Text Row */}
            {flavors.length > 0 && (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-5">
                {flavors.map((flavor, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs font-medium text-white/80"
                  >
                    <span className="text-sm">{getFlavorEmoji(flavor)}</span>
                    <span className="uppercase tracking-wider">{flavor}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Meta Info - With Reliable Icons */}
            <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.1em] text-primary/90 font-bold opacity-80">
              <div className="flex items-center gap-1.5">
                <Martini className="w-3 h-3" />
                <span>{baseSpirit}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                <span>{alcoholLevel}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div className="flex items-center gap-1.5">
                <GlassWater className="w-3 h-3" />
                <span>{glass}</span>
              </div>
            </div>
          </div>

          {/* 3. Ingredients */}
          <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-center mb-5">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 border-b border-white/10 pb-2 flex items-center justify-center gap-2 w-fit mx-auto">
                <ShoppingBasket className="w-3 h-3 text-primary/80" />
                <span>{t("recommendation.card.ingredients")}</span>
              </span>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex justify-between items-end border-b border-dashed border-white/10 pb-1 last:border-0"
                >
                  <span className="text-sm font-medium text-white/90">
                    {language === "en" && ing.english_name
                      ? ing.english_name
                      : ing.name}
                  </span>
                  <span className="text-sm font-bold text-primary/90 font-mono">
                    {language === "en" && ing.english_amount
                      ? ing.english_amount
                      : ing.amount}
                    {language === "en" && ing.english_unit
                      ? ing.english_unit
                      : ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Steps */}
          <div className="flex-1 mb-8">
            <div className="text-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 border-b border-white/10 pb-2 flex items-center justify-center gap-2 w-fit mx-auto">
                <ScrollText className="w-3 h-3 text-secondary/80" />
                <span>{t("recommendation.card.preparation")}</span>
              </span>
            </div>

            <div className="space-y-5 px-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4 items-baseline">
                  <span className="text-sm font-mono font-bold text-primary/80 shrink-0 opacity-70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-white/80 leading-relaxed font-light">
                    {language === "en" && step.english_description
                      ? step.english_description
                      : step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5 opacity-50">
            <div className="flex items-center gap-2">
              <Wine className="w-4 h-4 text-white/80" />
              <span className="font-playfair font-bold text-sm tracking-wide">
                MoodShaker
              </span>
            </div>
            <span className="text-[9px] font-mono text-white/40 tracking-widest">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

PolaroidCard.displayName = "PolaroidCard";
