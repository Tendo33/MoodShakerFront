"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Cocktail } from "@/api/cocktail";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Filter } from "lucide-react";

interface GalleryContentProps {
  cocktails: Cocktail[];
  lang: string;
}

export default function GalleryContent({ cocktails, lang }: GalleryContentProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("");
  
  const filteredCocktails = cocktails.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) || 
    (c.english_name && c.english_name.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
          Cocktail Gallery
        </h1>
        <p className="text-muted-foreground">
          Explore the community's creations
        </p>
      </div>

      <div className="mb-8 max-w-md mx-auto relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full leading-5 bg-white/5 text-foreground placeholder-gray-400 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-pink-500 sm:text-sm transition-colors"
          placeholder="Search cocktails..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCocktails.map((cocktail) => (
          <Link 
            href={`/${lang}/cocktail/${cocktail.id}`} 
            key={cocktail.id || cocktail.name}
          >
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-black/20 h-full hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
                {cocktail.image ? (
                  <Image
                    src={cocktail.image}
                    alt={cocktail.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white mb-1">{cocktail.name}</h3>
                  {cocktail.english_name && (
                    <p className="text-white/60 text-sm">{cocktail.english_name}</p>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-1 rounded-full bg-white/10 text-xs text-white/80 backdrop-blur-sm">
                      {cocktail.base_spirit}
                    </span>
                    {cocktail.alcohol_level && (
                      <span className="px-2 py-1 rounded-full bg-white/10 text-xs text-white/80 backdrop-blur-sm">
                        {cocktail.alcohol_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      
      {filteredCocktails.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No cocktails found matching your search.
        </div>
      )}
    </div>
  );
}

