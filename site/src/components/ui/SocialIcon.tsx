import { Link as LinkIcon, Mail, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

// O lucide-react 1.x não tem mais ícones de marcas; estes seguem o mesmo
// traço (24×24, stroke 2) para combinar com o resto da interface.
const BRAND_PATHS: Record<string, ReactNode> = {
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  x: (
    <>
      <path d="M4 4l11.7 16H20L8.3 4H4z" />
      <path d="M4 20l6.8-6.8M20 4l-6.8 6.8" />
    </>
  ),
  tiktok: <path d="M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5" />,
};

const NETWORK_NAMES: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
  x: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  email: "E-mail",
  other: "Link",
};

/**
 * Nome legível da rede (para aria-label).
 * @param network Valor do ENUM social_links.network.
 * @returns Nome da rede.
 */
export function networkName(network: string): string {
  return NETWORK_NAMES[network] ?? "Link";
}

/** Ícone da rede social. */
export function SocialIcon({
  network,
  className = "size-5",
}: {
  network: string;
  className?: string;
}) {
  if (network === "email") return <Mail className={className} aria-hidden />;
  if (network === "whatsapp") return <MessageCircle className={className} aria-hidden />;
  const paths = BRAND_PATHS[network];
  if (!paths) return <LinkIcon className={className} aria-hidden />;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths}
    </svg>
  );
}

/** Fileira de ícones redondos das redes (Home e rodapé). */
export function SocialLinks({
  links,
  size = "md",
}: {
  links: { id: number; network: string; label: string | null; url: string }[];
  size?: "sm" | "md";
}) {
  if (links.length === 0) return null;
  const box = size === "sm" ? "size-9" : "size-11";
  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target={link.url.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            aria-label={link.label ?? networkName(link.network)}
            className={`flex ${box} border-accent/60 text-accent hover:bg-accent hover:text-bg items-center justify-center rounded-full border transition-colors`}
          >
            <SocialIcon network={link.network} className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
