import type { MetadataRoute } from "next";
import { en } from "@/lib/dictionaries/en";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: en.meta.siteName,
    short_name: en.meta.siteName,
    description: en.meta.homeDescription,
    start_url: "/",
    display: "standalone",
    // The shaker sits on this mint. A bone splash would show a ring around the icon.
    background_color: "#c5e2ce",
    // Same bone as the root viewport themeColor.
    theme_color: "#fbf9f4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
