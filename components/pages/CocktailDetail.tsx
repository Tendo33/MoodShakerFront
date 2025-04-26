"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Droplet, ThumbsUp, Share2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import type { Cocktail } from "@/api/cocktail";
import LoadingSpinner from "@/components/LoadingSpinner";
import CocktailImage from "@/components/CocktailImage";
import { getCocktailById } from "@/services/cocktailService";

interface CocktailDetailProps {
  id: string;
}

const CocktailDetail: React.FC<CocktailDetailProps> = ({ id }) => {
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Fetch cocktail data from our service
    setIsLoading(true);

    getCocktailById(id)
      .then((data) => {
        if (data) {
          setCocktail(data);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching cocktail:", error);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!cocktail) {
    return <div>Cocktail not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button onClick={() => router.back()} className="flex items-center mb-4">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <CocktailImage
            cocktailId={id}
            imageData={cocktail.image || null}
            cocktailName={cocktail.name}
            staticCocktailImages={{}}
            className="rounded-lg shadow-md w-full"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{cocktail.name}</h1>
          <p className="text-gray-600 mb-4">
            {cocktail.base_spirit} / {cocktail.alcohol_level}
          </p>

          <div className="flex items-center mb-2">
            <Clock className="mr-2" />
            <span className="text-sm">
              Prep Time: {cocktail.time_required || "5 min"}
            </span>
          </div>

          <div className="flex items-center mb-2">
            <Droplet className="mr-2" />
            <span className="text-sm">
              Ingredients: {cocktail.ingredients.length}
            </span>
          </div>

          <div className="flex items-center mb-4">
            <ThumbsUp className="mr-2" />
            <span className="text-sm">85% liked this</span> {/* Example data */}
          </div>

          <h2 className="text-xl font-semibold mb-2">Ingredients:</h2>
          <ul className="list-disc list-inside mb-4">
            {cocktail.ingredients.map((ingredient, index) => (
              <li key={index}>
                {ingredient.amount} {ingredient.name}
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-semibold mb-2">Instructions:</h2>
          <p className="text-gray-700 mb-4">{cocktail.description}</p>

          <div className="flex items-center justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Add to Favorites
            </button>
            <Share2 className="cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CocktailDetail;
