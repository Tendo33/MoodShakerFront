import type React from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
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

const resolveLanguageFromPath = (path?: string | null) => {
  if (!path) return null;
  const normalized = path.split("?")[0];
  if (normalized === "/en" || normalized.startsWith("/en/")) return "en";
  if (normalized === "/cn" || normalized.startsWith("/cn/")) return "cn";
  return null;
};

const resolveLanguageFromAccept = (acceptLanguage?: string | null) => {
  if (!acceptLanguage) return null;
  const lower = acceptLanguage.toLowerCase();
  return lower.startsWith("en") ? "en" : "cn";
};

const resolveHtmlLang = async () => {
  const requestHeaders = await headers();
  const pathLang =
    resolveLanguageFromPath(requestHeaders.get("next-url")) ||
    resolveLanguageFromPath(requestHeaders.get("x-nextjs-rewritten-path"));

  if (pathLang) return pathLang;

  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("moodshaker-language")?.value;
  if (cookieLang === "en" || cookieLang === "cn") return cookieLang;

  return resolveLanguageFromAccept(requestHeaders.get("accept-language")) || "cn";
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await resolveHtmlLang();
  return (
    <html
      lang={lang === "en" ? "en" : "zh-CN"}
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
