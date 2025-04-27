import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of all supported languages
const supportedLanguages = ["en", "zh"];
const defaultLanguage = "en";

// 静态资源文件扩展名列表
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

  // 检查是否是静态资源请求
  const isStaticFile = staticFileExtensions.some((ext) =>
    pathname.endsWith(ext),
  );

  // 如果是静态资源请求，直接放行
  if (isStaticFile) {
    return NextResponse.next();
  }

  // Check if the pathname already has a language prefix
  const pathnameHasLanguage = supportedLanguages.some(
    (language) =>
      pathname.startsWith(`/${language}/`) || pathname === `/${language}`,
  );

  if (pathnameHasLanguage) return NextResponse.next();

  // If no language in pathname, redirect based on user preference or default
  let language = defaultLanguage;

  // Check for language in cookie
  const languageCookie = request.cookies.get("moodshaker-language");
  if (languageCookie && supportedLanguages.includes(languageCookie.value)) {
    language = languageCookie.value;
  } else {
    // Check for language in localStorage via a custom header that the client can set
    const storedLanguage = request.headers.get("x-moodshaker-language");
    if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
      language = storedLanguage;
    } else {
      // Check for language in Accept-Language header
      const acceptLanguage = request.headers.get("accept-language");
      if (acceptLanguage) {
        const preferredLanguage = acceptLanguage
          .split(",")
          .map((item) => item.split(";")[0].trim())
          .find((item) =>
            supportedLanguages.some((lang) => item.startsWith(lang)),
          );

        if (preferredLanguage) {
          if (preferredLanguage.startsWith("zh")) {
            language = "zh";
          } else {
            language = "en";
          }
        }
      }
    }
  }

  // Redirect to the appropriate language path
  const newUrl = new URL(
    `/${language}${pathname === "/" ? "" : pathname}`,
    request.url,
  );

  // Create a response with the redirect
  const response = NextResponse.redirect(newUrl);

  // Set a cookie to remember the language preference
  response.cookies.set("moodshaker-language", language, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
