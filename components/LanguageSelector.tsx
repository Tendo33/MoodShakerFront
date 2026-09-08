"use client";

import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, type Locale } from "@/context/LanguageContext";

interface LanguageSelectorProps {
  idBase?: string;
}

export default function LanguageSelector({
  idBase = "language-selector",
}: LanguageSelectorProps) {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = `${idBase}-listbox`;
  const pendingFocusIndexRef = useRef<number | null>(null);
  // availableLanguages 是数组 ["cn", "en"]，不是对象。
  //
  // 这里原本是 Object.entries(availableLanguages)，在数组上得到的是
  // [["0", "cn"], ["1", "en"]] —— code 拿到的是下标字符串。后果有三个：
  // 点击后 setLanguage("0") 跳到 /0/questions（无效路由，语言切不动）；
  // selectedIndex 恒为 -1，当前语言永远不显示选中；
  // 显示名变成 "cn"/"en" 而不是「中文」/「English」，国旗判断也永不成立。
  const languageOptions = useMemo(
    () =>
      availableLanguages.map(
        (code) => [code, t(`language.${code}`)] as const,
      ),
    [availableLanguages, t],
  );
  const selectedIndex = languageOptions.findIndex(([code]) => code === language);

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

  useEffect(() => {
    if (!isOpen) {
      pendingFocusIndexRef.current = null;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const nextIndex =
        pendingFocusIndexRef.current ?? (selectedIndex >= 0 ? selectedIndex : 0);
      optionRefs.current[nextIndex]?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, selectedIndex]);

  const closeListbox = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const openListbox = (targetIndex = selectedIndex >= 0 ? selectedIndex : 0) => {
    pendingFocusIndexRef.current = targetIndex;
    setIsOpen(true);
  };

  const selectLanguage = (code: string) => {
    setLanguage(code as Locale);
    closeListbox();
  };

  const focusOption = (index: number) => {
    const total = languageOptions.length;
    const normalized = (index + total) % total;
    optionRefs.current[normalized]?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openListbox(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openListbox(selectedIndex >= 0 ? selectedIndex : languageOptions.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) {
        closeListbox();
      } else {
        openListbox();
      }
    }
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    code: string,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(languageOptions.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeListbox();
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectLanguage(code);
    }
  };

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
        ref={triggerRef}
        onClick={() => {
          if (isOpen) {
            closeListbox();
            return;
          }
          openListbox();
        }}
        className={`focus-ring flex min-h-11 items-center gap-2 border px-5 py-2.5 text-sm font-mono uppercase tracking-[0.18em] transition-all duration-300 ${
          isOpen
            ? "border-primary/55 bg-primary/16 text-primary shadow-[0_16px_28px_rgba(3,0,9,0.22)]"
            : "border-primary/28 bg-black/40 text-primary/80 hover:border-primary/45 hover:bg-black/65 hover:text-primary hover:shadow-[0_16px_28px_rgba(3,0,9,0.18)]"
        }`}
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onKeyDown={handleTriggerKeyDown}
        type="button"
      >
        <span className="flex items-center gap-2">
          <Globe className={`h-4 w-4 ${isOpen ? "text-primary" : ""}`} />
          <span className="hidden text-sm font-bold font-mono tracking-[0.18em] md:inline">
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
            id={listboxId}
            className="absolute right-0 z-50 mt-3 w-48 overflow-hidden border border-primary/45 bg-black/90 shadow-[0_24px_48px_rgba(3,0,9,0.34)] backdrop-blur-3xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
          >
            <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            <div className="relative py-2" role="listbox">
              <div className="mb-1 border-b border-primary/30 px-5 py-2 text-xs font-bold font-mono uppercase tracking-[0.18em] text-primary/70">
                {t("language.select")}
              </div>

              {languageOptions.map(([code, name], index) => (
                <button
                  key={code}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  className={`focus-ring group relative flex w-full items-center justify-between overflow-hidden px-5 py-3 text-sm font-mono uppercase tracking-[0.18em] transition-all duration-300 ${
                    language === code
                      ? "bg-primary/18 font-bold text-primary shadow-[inset_3px_0_0_rgba(255,79,216,1)]"
                      : "text-primary/70 hover:bg-black/60 hover:pl-6 hover:text-primary"
                  }`}
                  role="option"
                  aria-selected={language === code}
                  onKeyDown={(event) => handleOptionKeyDown(event, index, code)}
                  onClick={() => selectLanguage(code)}
                  type="button"
                >
                  <div className="flex items-center gap-3 z-10">
                    <span className="text-lg">
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

                  {/* 原来这里还有一层 group-hover:animate-shimmer 的扫光。`shimmer`
                      从来没有对应的 @keyframes（产物里 0 次出现），所以那层只是一条不动
                      的静态斜纹。下面这层才是真正生效的 hover 反馈。 */}
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
