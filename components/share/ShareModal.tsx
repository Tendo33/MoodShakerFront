import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useLanguage } from "@/context/LanguageContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ShareModal = ({ isOpen, onClose, imageUrl }: ShareModalProps) => {
  const { t } = useLanguage();

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `moodshaker-cocktail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-black/80 border border-white/20 rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
          >
            {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {t("share.modal.title")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 flex flex-col items-center">
          <div className="relative w-full aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden shadow-2xl mb-8 group">
            {/* Animated Glow Background directly behind image */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-secondary/20 to-primary/30 blur-[40px] opacity-60"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            {/* Glass Container for Image */}
            <div className="absolute inset-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Generated Card"
                className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              variant="primary"
              fullWidth
              onClick={handleDownload}
              icon={<Download className="w-5 h-5" />}
              className="py-6 text-lg shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)] transition-all duration-300 rounded-2xl"
            >
              {t("share.modal.download")}
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground/80 text-center font-medium">
            {t("share.modal.description")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
