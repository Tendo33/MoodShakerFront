"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Github,
  Heart,
  Martini as Cocktail,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Container, Divider } from "@/components/ui/core";
import { gradientStyles } from "@/utils/style-constants";

export default function Footer() {
  const { t, language } = useLanguage();

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
  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5 mr-2 text-amber-500" />,
      text: "contact@moodshaker.com",
    },
    {
      icon: <Phone className="h-5 w-5 mr-2 text-amber-500" />,
      text: "+86 123 4567 8910",
    },
    {
      icon: <MapPin className="h-5 w-5 mr-2 text-amber-500" />,
      text:
        language === "en"
          ? "Zhangjiang Hi-Tech Park, Pudong, Shanghai"
          : "上海市浦东新区张江高科技园区",
    },
  ];

  const footerLinks = [
    { text: t("footer.about"), href: "#" },
    { text: t("footer.privacy"), href: "#" },
    { text: t("footer.terms"), href: "#" },
  ];

  // Get the correct home link based on language
  const homeLink = language === "en" ? "/en" : "/zh";

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
    <footer className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700/50 pt-12 pb-6">
      <Container>
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* MoodShaker Column */}
          <motion.div
            className="md:col-span-1 max-w-2xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerAnimation}
          >
            <motion.div
              variants={itemAnimation}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div className={`w-10 h-10 rounded-full ${gradientStyles.iconBackground} flex items-center justify-center`}>
                <Cocktail className="h-5 w-5 text-white" />
              </div>
              <span className={`font-bold text-gray-400 text-xl ${gradientStyles.primaryText}`}>
                MoodShaker
              </span>
            </motion.div>
            <motion.p
              variants={itemAnimation}
              className="text-sm text-gray-400 mb-6 max-w-md mx-auto"
            >
              {language === "en"
                ? "Find the perfect cocktail for your mood and make every tasting experience memorable. Our AI-powered recommendation system helps you discover new flavors tailored to your preferences."
                : "找到适合您心情的鸡尾酒，让每一次品尝都成为难忘的体验。我们的AI驱动推荐系统帮助您发现适合您口味的新风味。"}
            </motion.p>
            <motion.div
              variants={itemAnimation}
              className="flex justify-center space-x-3"
            >
              {socialLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-400 hover:text-amber-500 transition-colors p-2 hover:bg-white/5 rounded-full"
                  aria-label={link.label}
                  target="_blank"
                >
                  {link.icon}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <Divider />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 text-center text-sm text-gray-400"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="flex items-center justify-center">
              © {new Date().getFullYear()} MoodShaker. {t("footer.madeWith")}
              <Heart
                className="h-3.5 w-3.5 mx-1 text-pink-500 inline"
                fill="currentColor"
              />
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 md:mt-0">
              {footerLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-400 hover:text-amber-500 transition-colors"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </footer>
  );
}
