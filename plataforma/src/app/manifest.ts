import type { MetadataRoute } from "next";
import { buildManifest } from "@portfolio/ui/pwa";

/** Manifesto do app instalável (PWA); o Next cria o <link rel="manifest">. */
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: "Plataforma de aulas",
    shortName: "Aulas",
    description: "Aulas, atividades e materiais por assinatura.",
  });
}
