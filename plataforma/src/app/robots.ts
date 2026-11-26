import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Buscadores indexam o catálogo e as aulas; login, área do aluno e APIs ficam fora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [
        "/entrar",
        "/cadastrar",
        "/esqueci-a-senha",
        "/redefinir-senha",
        "/confirmar-email",
        "/minha-area",
        "/api/",
      ], },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
