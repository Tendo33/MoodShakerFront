"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Martini, Library, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { gradientStyles } from "@/utils/style-constants";

export default function Header() {
  const { t, language, getPathWithLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (media.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  const homeLink = getPathWithLanguage("/");
  const questionsLink = getPathWithLanguage("/questions");
  const galleryLink = getPathWithLanguage("/gallery");

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass-popup border-b border-white/10 py-2 shadow-[0_18px_40px_rgba(3,0,9,0.42)] before:absolute before:bottom-0 before:left-0 before:h-px before:w-full before:bg-linear-to-r before:from-transparent before:via-secondary/30 before:to-transparent"
          : "bg-transparent py-4"
      }`}
      suppressHydrationWarning
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-6">
        <Link
          href={homeLink}
          className="flex items-center gap-3 text-xl font-bold md:text-2xl focus-ring"
        >
          <motion.div
            className={`flex h-10 w-10 items-center justify-center border border-white/10 shadow-[0_16px_30px_rgba(3,0,9,0.28)] md:h-12 md:w-12 ${gradientStyles.iconBackground}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Martini className="h-5 w-5 text-white md:h-6 md:w-6" />
          </motion.div>
          <motion.span
            className="gradient-text-bright font-heading font-bold tracking-tight"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            MoodShaker
          </motion.span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
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

          <Separator orientation="vertical" className="mx-1 h-7 bg-white/12" />

          <LanguageSelector idBase="header-desktop-language-selector" />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelector idBase="header-mobile-language-selector" />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <motion.button
                className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/10 bg-black/30 text-muted-foreground transition-colors hover:border-secondary/40 hover:bg-white/10 hover:text-foreground"
                aria-label="Toggle mobile menu"
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
                      <X className="h-6 w-6" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="p-0">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center border border-white/10 ${gradientStyles.iconBackground}`}
                  >
                    <Martini className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="gradient-text-bright normal-case">
                      MoodShaker
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      {language === "cn" ? "站点导航" : "Site navigation"}
                    </SheetDescription>
                  </div>
                </div>
                <SheetClose asChild>
                  <button
                    className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/10 bg-black/30 text-muted-foreground transition-colors hover:border-secondary/40 hover:bg-white/10 hover:text-foreground"
                    aria-label="Close menu"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </SheetClose>
              </SheetHeader>

              <nav className="flex flex-1 flex-col gap-3 px-6 py-8">
                <Button
                  href={galleryLink}
                  variant="outline"
                  fullWidth
                  effect="lift"
                  className="justify-start text-base"
                  icon={<Library className="h-5 w-5" />}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {language === "cn" ? "酒单库" : "Gallery"}
                </Button>

                <Button
                  href={questionsLink}
                  size="lg"
                  variant="primary"
                  effect="shine"
                  fullWidth
                  className="mt-2 text-base shadow-lg"
                  icon={<Sparkles className="h-5 w-5" />}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("home.start")}
                </Button>
              </nav>

              <SheetFooter>
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {language === "cn" ? "语言" : "Language"}
                </p>
                <LanguageSelector idBase="drawer-language-selector" />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
