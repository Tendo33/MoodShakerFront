import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, HTML_LANG, isLocale } from "@/lib/i18n";
import { MotionRoot } from "@/components/MotionRoot";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  // 600 and 700 are the headline weights. Without them the browser synthesises
  // bold from the 500 face, and every headline looks smeared rather than set.
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
});

// Chinese glyphs come in many unicode-range slices; preloading them all would
// stall first paint, so the browser fetches only the slices a page uses.
const notoSansSC = Noto_Sans_SC({
  // Chinese headings are 600; a synthesised 600 from the 500 face thickens the
  // strokes unevenly, which is most of the difference between set and printed.
  weight: ["400", "500", "600"],
  preload: false,
  variable: "--font-noto-sans-sc",
});

// The ticket's own voice: every line a guest would read on the paper —
// labels, values, totals, the stamp — is set in mono.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-ticket",
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
  themeColor: "#fbf9f4",
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
      className={`${hanken.variable} ${notoSansSC.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {/* Entrances start from a hidden state written into the HTML; without script nothing would show them. */}
        <noscript>
          <style>{`[data-motion]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
