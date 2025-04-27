"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
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
      y: -5,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-medium">
          {language === "en" ? "EN" : "中文"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
          >
            <div
              className="py-1 rounded-md bg-gray-800 shadow-xs"
              role="listbox"
            >
              <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">
                {t("language.select")}
              </div>

              {Object.entries(availableLanguages).map(([code, name]) => (
                <button
                  key={code}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm leading-5 text-left ${
                    language === code
                      ? "bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                  role="option"
                  aria-selected={language === code}
                  onClick={() => {
                    setLanguage(code as Language);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    {code === "en" ? (
                      <span className="mr-2 text-lg">🇺🇸</span>
                    ) : (
                      <span className="mr-2 text-lg">🇨🇳</span>
                    )}
                    {name}
                  </div>

                  {language === code && (
                    <Check className="h-4 w-4 text-amber-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
