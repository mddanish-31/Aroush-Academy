import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/login",
        "/register",
        "/api",
        "/api/",
      ],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
