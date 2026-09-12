"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TerminalNote } from "@/components/ui/terminal-note";

interface RecommendationUnavailableStateProps {
  title: string;
  description: string;
  backLabel: string;
  restartLabel: string;
  onBack: () => void;
  onRestart: () => void;
}

export function RecommendationUnavailableState({
  title,
  description,
  backLabel,
  restartLabel,
  onBack,
  onRestart,
}: RecommendationUnavailableStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-xl"
      >
        <Card
          scanline
          className="px-8 py-14 text-center shadow-[0_20px_48px_rgba(3,0,9,0.32)]"
        >
          <CardHeader>
            <CardTitle className="mb-3 text-2xl font-black tracking-widest">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TerminalNote className="mx-auto mb-8 max-w-lg bg-black/35 text-foreground">
              {description}
            </TerminalNote>
          </CardContent>
          <CardFooter className="flex-col justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={onRestart} variant="secondary" size="lg" effect="glow">
                {restartLabel}
              </Button>
            </motion.div>
            <Button onClick={onBack} variant="primary" size="lg" effect="lift">
              {backLabel}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
