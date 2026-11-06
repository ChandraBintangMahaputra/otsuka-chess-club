import type { MetadataRoute } from "next";

/** Default noindex karena situs internal. Set PUBLIC_SITE=true bila terbuka untuk umum. */
export default function robots(): MetadataRoute.Robots {
  const isPublic = process.env.PUBLIC_SITE === "true";
  return {
    rules: isPublic
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/profil"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: isPublic ? `${process.env.SITE_URL ?? ""}/sitemap.xml` : undefined,
  };
}
