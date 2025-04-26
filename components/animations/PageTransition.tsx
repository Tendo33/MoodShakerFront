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

  useEffect(() => {
    if (pathname) {
      setTransitionStage("fadeOut");

      const timeout = setTimeout(() => {
        setTransitionStage("fadeIn");
      }, 300); // Match this with the animation duration

      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`w-full transition-opacity duration-300 ${transitionStage === "fadeIn" ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}
