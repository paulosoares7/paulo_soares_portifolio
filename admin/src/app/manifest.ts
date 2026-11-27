import type { MetadataRoute } from "next";
import { buildManifest } from "@portfolio/ui/pwa";

/** Manifesto do app instalável (PWA); o Next cria o <link rel="manifest">. */
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    name: "Painel do professor",
    shortName: "Painel",
    description: "Painel gerencial do portfólio e da plataforma de aulas.",
  });
}
