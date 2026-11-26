"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/**
 * Abre a janela de imprimir ao carregar e deixa um botão para abrir de novo
 * (o botão some no papel).
 */
export function AutoPrint() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-400 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 print:hidden"
    >
      <Printer className="size-4" aria-hidden /> Imprimir ou salvar como PDF
    </button>
  );
}
