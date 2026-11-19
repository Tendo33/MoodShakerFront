import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, HTML_LANG, isLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-hanken",
});

// Chinese glyphs come in many unicode-range slices; preloading them all would
// stall first paint, so the browser fetches only the slices a page uses.
const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500"],
  preload: false,
  variable: "--font-noto-sans-sc",
});

// The display pair: headlines and drink names are set in a serif, the way a
// menu is, and everything that is read or pressed stays in the grotesk.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const notoSerifSC = Noto_Serif_SC({
  weight: ["600"],
  preload: false,
  variable: "--font-noto-serif-sc",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "MoodShaker", template: "%s · MoodShaker" },
  // The supplied ico stores RGB PNG frames. `app/favicon.ico` fails the build
  // on those, so the tab and Apple icons stay public files and are linked here.
  icons: {
    icon: { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  themeColor: "#e6e0d2",
};

/**
 * The root layout sits above `[lang]` so `not-found` has a shell to render in.
 * `proxy.ts` passes the locale down as a request header; reading headers also
 * keeps every page dynamic, which the per-request CSP nonce requires.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await headers()).get("x-locale");

  return (
    <html
      lang={HTML_LANG[isLocale(locale) ? locale : DEFAULT_LOCALE]}
      className={`${hanken.variable} ${notoSansSC.variable} ${fraunces.variable} ${notoSerifSC.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
