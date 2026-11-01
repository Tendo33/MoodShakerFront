import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Noto_Sans_SC } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "MoodShaker", template: "%s · MoodShaker" },
  icons: { icon: "/favicon.ico" },
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
      className={`${hanken.variable} ${notoSansSC.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
