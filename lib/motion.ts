/**
 * Entrance props for `motion.*` elements, shared by server and client
 * components. The curve and the 60ms beat per index are the site's own, so the
 * page keeps the rhythm it had when these were CSS classes.
 *
 * Every helper tags its element `data-motion`. The hidden start state is
 * written into the server HTML, so a <noscript> rule in app/layout.tsx shows
 * tagged elements when there is no script to play the entrance.
 */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const BEAT = 0.06;
const TAG = { "data-motion": "" } as const;

/** Arrives with the page: rises and fades in, one beat later for each index. */
export function enter(index = 0) {
  return {
    ...TAG,
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.62, delay: index * BEAT, ease: EASE_OUT },
  };
}

/** Rises into place once, as it comes into view. */
export function reveal(index = 0) {
  return {
    ...TAG,
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px 10% 0px" },
    transition: { duration: 0.62, delay: index * BEAT, ease: EASE_OUT },
  };
}

/** A photograph settles from slightly large once it is in view. */
export function revealPicture(index = 0) {
  return {
    ...TAG,
    initial: { opacity: 0, scale: 1.04 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "0px 0px 10% 0px" },
    transition: { duration: 0.62, delay: index * BEAT, ease: EASE_OUT },
  };
}

/** A question's parts arrive from the side the guest is heading to; the first question rises like any entrance. */
export function stepEnter(direction: "forward" | "back" | null, index = 0) {
  const from = direction === "forward" ? { x: 28 } : direction === "back" ? { x: -28 } : { y: 20 };
  return {
    ...TAG,
    initial: { opacity: 0, ...from },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.62, delay: index * BEAT, ease: EASE_OUT },
  };
}
