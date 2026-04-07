import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useLanguage } from "@/context/LanguageContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ShareModal = ({ isOpen, onClose, imageUrl }: ShareModalProps) => {
  const { t, language } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isDialogOpen = isOpen && Boolean(imageUrl);

  useFocusTrap({
    isOpen: isDialogOpen,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    onClose,
  });

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDialogOpen]);

  const handleDownload = () => {
    if (!imageUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `moodshaker-cocktail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isDialogOpen && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg bg-black/80 border-2 border-primary/30 rounded-none overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            aria-describedby="share-modal-description"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 id="share-modal-title" className="text-lg font-bold text-foreground">
                {t("share.modal.title")}
              </h3>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-none hover:bg-white/10 focus-ring"
                type="button"
                aria-label={language === "en" ? `${t("common.close")} dialog` : "关闭对话框"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] max-h-[55vh] rounded-none overflow-hidden shadow-2xl mb-8 group">
                {/* Animated glow is intentionally subtle to preserve the synthwave feel without overpowering the card */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-secondary/10 to-primary/20 blur-[28px] opacity-45"
                  animate={{
                    scale: [1, 1.04, 1],
                    opacity: [0.38, 0.52, 0.38],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <div className="absolute inset-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-none overflow-hidden">
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
                  className="py-6 text-lg shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)] transition-all duration-300 rounded-none"
                >
                  {t("share.modal.download")}
                </Button>
              </div>
              <p
                id="share-modal-description"
                className="mt-5 text-sm text-muted-foreground/80 text-center font-medium"
              >
                {t("share.modal.description")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
