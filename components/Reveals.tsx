"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Section entrances: `.reveal` and `.reveal-picture` rise or settle once as they
 * come into view. The hidden state only applies under `html.reveals`, which is
 * set here, so without script every element is simply visible.
 */
export function Reveals() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("reveals");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      // Slightly ahead of the viewport, so fast scrolling never lands on empty space.
      { rootMargin: "0px 0px 10% 0px" },
    );
    const watch = () =>
      document.querySelectorAll(".reveal:not(.is-in), .reveal-picture:not(.is-in)").forEach((el) => observer.observe(el));
    watch();

    // Content that arrives after navigation (a recipe fetched on the client)
    // must be picked up too, or it would stay hidden.
    const mutations = new MutationObserver(watch);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
