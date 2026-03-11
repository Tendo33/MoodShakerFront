"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, type Language } from "@/context/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
    },
  };


  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-5 py-2 text-sm rounded-none font-mono tracking-widest uppercase transition-all duration-300 border-2 ${
          isOpen
            ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(255,0,255,0.4)]"
            : "bg-black/40 border-primary/30 text-primary/80 hover:bg-black/80 hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
        }`}
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="flex items-center gap-2">
          <Globe className={`h-4 w-4 ${isOpen ? "text-primary drop-shadow-[0_0_5px_currentColor]" : ""}`} />
          <span className="hidden md:inline text-sm font-bold font-mono tracking-widest drop-shadow-[0_0_5px_currentColor]">
            {t(language === "en" ? "language.en" : "language.cn")}
          </span>
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-3 w-48 rounded-none overflow-hidden bg-black/90 backdrop-blur-3xl border-2 border-primary shadow-[0_10px_40px_rgba(255,0,255,0.3)] z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
          >
            <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            <div className="relative py-2" role="listbox">
              <div className="px-5 py-2 text-xs font-bold text-primary/70 font-mono uppercase tracking-widest border-b-2 border-primary/30 mb-1">
                {t("language.select")}
              </div>

              {Object.entries(availableLanguages).map(([code, name]) => (
                <button
                  key={code}
                  className={`relative flex items-center justify-between w-full px-5 py-3 text-sm font-mono tracking-widest uppercase transition-all duration-300 group overflow-hidden ${
                    language === code
                      ? "bg-primary/20 text-primary font-bold shadow-[inset_4px_0_0_rgba(255,0,255,1)]"
                      : "text-primary/70 hover:text-primary hover:bg-black/60 hover:pl-6"
                  }`}
                  role="option"
                  aria-selected={language === code}
                  onClick={() => {
                    setLanguage(code as Language);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 z-10">
                    <span className="text-lg drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">
                      {code === "en" ? "🇺🇸" : "🇨🇳"}
                    </span>
                    <span className="font-mono">{name}</span>
                  </div>

                  {language === code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-primary"
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  )}

                  {/* Hover sweeping glow effect */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
