import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { ThemeProvider } from "@/context/ThemeContext"
import { ErrorProvider } from "@/context/ErrorContext"
import { CocktailProvider } from "@/context/CocktailContext"
import { LanguageProvider } from "@/context/LanguageContext"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ErrorAlert from "@/components/ErrorAlert"
import PageTransition from "@/components/animations/PageTransition"
import "./globals.css"

// Configure Montserrat font
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MoodShaker",
  description: "Answer a few simple questions and let us recommend the perfect cocktail for you",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={montserrat.variable}>
      <body className="dark">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
