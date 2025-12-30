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

  // Handle scroll effect - only run on client side
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Only add scroll listener on client side
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Animation variants
  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  // Get the correct home link based on language
  const homeLink = getPathWithLanguage("/");
  const questionsLink = getPathWithLanguage("/questions");
  const galleryLink = getPathWithLanguage("/gallery");

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
          {/* 主要按钮组 */}
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
          
          {/* 分隔符 */}
          <div className="h-6 w-px bg-white/20 mx-1" />
          
          {/* 语言选择器 */}
          <LanguageSelector />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <LanguageSelector />

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:text-white p-2 ml-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-x-0 top-[64px] z-40 overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants as any}
          >
            {/* Backdrop blur overlay */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />

            <div className="relative px-6 py-6 space-y-6 border-t border-white/10 bg-background/40">
              <Button
                href={galleryLink}
                variant="outline"
                fullWidth
                effect="lift"
                onClick={() => setIsMobileMenuOpen(false)}
                className="justify-start text-lg text-white border-white/20 hover:bg-white/10 hover:border-white/40"
                icon={<Library className="h-5 w-5" />}
              >
                {language === "cn" ? "酒单库" : "Gallery"}
              </Button>
              <div className="pt-2 pb-4">
                <Button
                  href={questionsLink}
                  size="xl"
                  variant="primary"
                  effect="shine"
                  fullWidth
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="shadow-lg text-lg"
                  icon={<Sparkles className="h-5 w-5" />}
                >
                  {t("home.start")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
