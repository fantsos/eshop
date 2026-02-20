import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://fantsos.gr";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/checkout", "/account/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
