// Formatação para a interface (pt-BR, fuso America/Manaus).

/** Fuso de exibição; o banco guarda tudo em UTC. */
export const DISPLAY_TIME_ZONE = "America/Manaus";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Data e hora no fuso de Manaus.
 * @param value Data.
 * @returns Texto como "26 de nov. de 2026, 14:05".
 */
export function formatDateTime(value: Date): string {
  return dateTimeFormatter.format(value);
}

/**
 * Valor em centavos como moeda.
 * @param cents Inteiro em centavos.
 * @returns Texto como "R$ 19,90".
 */
export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / 100);
}

/**
 * Duração do vídeo em minutos para a lista de aulas.
 * @param seconds Segundos (ou null).
 * @returns Texto como "10 min" ou null.
 */
export function formatMinutes(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

/**
 * Plural simples em português.
 * @param count Quantidade.
 * @param singular Palavra no singular.
 * @param plural Palavra no plural.
 * @returns Ex.: "1 aula", "3 aulas".
 */
export function plural(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
