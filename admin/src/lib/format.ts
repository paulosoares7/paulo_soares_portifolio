// Formatação para a interface (pt-BR, fuso America/Manaus).

/** Fuso de exibição; o banco guarda tudo em UTC. */
export const DISPLAY_TIME_ZONE = "America/Manaus";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: DISPLAY_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "short",
});

// Colunas DATE chegam como meia-noite UTC; exibir em UTC evita voltar um dia.
const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", dateStyle: "short" });

const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Data e hora no fuso de Manaus.
 * @param value Data (ou null).
 * @returns Texto como "26/11/2026 14:05" ou "—".
 */
export function formatDateTime(value: Date | null | undefined): string {
  return value ? dateTimeFormatter.format(value) : "—";
}

/**
 * Data de coluna DATE (sem hora).
 * @param value Data (ou null).
 * @returns Texto como "26/11/2026" ou "—".
 */
export function formatDate(value: Date | null | undefined): string {
  return value ? dateOnlyFormatter.format(value) : "—";
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
 * Centavos para o campo de texto do formulário.
 * @param cents Inteiro em centavos.
 * @returns Texto como "19,90".
 */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Converte "19,90" (ou "19.90") em centavos sem passar por float.
 * @param value Texto digitado.
 * @returns Centavos, ou null se o texto for inválido.
 */
export function parseMoneyToCents(value: string): number | null {
  const match = value.trim().match(/^(\d{1,7})(?:[.,](\d{1,2}))?$/);
  if (!match) return null;
  const reais = Number(match[1]);
  const centavos = Number((match[2] ?? "0").padEnd(2, "0"));
  return reais * 100 + centavos;
}

/**
 * Data para <input type="date"> (UTC, formato AAAA-MM-DD).
 * @param value Data (ou null).
 * @returns Texto ISO curto ou vazio.
 */
export function dateToInput(value: Date | null | undefined): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

/**
 * Data de um instante para <input type="date">, no fuso de Manaus.
 * Usada em prazos de acesso ("até 30/06" = até o fim do dia em Manaus).
 * @param value Instante (ou null).
 * @returns AAAA-MM-DD ou vazio.
 */
export function dateToInputInManaus(value: Date | null | undefined): string {
  return value
    ? new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TIME_ZONE }).format(value)
    : "";
}

/**
 * Início do mês corrente no fuso de Manaus, em UTC.
 * Manaus é UTC−4 o ano todo (sem horário de verão), então meia-noite local = 04:00 UTC.
 * @param now Momento de referência.
 * @returns Primeiro instante do mês em Manaus.
 */
export function startOfMonthInManaus(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, 1, 4));
}

/**
 * Duração em segundos como "9:56" ou "1:02:03".
 * @param seconds Segundos (ou null).
 * @returns Texto da duração ou "—".
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
