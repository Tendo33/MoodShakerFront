"use client";

import { useEffect, useState } from "react";

interface AnimatedLoadingProps {
  text?: string;
  colorClass?: string;
  size?: "sm" | "md" | "lg";
}

export default function AnimatedLoading({
  text,
  colorClass = "from-amber-500 to-pink-500",
  size = "md",
}: AnimatedLoadingProps) {
  const [dots, setDots] = useState("");

  // Dynamic loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Static ring */}
        <div
          className={`${sizeClasses[size]} rounded-full absolute border-4 border-solid border-gray-700/30`}
        ></div>

        {/* Animated ring */}
        <div
          className={`${sizeClasses[size]} rounded-full animate-spin absolute border-4 border-solid border-transparent bg-gradient-to-r ${colorClass} border-t-current opacity-75`}
          style={{ borderRadius: "50%" }}
        ></div>

        {/* Pulse effect */}
        <div
          className={`${sizeClasses[size]} absolute animate-ping opacity-20 bg-gradient-to-r ${colorClass} rounded-full`}
        ></div>
      </div>

      {text && (
        <div
          className={`mt-6 ${textSizeClasses[size]} font-medium text-center`}
        >
          <span className="inline-block min-w-[80px]">{text}</span>
          <span className="inline-block w-6 text-left">{dots}</span>
        </div>
      )}
    </div>
  );
}
