"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { Variants } from "framer-motion";

// Animation variants for common use
export const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
  },
  slideUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  },
  slideDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  },
  slideRight: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
  },
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  staggerFast: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  staggerSlow: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  },
};

// Floating animation for background elements
export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 5,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
  },
};

// Pulse animation for attention-grabbing elements
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
  },
};

// Wave animation for interactive elements
export const waveAnimation = {
  rotate: [0, 15, -10, 5, 0],
  transition: {
    duration: 1.5,
    repeat: 1,
    repeatType: "reverse" as const,
  },
};

// Shimmer animation for loading states
export const shimmerAnimation = {
  x: ["-100%", "100%"],
  transition: {
    repeat: Number.POSITIVE_INFINITY,
    duration: 1.5,
    ease: "linear",
  },
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
  const ref = React.useRef<HTMLDivElement>(null);

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

// Function to generate staggered animation classes
export function getStaggeredDelay(index: number, baseDelay = 100): string {
  return `[animation-delay:${index * baseDelay}ms]`;
}

// Function to create custom animation variants
export function createAnimationVariants(
  type: "fade" | "slide" | "scale" | "custom",
  options?: {
    direction?: "up" | "down" | "left" | "right";
    duration?: number;
    delay?: number;
    custom?: Variants;
  },
): Variants {
  const { direction = "up", duration = 0.6, delay = 0 } = options || {};

  switch (type) {
    case "fade":
      return {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration,
            delay,
          },
        },
      };
    case "slide":
      const offset = 30;
      const directionMap = {
        up: { y: offset },
        down: { y: -offset },
        left: { x: offset },
        right: { x: -offset },
      };
      return {
        hidden: { opacity: 0, ...directionMap[direction] },
        visible: {
          opacity: 1,
          ...(direction === "up" || direction === "down" ? { y: 0 } : { x: 0 }),
          transition: {
            duration,
            delay,
          },
        },
      };
    case "scale":
      return {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            duration,
            delay,
          },
        },
      };
    case "custom":
      return options?.custom || {};
    default:
      return animations.fadeIn;
  }
}
