"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toPng } from "html-to-image";
import type { Cocktail } from "@/api/cocktail";
import { PolaroidCard } from "@/components/share/PolaroidCard";
import { ShareModal } from "@/components/share/ShareModal";

interface ShareRenderProps {
  isGeneratingCard: boolean;
  generateCard: () => Promise<void>;
}

interface CocktailSharePortalProps {
  cocktail: Cocktail | null;
  imageUrl: string;
  children: (props: ShareRenderProps) => ReactNode;
}

export function CocktailSharePortal({
  cocktail,
  imageUrl,
  children,
}: CocktailSharePortalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setGeneratedCardUrl(null);
  }, []);

  const generateCard = useCallback(async () => {
    if (!cardRef.current) {
      return;
    }

    setIsGeneratingCard(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        skipAutoScale: true,
      });
      setGeneratedCardUrl(dataUrl);
      setIsOpen(true);
    } catch (error) {
      console.error("Failed to generate card", error);
    } finally {
      setIsGeneratingCard(false);
    }
  }, []);

  return (
    <>
      {children({ isGeneratingCard, generateCard })}

      <div style={{ position: "fixed", top: "-9999px", left: "-9999px" }}>
        {cocktail && (
          <PolaroidCard ref={cardRef} cocktail={cocktail} imageUrl={imageUrl} />
        )}
      </div>

      <ShareModal isOpen={isOpen} onClose={closeModal} imageUrl={generatedCardUrl} />
    </>
  );
}
