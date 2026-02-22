"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Martini, Library, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/core";
import { gradientStyles } from "@/utils/style-constants";

export default function Header() {
  const { t, language, getPathWithLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { duration: 0.25, ease: "easeInOut" as const },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled ? "glass-effect py-2" : "bg-transparent py-4"
      }`}
      suppressHydrationWarning
    >
      <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={homeLink}
          className="flex items-center gap-3 font-bold text-xl md:text-2xl"
        >
          <motion.div
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${gradientStyles.iconBackground} flex items-center justify-center shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Martini className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </motion.div>
          <motion.span
            className="gradient-text-bright font-bold font-playfair tracking-tight"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            MoodShaker
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="flex items-center space-x-3">
            <Button
              href={galleryLink}
              variant="outline"
              size="md"
              effect="lift"
              className="text-white border-white/20 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm"
              icon={<Library className="h-4 w-4" />}
            >
              {language === "cn" ? "酒单库" : "Gallery"}
            </Button>
            <Button
              href={questionsLink}
              size="md"
              variant="primary"
              effect="shine"
              className="shadow-xl hover:shadow-primary/25"
              icon={<Sparkles className="h-4 w-4" />}
            >
              {t("home.start")}
            </Button>
          </div>

          <div className="h-6 w-px bg-white/20 mx-1" />

          <LanguageSelector />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSelector />
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            whileTap={{ scale: 0.9 }}
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
              className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 glass-popup flex flex-col"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full ${gradientStyles.iconBackground} flex items-center justify-center`}
                  >
                    <Martini className="h-4 w-4 text-white" />
                  </div>
                  <span className="gradient-text-bright font-bold font-playfair text-lg">
                    MoodShaker
                  </span>
                </div>
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close menu"
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
                  className="justify-start text-base text-white border-white/20 hover:bg-white/10 hover:border-white/40"
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
                  className="shadow-lg text-base mt-2"
                  icon={<Sparkles className="h-5 w-5" />}
                >
                  {t("home.start")}
                </Button>
              </nav>

              {/* Drawer Footer: Language Selector */}
              <div className="px-6 py-6 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                  {language === "cn" ? "语言" : "Language"}
                </p>
                <LanguageSelector />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
