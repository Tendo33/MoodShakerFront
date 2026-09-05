import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/i18n/metadata";

/**
 * `robots.txt`, which the project did not have.
 *
 * Private recommendations are disallowed explicitly. They are reached with an edit
 * token in a POST body rather than in the URL, so a crawler cannot read one, but a
 * crawler that follows a shared link would still burn requests on a page that
 * renders nothing useful to it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cn/cocktail/recommendation", "/en/cocktail/recommendation"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
