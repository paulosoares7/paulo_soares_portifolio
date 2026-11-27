"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (/sw.js) depois que a página carrega. Não
 * desenha nada. Sem suporte no navegador (ou em http fora do localhost),
 * simplesmente não faz nada.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem service worker o site funciona igual; só não há a página "Sem conexão".
    });
  }, []);
  return null;
}
