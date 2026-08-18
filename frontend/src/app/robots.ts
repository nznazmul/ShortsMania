import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shortsmania.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/create", "/videos", "/history", "/settings"],
        disallow: ["/api/", "/_next/", "/videos/*.json"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
