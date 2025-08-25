"use client";

import { useEffect, useState, useRef } from "react";
import type { Variants } from "framer-motion";

// Sophisticated animation variants for modern UI
export const animations = {
  // Elegant fade in with subtle scale
  fadeIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
  },
  
  // Smooth slide up with enhanced easing
  slideUp: {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
  },

  // Slide in from left
  slideInLeft: {
    hidden: { opacity: 0, x: -50, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
  },

  // Slide in from right
  slideInRight: {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } },
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
    visible: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
  },

  // Elegant fade down
  fadeInDown: {
    hidden: { opacity: 0, y: -30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] } },
  },
};

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
};

export const gentleFloat = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  },
};

export const pulseAnimation = {
  scale: [1, 1.03, 1],
  opacity: [1, 0.85, 1],
  transition: {
    duration: 3,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  },
};

export const subtlePulse = {
  scale: [1, 1.01, 1],
  opacity: [0.9, 1, 0.9],
  transition: {
    duration: 2.5,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  },
};

export const shimmerAnimation = {
  x: ["-100%", "100%"],
  transition: {
    repeat: Number.POSITIVE_INFINITY,
    duration: 2,
    ease: "linear",
  },
};

// Sophisticated background animations
export const backgroundOrb = {
  y: [0, -30, 0],
  x: [0, Math.sin(1) * 20, 0],
  scale: [1, 1.08, 1],
  opacity: [0.05, 0.15, 0.05],
  transition: {
    duration: 12,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
};

export const lightRay = {
  opacity: [0.05, 0.4, 0.05],
  scaleX: [0.3, 1.1, 0.3],
  transition: {
    duration: 8,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
};

// Progress and loading animations
export const progressFill = {
  width: ["0%", "100%"],
  transition: {
    duration: 3,
    ease: [0.23, 1, 0.32, 1],
  },
};

export const elegantPulse = {
  scale: [1, 1.5, 1],
  opacity: [0.4, 1, 0.4],
  transition: {
    duration: 2,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
};

// Liquid animation for cocktail effects
export const liquidMotion = {
  height: ["30%", "70%", "50%"],
  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
  transition: {
    duration: 4,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
};

export const liquidSurface = {
  scaleX: [1, 1.15, 0.9, 1],
  y: [0, -4, 4, 0],
  transition: {
    duration: 2.5,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
};

// Sophisticated entrance animations
export const sophisticatedEntrance = {
  initial: { opacity: 0, scale: 0.9, y: 30 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 1.2, ease: [0.23, 1, 0.32, 1] },
};

// Card hover effects
export const cardHover = {
  scale: 1.02,
  y: -5,
  transition: { duration: 0.3, ease: "easeOut" },
};

export const cardTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

// Glass morphism effects
export const glassMorphism = {
  backdropFilter: "blur(12px)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.1)",
};

// Sophisticated loading states
export const loadingStates = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
};

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
): [React.RefObject<HTMLDivElement>, boolean] {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isInView];
}
