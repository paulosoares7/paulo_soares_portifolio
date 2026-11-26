import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Buscadores indexam as páginas públicas; área do aluno e APIs ficam fora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/entrar", "/minha-area", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
