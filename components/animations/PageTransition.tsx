import type React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return <div className="w-full animate-fadeIn">{children}</div>;
}
