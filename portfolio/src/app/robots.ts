import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Buscadores indexam todas as páginas do portfólio; só as APIs ficam fora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
