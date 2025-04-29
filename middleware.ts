import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of all supported languages
const supportedLanguages = ["en", "cn"] as const;
const defaultLanguage = "cn";

// Static resource file extensions
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a static resource request
  const isStaticFile = staticFileExtensions.some((ext) =>
    pathname.endsWith(ext),
  );

  // If it's a static resource request, proceed directly
  if (isStaticFile) {
    return NextResponse.next();
  }

  // Check if the pathname already has a language prefix
  const pathnameHasLanguage = supportedLanguages.some(
    (language) =>
      pathname.startsWith(`/${language}/`) || pathname === `/${language}`,
  );

  if (pathnameHasLanguage) {
    return NextResponse.next();
  }

  // If no language in pathname, redirect based on user preference or default
  let language = defaultLanguage;

  // Check for language in cookie
  const languageCookie = request.cookies.get("moodshaker-language");

  if (
    languageCookie &&
    supportedLanguages.includes(
      languageCookie.value as (typeof supportedLanguages)[number],
    )
  ) {
    language = languageCookie.value as (typeof supportedLanguages)[number];
  } else {
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      const preferredLanguage = acceptLanguage
        .split(",")
        .map((item) => item.split(";")[0].trim())
        .find((item) =>
          supportedLanguages.some((lang) => item.startsWith(lang)),
        );

      if (preferredLanguage) {
        // Only use English if explicitly set to English
        language = preferredLanguage.startsWith("en") ? "en" : "cn";
      }
    }
  }

  console.log("最终选择的语言:", language);

  // Redirect to the appropriate language path
  const newUrl = new URL(
    `/${language}${pathname === "/" ? "" : pathname}`,
    request.url,
  );
  console.log("重定向到:", newUrl.toString());

  // Create a response with the redirect
  const response = NextResponse.redirect(newUrl);

  // Set a cookie to remember the language preference
  response.cookies.set("moodshaker-language", language, {
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  console.log("设置Cookie:", language);

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
