"use client"

import Link from "next/link"
import { useTheme } from "@/context/ThemeContext"
import LanguageSelector from "@/components/LanguageSelector"

export default function Header() {
  const { theme } = useTheme()
  const headerClass = "bg-gray-800 border-gray-700"

  return (
    <header className={`sticky top-0 z-10 border-b ${headerClass}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm">🍹</span>
          </div>
          <span className="bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">MoodShaker</span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
