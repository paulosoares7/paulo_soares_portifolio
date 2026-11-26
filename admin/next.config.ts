import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O pacote do banco é TypeScript puro dentro do monorepo.
  transpilePackages: ["@portfolio/database"],
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
