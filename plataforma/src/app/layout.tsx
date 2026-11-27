import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { BottomNav } from "@/components/layout/NavLinks";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSiteIdentity, SITE_URL } from "@/lib/site";
import "./globals.css";
import { THEME_COLOR_DARK } from "@portfolio/ui/theme-color";
import { ServiceWorkerRegister } from "@portfolio/ui/ServiceWorker";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = { themeColor: THEME_COLOR_DARK };

/** Metadados padrão da plataforma a partir do perfil (RNF06). */
export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const name = identity.fullName || identity.displayName;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `Aulas de Física | ${name}`, template: `%s | Aulas de Física` },
    description: `Plataforma de aulas de Física de ${name}: videoaulas, atividades e materiais.`,
    openGraph: { type: "website", locale: "pt_BR", siteName: name },
  };
}

/** Layout raiz: Poppins, tema escuro, cabeçalho, rodapé e menu inferior no celular. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const identity = await getSiteIdentity();
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#conteudo"
          className="focus:rounded-btn focus:bg-accent focus:text-bg sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader displayName={identity.displayName} />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <SiteFooter identity={identity} />
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
