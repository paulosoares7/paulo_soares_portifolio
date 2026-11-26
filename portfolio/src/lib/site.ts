// Dados globais do site usados no layout (cabeçalho, rodapé, metadados).
import { cache } from "react";
import { prisma } from "@portfolio/database";
import type { SocialLinkItem } from "@portfolio/ui/SocialIcon";
import { plataformaUrl } from "@/lib/links";

/** URL pública do site (metadados, sitemap). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/**
 * Redes do painel mais o atalho "Aulas" no fim, que leva à plataforma.
 * @param links Redes visíveis (social_links).
 * @returns Lista para a fileira de ícones.
 */
export function withLessonsLink(links: SiteIdentity["socialLinks"]): SocialLinkItem[] {
  return [...links, { id: "aulas", network: "aulas", label: "Aulas", url: plataformaUrl() }];
}

/** Perfil básico e redes, compartilhados por todas as páginas. */
export type SiteIdentity = {
  displayName: string;
  fullName: string;
  headline: string;
  socialLinks: { id: number; network: string; label: string | null; url: string }[];
};

/**
 * Nome, título e redes sociais (uma consulta por requisição).
 * @returns Identidade do site, com valores padrão se o perfil estiver vazio.
 */
export const getSiteIdentity = cache(async (): Promise<SiteIdentity> => {
  const [profile, socialLinks] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: 1 },
      select: { displayName: true, fullName: true, headline: true },
    }),
    prisma.socialLink.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, network: true, label: true, url: true },
    }),
  ]);
  return {
    displayName: profile?.displayName ?? "Portfólio",
    fullName: profile?.fullName ?? "",
    headline: profile?.headline ?? "",
    socialLinks,
  };
});
