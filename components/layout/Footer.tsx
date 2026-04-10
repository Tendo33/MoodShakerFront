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
  const activeSocialLinks = socialLinks.filter((link) => link.href !== "#");

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
            <div className="mb-12 grid grid-cols-1 gap-8">
              {/* MoodShaker Column */}
              <motion.div
                className="mx-auto max-w-2xl text-center md:col-span-1"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerAnimation}
              >
                <motion.div
                  variants={itemAnimation}
                  className="mb-6 flex items-center justify-center gap-3"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center border border-white/10 shadow-[0_18px_32px_rgba(3,0,9,0.24)] ${gradientStyles.iconBackground}`}
                  >
                    <Cocktail className="h-6 w-6 text-white" />
                  </div>
                  <span className="gradient-text-bright font-bold text-2xl font-heading">
                    MoodShaker
                  </span>
                </motion.div>
                <motion.p
                  variants={itemAnimation}
                  className="mx-auto mb-8 max-w-xl text-base font-mono leading-relaxed text-muted-foreground"
                >
                  {t("footer.description")}
                </motion.p>
                <motion.div
                  variants={itemAnimation}
                  className="flex justify-center gap-3"
                >
                  {activeSocialLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="focus-ring border border-white/10 bg-black/20 p-3 text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/5 hover:text-primary"
                      aria-label={link.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.icon}
                    </Link>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            <Divider className="my-8 border-white/10" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center text-sm font-mono text-muted-foreground"
            >
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
                    <span
                      key={index}
                      className="text-muted-foreground/70"
                      aria-disabled="true"
                    >
                      {link.text}
                    </span>
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
