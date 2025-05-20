"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [transitionStage, setTransitionStage] = useState("fadeIn");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (pathname && isMounted) {
      setTransitionStage("fadeOut");
      const timeout = setTimeout(() => {
        setTransitionStage("fadeIn");
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [pathname, isMounted]);

  return (
    <div
      key={pathname}
      className={`w-full transition-opacity duration-300 ${
        !isMounted || transitionStage === "fadeIn" ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
