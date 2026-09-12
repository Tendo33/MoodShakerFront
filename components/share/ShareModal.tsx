"use client";

import { motion } from "framer-motion";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ShareModal = ({ isOpen, onClose, imageUrl }: ShareModalProps) => {
  const { t, language } = useLanguage();
  const isDialogOpen = isOpen && Boolean(imageUrl);

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
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-lg"
        aria-describedby="share-modal-description"
      >
        <DialogHeader>
          <DialogTitle id="share-modal-title">
            {t("share.modal.title")}
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              type="button"
              aria-label={
                language === "en" ? `${t("common.close")} dialog` : "关闭对话框"
              }
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col items-center p-6 md:p-8">
          <div className="group relative mb-8 aspect-[3/4] w-full max-h-[55vh] overflow-hidden rounded-none shadow-2xl">
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-secondary/10 to-primary/20 opacity-45 blur-[28px]"
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
            <div className="absolute inset-2 overflow-hidden rounded-none border border-white/10 bg-black/40 backdrop-blur-md">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Generated Card"
                  className="relative z-10 h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                />
              ) : null}
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleDownload}
            icon={<Download className="h-5 w-5" />}
            className="py-6 text-lg"
          >
            {t("share.modal.download")}
          </Button>
          <DialogDescription
            id="share-modal-description"
            className="mt-5 text-center font-medium text-muted-foreground/80"
          >
            {t("share.modal.description")}
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
};
