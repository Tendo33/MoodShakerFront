"use client";

import type React from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="w-full animate-fadeIn"
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
