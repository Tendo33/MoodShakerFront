import type React from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ErrorProvider } from "@/context/ErrorContext";
import { CocktailProvider } from "@/context/CocktailContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorAlert from "@/components/ErrorAlert";
import PageTransition from "@/components/animations/PageTransition";
import "./globals.css";

// Configure Montserrat font
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});
export const metadata: Metadata = {
  title: "MoodShaker",
  description:
    "Answer a few simple questions and let us recommend the perfect cocktail for you",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" }
    ],
    apple: [
      { url: "/favicon.ico", sizes: "180x180", type: "image/x-icon" }
    ],
    shortcut: ["/favicon.ico"]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={montserrat.variable}>
      <body className="dark">
        <ErrorProvider>
          <CocktailProvider>
            <LanguageProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <ErrorAlert />
                <main className="flex-1">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
              </div>
            </LanguageProvider>
          </CocktailProvider>
        </ErrorProvider>
      </body>
    </html>
  );
}
