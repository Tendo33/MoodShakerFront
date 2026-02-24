"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Github,
  Heart,
  Martini as Cocktail,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Container, Divider } from "@/components/ui/core";
import { gradientStyles } from "@/utils/style-constants";

export default function Footer() {
  const { t } = useLanguage();

  const socialLinks = [
    { icon: <Facebook size={18} />, href: "#", label: "Facebook" },
    { icon: <Instagram size={18} />, href: "#", label: "Instagram" },
    {
      icon: <Twitter size={18} />,
      href: "https://x.com/SimonSun33",
      label: "Twitter",
    },
    {
      icon: <Github size={18} />,
      href: "https://github.com/Tendo33/MoodShakerFront",
      label: "Github",
    },
  ];

  const footerLinks = [
    { text: t("footer.about"), href: "#" },
    { text: t("footer.privacy"), href: "#" },
    { text: t("footer.terms"), href: "#" },
  ];

  const staggerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <footer className="relative z-10 mt-auto">
      {/* Glass effect container for footer */}
      <div className="glass-effect border-t border-white/10">
        <div className="py-12 md:py-16 lg:py-20">
          <Container>
            <div className="grid grid-cols-1 gap-8 mb-12">
              {/* MoodShaker Column */}
              <motion.div
                className="md:col-span-1 max-w-2xl mx-auto text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerAnimation}
              >
                <motion.div
                  variants={itemAnimation}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${gradientStyles.iconBackground} flex items-center justify-center shadow-lg`}
                  >
                    <Cocktail className="h-6 w-6 text-white" />
                  </div>
                  <span className="gradient-text-bright font-bold text-2xl font-playfair">
                    MoodShaker
                  </span>
                </motion.div>
                <motion.p
                  variants={itemAnimation}
                  className="text-base text-muted-foreground mb-8 max-w-md mx-auto font-source-sans leading-relaxed"
                >
                  {t("footer.description")}
                </motion.p>
                <motion.div
                  variants={itemAnimation}
                  className="flex justify-center space-x-4"
                >
                  {socialLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-all duration-300 p-3 hover:bg-white/5 rounded-full hover:scale-110"
                      aria-label={link.label}
                      target="_blank"
                    >
                      {link.icon}
                    </Link>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            <Divider className="border-white/10 my-8" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center text-sm text-muted-foreground font-source-sans"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="flex items-center justify-center">
                  © {new Date().getFullYear()} MoodShaker.{" "}
                  {t("footer.madeWith")}
                  <Heart
                    className="h-3.5 w-3.5 mx-1 text-pink-500 inline"
                    fill="currentColor"
                  />
                </p>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                  {footerLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </Container>
        </div>
      </div>
    </footer>
  );
}
