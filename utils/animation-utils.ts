"use client";

import { useEffect, useState, useRef } from "react";
import type { TargetAndTransition, Variants } from "framer-motion";

// Sophisticated animation variants for modern UI
export const animations = {
  // Elegant fade in with subtle scale
  fadeIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const },
    },
  },

  // Smooth slide up with enhanced easing
  slideUp: {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const },
    },
  },

  // Slide in from left
  slideInLeft: {
    hidden: { opacity: 0, x: -50, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const },
    },
  },

  // Slide in from right
  slideInRight: {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const },
    },
  },

  // Sophisticated stagger container
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  },

  // Scale up with rotation
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
    },
  },

  // Elegant fade down
  fadeInDown: {
    hidden: { opacity: 0, y: -30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] as const },
    },
  },
} satisfies Record<string, Variants>;

// Sophisticated animation presets
export const floatAnimation = {
  y: [0, -15, 0],
  x: [0, 5, 0],
  scale: [1, 1.02, 1],
  transition: {
    duration: 6,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  },
} satisfies TargetAndTransition;

export const pulseAnimation = {
  scale: [1, 1.03, 1],
  opacity: [1, 0.85, 1],
  transition: {
    duration: 3,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  },
} satisfies TargetAndTransition;

// Hook to delay animations until component is mounted
export function useDelayedAnimation(delay = 0): boolean {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldAnimate;
}

// Hook to trigger animations when element is in viewport
export function useInViewAnimation(
  threshold = 0.1,
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold]);

  return [ref, isInView];
}
