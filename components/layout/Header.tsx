"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Martini, Library, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/core";
import { gradientStyles } from "@/utils/style-constants";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export default function Header() {
  const { t, language, getPathWithLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerId = "mobile-navigation-drawer";
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap({
    isOpen: isMobileMenuOpen,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    onClose: () => setIsMobileMenuOpen(false),
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const homeLink = getPathWithLanguage("/");
  const questionsLink = getPathWithLanguage("/questions");
  const galleryLink = getPathWithLanguage("/gallery");

  const drawerVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 400, damping: 35, mass: 0.8 },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass-popup py-2 shadow-[0_18px_40px_rgba(3,0,9,0.42)] border-b border-white/10 before:absolute before:bottom-0 before:left-0 before:h-px before:w-full before:bg-linear-to-r before:from-transparent before:via-secondary/30 before:to-transparent"
          : "bg-transparent py-4"
      }`}
      suppressHydrationWarning
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-6">
        {/* Logo */}
        <Link
          href={homeLink}
          className="flex items-center gap-3 font-bold text-xl md:text-2xl focus-ring"
        >
          <motion.div
            className={`flex h-10 w-10 items-center justify-center border border-white/10 shadow-[0_16px_30px_rgba(3,0,9,0.28)] md:h-12 md:w-12 ${gradientStyles.iconBackground}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Martini className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </motion.div>
          <motion.span
            className="gradient-text-bright font-bold font-heading tracking-tight"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            MoodShaker
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Button
              href={galleryLink}
              variant="outline"
              size="md"
              effect="lift"
              icon={<Library className="h-4 w-4" />}
            >
              {language === "cn" ? "酒单库" : "Gallery"}
            </Button>
            <Button
              href={questionsLink}
              size="md"
              variant="primary"
              effect="shine"
              className="shadow-xl"
              icon={<Sparkles className="h-4 w-4" />}
            >
              {t("home.start")}
            </Button>
          </div>

          <div className="mx-1 h-7 w-px bg-white/12" />

          <LanguageSelector idBase="header-desktop-language-selector" />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSelector idBase="header-mobile-language-selector" />
          <motion.button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/10 bg-black/30 text-muted-foreground transition-colors hover:border-secondary/40 hover:bg-white/10 hover:text-foreground"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls={drawerId}
            whileTap={{ scale: 0.9 }}
            type="button"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={24} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu size={24} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer (right-side slide-in) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              className="glass-popup fixed top-0 right-0 bottom-0 z-50 flex w-72 flex-col md:hidden"
              id={drawerId}
              ref={drawerRef}
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
              tabIndex={-1}
              >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center border border-white/10 ${gradientStyles.iconBackground}`}
                  >
                    <Martini className="h-4 w-4 text-white" />
                  </div>
                  <span id="mobile-menu-title" className="gradient-text-bright font-bold font-heading text-lg">
                    MoodShaker
                  </span>
                </div>
                <motion.button
                  ref={closeButtonRef}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/10 bg-black/30 text-muted-foreground transition-colors hover:border-secondary/40 hover:bg-white/10 hover:text-foreground"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close menu"
                  type="button"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Drawer Nav Links */}
              <nav className="flex-1 flex flex-col gap-3 px-6 py-8">
                <Button
                  href={galleryLink}
                  variant="outline"
                  fullWidth
                  effect="lift"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="justify-start text-base"
                  icon={<Library className="h-5 w-5" />}
                >
                  {language === "cn" ? "酒单库" : "Gallery"}
                </Button>

                <Button
                  href={questionsLink}
                  size="lg"
                  variant="primary"
                  effect="shine"
                  fullWidth
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 text-base shadow-lg"
                  icon={<Sparkles className="h-5 w-5" />}
                >
                  {t("home.start")}
                </Button>
              </nav>

              {/* Drawer Footer: Language Selector */}
              <div className="border-t border-white/10 px-6 py-6">
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {language === "cn" ? "语言" : "Language"}
                </p>
                <LanguageSelector idBase="drawer-language-selector" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
