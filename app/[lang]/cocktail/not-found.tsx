"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const { getPathWithLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Cocktail Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the cocktail you're looking for. It might have
          been removed or doesn't exist.
        </p>
        <Link
          href={getPathWithLanguage("/")}
          className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all shadow-lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
