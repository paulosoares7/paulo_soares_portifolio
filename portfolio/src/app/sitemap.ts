import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Sitemap do portfólio (as aulas têm o sitemap próprio na plataforma). */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/sobre", "/publicacoes", "/contato"].map((path) => ({ url: `${SITE_URL}${path}` }));
}
