"use client";

import { useEffect, useState, useRef } from "react";


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

  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

};

// Common animation presets
export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 5,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
  },
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "reverse" as const,
  },
};

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
  const ref = useRef<HTMLDivElement | null>(null);

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
