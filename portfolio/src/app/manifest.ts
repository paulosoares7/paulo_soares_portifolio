import type { MetadataRoute } from "next";
import { buildManifest } from "@portfolio/ui/pwa";

/** Manifesto do app instalável (PWA); o Next cria o <link rel="manifest">. */
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: "Portfólio acadêmico",
    shortName: "Portfólio",
    description: "Perfil, formação e publicações do professor.",
  });
}
