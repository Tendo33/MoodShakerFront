import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/csp";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  localeFromPathname,
} from "@/lib/i18n";

/**
 * Locale routing and the per-request CSP.
 *
 * A path without a locale is redirected: cookie first (an explicit choice),
 * then Accept-Language, then the default. Paths with a locale pass through with
 * a fresh nonce.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathLocale = localeFromPathname(pathname);

  if (pathLocale) {
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("x-locale", pathLocale);
    headers.set("content-security-policy", csp);

    const response = NextResponse.next({ request: { headers } });
    response.headers.set("content-security-policy", csp);
    return response;
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    (isLocale(cookie) ? cookie : null) ??
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE;

  const target = new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url);
  return NextResponse.redirect(target);
}

export const config = {
  // API routes, Next internals, metadata routes and anything with a file extension skip the proxy.
  matcher: ["/((?!api|_next|sitemap.xml|robots.txt|.*\\..*).*)"],
};
