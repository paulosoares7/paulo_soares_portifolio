// Dados globais da plataforma usados no layout (cabeçalho, rodapé, metadados).
import { cache } from "react";
import { prisma } from "@portfolio/database";

/** URL pública da plataforma (metadados, sitemap, links do e-mail). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002").replace(
  /\/+$/,
  "",
);

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
