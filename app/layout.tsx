import type React from "react";
import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { ErrorProvider } from "@/context/ErrorContext";
import { CocktailProvider } from "@/context/CocktailContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorAlert from "@/components/ErrorAlert";
import PageTransition from "@/components/animations/PageTransition";
import DevPerformanceMonitor from "@/components/DevPerformanceMonitor";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// 优化字体加载 - 减少权重变体，启用预加载
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true, // 启用预加载
  weight: ["400", "700"], // 减少权重变体，只保留必要权重
  style: ["normal"], // 只加载正常样式
  adjustFontFallback: false, // 禁用字体回退调整以提升性能
  fallback: ["serif"], // 明确指定回退字体
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  preload: true, // 启用预加载
  weight: ["400", "500", "600"], // 减少权重变体
  style: ["normal"], // 只加载正常样式
  adjustFontFallback: false, // 禁用字体回退调整
  fallback: ["system-ui", "sans-serif"], // 明确指定回退字体
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${playfairDisplay.variable} ${sourceSans.variable} antialiased`}
    >
      <body className="dark">
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
                <DevPerformanceMonitor />
              </div>
            </CocktailProvider>
          </LanguageProvider>
        </ErrorProvider>
      </body>
    </html>
  );
}
