import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacotes internos do monorepo escritos em TypeScript puro.
  transpilePackages: ["@portfolio/database", "@portfolio/ui"],
  // O driver do MySQL usa módulos nativos do Node; fica fora do bundle.
  serverExternalPackages: ["mariadb", "@prisma/adapter-mariadb"],
  poweredByHeader: false,
};

export default nextConfig;
