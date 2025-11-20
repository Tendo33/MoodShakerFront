import React, { useState } from 'react';
import { X, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useLanguage } from "@/context/LanguageContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ShareModal = ({ isOpen, onClose, imageUrl }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `moodshaker-cocktail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">{t("share.modal.title")}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-[3/4] max-h-[60vh] bg-gray-900/50 rounded-lg overflow-hidden shadow-lg mb-6 border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageUrl} 
              alt="Generated Card" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex gap-3 w-full">
             <Button 
                variant="primary" 
                fullWidth 
                onClick={handleDownload}
                icon={<Download className="w-4 h-4" />}
             >
               {t("share.modal.download")}
             </Button>
          </div>
          <p className="mt-4 text-xs text-gray-500 text-center">
            {t("share.modal.description")}
          </p>
        </div>
      </div>
    </div>
  );
};

