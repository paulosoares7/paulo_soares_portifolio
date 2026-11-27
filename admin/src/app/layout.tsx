import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { THEME_COLOR_DARK } from "@portfolio/ui/theme-color";
import "./globals.css";
import { ServiceWorkerRegister } from "@portfolio/ui/ServiceWorker";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  // Painel privado: fora dos buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: THEME_COLOR_DARK };

/** Layout raiz: fonte Poppins e tema escuro. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
