"use client";

import { useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageCategory {
  name: string;
  folder: string;
  images: string[];
}

export default function ImageGallery() {
  const [categories, setCategories] = useState<ImageCategory[]>([
    {
      name: "品牌标识",
      folder: "branding",
      images: ["logo.svg", "logo-dark.svg", "logo-icon.svg"],
    },
    {
      name: "鸡尾酒",
      folder: "cocktails",
      images: [
        "cocktail-mojito.png",
        "cocktail-margarita.png",
        "cocktail-cosmopolitan.png",
        "cocktail-whiskey-sour.png",
      ],
    },
    {
      name: "基酒",
      folder: "spirits",
      images: [
        "classic-gin-still-life.png",
        "weathered-rum-bottle.png",
        "frosted-vodka.png",
        "amber-glass-still-life.png",
        "aged-agave-spirit.png",
      ],
    },
    {
      name: "UI元素",
      folder: "ui",
      images: [
        "polished-cocktail-shaker.png",
        "tropical-fusion.png",
        "tropical-splash.png",
        "vibrant-citrus-harmony.png",
        "dark-stormy-cocktail.png",
        "vibrant-cocktail-collection.png",
        "gradient-blob-1.svg",
        "gradient-blob-2.svg",
        "cocktail-illustration.svg",
        "ingredients-pattern.svg",
      ],
    },
    {
      name: "英雄图片",
      folder: "hero",
      images: ["hero-main.jpg", "hero-mobile.jpg", "background-pattern.svg"],
    },
    {
      name: "工具",
      folder: "tools",
      images: [
        "tool-shaker.jpg",
        "tool-jigger.jpg",
        "tool-strainer.jpg",
        "tool-muddler.jpg",
        "tool-bar-spoon.jpg",
      ],
    },
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
        MoodShaker 图片资源库
      </h1>

      <Tabs defaultValue={categories[0].name}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-8">
          {categories.map((category) => (
            <TabsTrigger key={category.name} value={category.name}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.name} value={category.name}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.images.map((image) => (
                <div
                  key={image}
                  className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50 backdrop-blur-sm"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-900/50">
                    <Image
                      src={`/${category.folder}/${image}`}
                      alt={image}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-2">{image}</h3>
                    <p className="text-sm text-gray-400">
                      路径: /{category.folder}/{image}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
