// Foto e currículo do perfil. Ordem de prioridade (decisão do professor):
// 1) arquivo enviado no painel (storage) → 2) link externo → 3) arquivo da
// pasta public/perfil deste projeto (reserva para quem não usa o painel).
import { existsSync } from "node:fs";
import path from "node:path";
import { imageUrl } from "@portfolio/database/external-link";

const PUBLIC_DIR = path.join(process.cwd(), "public", "perfil");
const PHOTO_NAMES = ["foto.jpg", "foto.jpeg", "foto.png", "foto.webp"];

/** Primeiro arquivo que existe em public/perfil, como caminho do site. */
function publicFile(names: string[]): string | null {
  const found = names.find((name) => existsSync(path.join(PUBLIC_DIR, name)));
  return found ? `/perfil/${found}` : null;
}

type ProfileMediaInput = {
  photoUrl?: string | null;
  cvUrl?: string | null;
  photoFile?: { publicUrl: string | null } | null;
  cvFile?: { publicUrl: string | null } | null;
} | null;

/**
 * Endereços finais da foto e do currículo para as páginas.
 * @param profile Perfil com os arquivos e os links.
 * @returns photoUrl e cvUrl (null quando não há nenhum dos três).
 */
export function resolveProfileMedia(profile: ProfileMediaInput): {
  photoUrl: string | null;
  cvUrl: string | null;
} {
  return {
    photoUrl:
      profile?.photoFile?.publicUrl ||
      (profile?.photoUrl ? imageUrl(profile.photoUrl) : null) ||
      publicFile(PHOTO_NAMES),
    cvUrl: profile?.cvFile?.publicUrl || profile?.cvUrl || publicFile(["curriculo.pdf"]),
  };
}
