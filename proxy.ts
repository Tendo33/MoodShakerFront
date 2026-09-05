import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  type Locale,
  localeFromAcceptLanguage,
  localeFromPathname,
  isLocale,
} from "@/lib/i18n/config";
import {
  buildContentSecurityPolicy,
  createNonce,
} from "@/lib/security/csp";

/**
 * The only place language is derived from anything other than the URL.
 *
 * Once a request carries a `/cn` or `/en` prefix, that prefix is the answer
 * everywhere downstream. The decision is forwarded on `LOCALE_HEADER` so the root
 * layout does not have to re-sniff `accept-language` to render `<html lang>` —
 * that second derivation could disagree with the redirect that had just happened.
 */

const staticFileExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".avif",
];

/**
 * Paths that must stay at the root, unprefixed.
 *
 * A crawler looks for `/sitemap.xml` and `/robots.txt` at the origin root and
 * nowhere else. Locale handling used to redirect them to `/cn/sitemap.xml`, which
 * made both files effectively missing — the redirect is not followed for these.
 */
const rootOnlyPaths = new Set([
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.ico",
]);

/** Reads the stored choice, ignoring a cookie holding an unsupported value. */
function localeFromCookie(request: NextRequest): Locale | null {
  const value = request.cookies.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : null;
}

/**
 * Attaches a per-request nonce and CSP, and forwards the nonce to the app.
 *
 * Next.js reads the nonce out of the CSP header on the request and stamps it onto
 * the script tags it emits, so its own hydration scripts keep working without
 * `unsafe-inline`.
 */
function withSecurityHeaders(
  request: NextRequest,
  extraRequestHeaders: Array<[string, string]> = [],
): NextResponse {
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV !== "production",
  });

  const response = NextResponse.next({
    request: {
      headers: new Headers([
        ...request.headers.entries(),
        // Next reads the nonce from the CSP header on the request to stamp its
        // own scripts; `x-nonce` is for application code that needs it too.
        ["x-nonce", nonce],
        ["content-security-policy", csp],
        ...extraRequestHeaders,
      ]),
    },
  });

  response.headers.set("content-security-policy", csp);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = localeFromPathname(pathname);

  const pathToCheck = pathLocale
    ? pathname.slice(pathLocale.length + 1) || "/"
    : pathname;

  if (staticFileExtensions.some((ext) => pathToCheck.endsWith(ext))) {
    return NextResponse.next();
  }

  // Checked against the raw pathname, not the locale-stripped one: the point is
  // that these live at the root and must not be redirected under a prefix.
  if (rootOnlyPaths.has(pathname)) {
    return NextResponse.next();
  }

  // The prefix already answers the question. Forward it rather than deriving it
  // a second time downstream.
  if (pathLocale) {
    const response = withSecurityHeaders(request, [
      [LOCALE_HEADER, pathLocale],
    ]);
    response.headers.set(LOCALE_HEADER, pathLocale);
    return response;
  }

  // An explicit choice outranks the browser's advertised preferences.
  const stored = localeFromCookie(request);
  const locale =
    stored ??
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE;

  const target = new URL(
    `/${locale}${pathname === "/" ? "" : pathname}`,
    request.url,
  );
  target.search = request.nextUrl.search;

  const response = NextResponse.redirect(target);

  // Only persist a locale the user actually chose. Writing a value derived from
  // `accept-language` would freeze a guess into an explicit-looking preference
  // that then outranks the header it came from.
  if (stored) {
    response.cookies.set(LOCALE_COOKIE, stored, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
