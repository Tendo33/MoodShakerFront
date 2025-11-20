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
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, ease: "easeIn" },
    },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-full transition-all duration-300 border ${
          isOpen
            ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]"
            : "glass-effect hover:bg-white/10 hover:border-white/20 text-foreground/80 hover:text-foreground"
        }`}
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className={`h-4 w-4 ${isOpen ? "text-primary" : ""}`} />
        <span className="hidden md:inline text-sm font-medium font-source-sans tracking-wide">
          {t(language === "en" ? "language.en" : "language.cn")}
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
            className="absolute right-0 mt-3 w-48 rounded-2xl overflow-hidden glass-effect border border-white/10 shadow-2xl z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <div
              className="relative py-2"
              role="listbox"
            >
              <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5 mb-1">
                {t("language.select")}
              </div>

              {Object.entries(availableLanguages).map(([code, name]) => (
                <button
                  key={code}
                  className={`relative flex items-center justify-between w-full px-4 py-3 text-sm transition-all duration-200 group ${
                    language === code
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:bg-white/5 hover:text-foreground hover:pl-5"
                  }`}
                  role="option"
                  aria-selected={language === code}
                  onClick={() => {
                    setLanguage(code as Language);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 z-10">
                    <span className="text-lg shadow-sm filter drop-shadow-md">
                      {code === "en" ? "🇺🇸" : "🇨🇳"}
                    </span>
                    <span className="font-source-sans">{name}</span>
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
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
