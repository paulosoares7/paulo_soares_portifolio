import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os pacotes do banco e do tema são TypeScript puro dentro do monorepo.
  transpilePackages: ["@portfolio/database", "@portfolio/ui"],
  // Abrir pelo celular na mesma rede Wi-Fi (só em desenvolvimento): o IP do
  // computador fica em DEV_HOST, no .env.local deste projeto.
  allowedDevOrigins: process.env.DEV_HOST ? [process.env.DEV_HOST] : [],
  // O driver do MySQL usa módulos nativos do Node; fica fora do bundle.
  serverExternalPackages: ["mariadb", "@prisma/adapter-mariadb"],
  experimental: {
    serverActions: {
      // XML do Lattes pode passar de 1 MB (limite padrão).
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
