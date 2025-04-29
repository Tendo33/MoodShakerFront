"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Martini as Cocktail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/core";

export default function Header() {
  const { t, language, getPathWithLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle scroll effect - only run on client side
  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  // Don't render anything until client-side hydration is complete
  if (!isMounted) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gray-900/95 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={homeLink}
          className="flex items-center gap-2 font-bold text-xl"
        >
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Cocktail className="h-5 w-5 text-white" />
          </motion.div>
          <motion.span
            className="bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            MoodShaker
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <LanguageSelector />
          <Button href={questionsLink} size="sm" variant="primary">
            {t("home.start")}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <LanguageSelector />

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:text-white p-2 ml-2 rounded-md hover:bg-white/5"
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
            className="md:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
          >
            <div className="px-4 py-3 space-y-1 bg-gray-800/95 backdrop-blur-md shadow-lg border-t border-gray-700/50">
              <div className="pt-2 pb-1">
                <Button
                  href={questionsLink}
                  size="sm"
                  variant="primary"
                  fullWidth
                  onClick={() => setIsMobileMenuOpen(false)}
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
