import type React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_HEADER,
  type Locale,
  isLocale,
  localeFromPathname,
} from "@/lib/i18n/config";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import { ErrorProvider } from "@/context/ErrorContext";
import { CocktailProvider } from "@/context/CocktailContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorAlert from "@/components/ErrorAlert";
import PageTransition from "@/components/animations/PageTransition";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Orbitron for headings
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  preload: true,
  weight: ["400", "500", "700", "900"], 
  style: ["normal"],
  adjustFontFallback: false,
  fallback: ["sans-serif"],
});

// Share Tech Mono for body and UI
const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
  display: "swap",
  preload: true,
  weight: ["400"],
  style: ["normal"],
  adjustFontFallback: false,
  fallback: ["monospace", "sans-serif"],
});

export const metadata: Metadata = {
  title: "MoodShaker",
  description:
    "Answer a few simple questions and let us recommend the perfect cocktail for you",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" }],
    shortcut: ["/favicon.ico"],
  },
  generator: "v0.app",
};

/**
 * Reads the locale the proxy decided on.
 *
 * This layout renders `<html>` but sits above the `[lang]` segment, so it cannot
 * read the route param. It used to re-derive the locale from `next-url`, then a
 * cookie, then `accept-language` — a chain that could disagree with the redirect
 * the proxy had just performed and emit `<html lang="en">` on a `/cn` page. The
 * proxy now forwards its decision and this is a lookup.
 *
 * The fallback only applies when the header is absent, which means the request
 * bypassed the proxy.
 */
const resolveHtmlLocale = async (): Promise<Locale> => {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get(LOCALE_HEADER);

  if (isLocale(forwarded)) return forwarded;

  return (
    localeFromPathname(requestHeaders.get("next-url")) ??
    localeFromPathname(requestHeaders.get("x-nextjs-rewritten-path")) ??
    DEFAULT_LOCALE
  );
};

/** BCP 47 tag for the `lang` attribute; `cn` is not a valid language subtag. */
const HTML_LANG: Record<Locale, string> = {
  cn: "zh-CN",
  en: "en",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveHtmlLocale();
  return (
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      className={`${orbitron.variable} ${shareTechMono.variable} antialiased`}
    >
      <body className="dark vaporwave-theme selection:bg-[#FF00FF] selection:text-white">
        {/* Global Vaporwave Elements */}
        <div className="fixed inset-0 crt-overlay pointer-events-none z-50"></div>
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 vapor-sun pointer-events-none z-0"></div>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="vaporwave-grid absolute inset-x-0 bottom-0 h-full w-full opacity-30"></div>
        </div>
        <ErrorProvider>
          <LanguageProvider>
            <CocktailProvider>
              <div className="min-h-screen flex flex-col bg-background text-foreground">
                <Header />
                <ErrorAlert />
                <main className="flex-1">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
                <Toaster />
                <PerformanceMonitor />
              </div>
            </CocktailProvider>
          </LanguageProvider>
        </ErrorProvider>
      </body>
    </html>
  );
}
