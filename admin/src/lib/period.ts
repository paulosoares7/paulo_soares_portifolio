// Período dos gráficos e relatórios (7 dias, 30 dias, 12 meses ou datas
// escolhidas). As datas ficam em UTC no banco; os dias e meses são contados
// no fuso de Manaus (UTC−4, sem horário de verão).

const MANAUS_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Acima disso o período personalizado é agrupado por mês. */
const MAX_DAILY_BUCKETS = 62;

export type PeriodKey = "7d" | "30d" | "12m" | "custom";

/** Período escolhido, já resolvido em datas UTC e no tamanho do agrupamento. */
export type Period = {
  key: PeriodKey;
  from: Date;
  to: Date;
  bucket: "day" | "month";
  /** Datas para os campos do filtro (AAAA-MM-DD, fuso de Manaus). */
  fromInput: string;
  toInput: string;
  label: string;
};

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "12m", label: "12 meses" },
  { key: "custom", label: "Personalizado" },
];

/**
 * Dia (AAAA-MM-DD) de uma data no fuso de Manaus.
 * @param date Data UTC.
 * @returns Dia em Manaus.
 */
export function manausDay(date: Date): string {
  return new Date(date.getTime() - MANAUS_OFFSET_MS).toISOString().slice(0, 10);
}

/** Início do dia em Manaus, em UTC. */
function startOfDay(day: string): Date {
  return new Date(`${day}T00:00:00.000-04:00`);
}

/** Fim do dia em Manaus, em UTC. */
function endOfDay(day: string): Date {
  return new Date(`${day}T23:59:59.999-04:00`);
}

/**
 * Lê o período dos parâmetros da URL (?periodo=30d&de=...&ate=...).
 * Valor inválido cai em 30 dias.
 * @param params periodo, de e ate.
 * @param now Agora (para testes).
 * @returns Período resolvido.
 */
export function parsePeriod(
  params: { periodo?: string; de?: string; ate?: string },
  now = new Date(),
): Period {
  const today = manausDay(now);
  const key: PeriodKey = (["7d", "30d", "12m", "custom"] as const).includes(
    params.periodo as PeriodKey,
  )
    ? (params.periodo as PeriodKey)
    : "30d";
  const isDay = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

  let fromDay: string;
  let toDay = today;
  if (key === "custom" && isDay(params.de) && isDay(params.ate)) {
    [fromDay, toDay] = [params.de as string, params.ate as string].sort() as [string, string];
  } else if (key === "12m" || key === "custom") {
    // 12 meses: do 1º dia de 11 meses atrás até hoje (12 colunas de mês).
    const start = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
    start.setUTCMonth(start.getUTCMonth() - 11);
    fromDay = start.toISOString().slice(0, 10);
  } else {
    const days = key === "7d" ? 7 : 30;
    fromDay = manausDay(new Date(startOfDay(today).getTime() - (days - 1) * DAY_MS));
  }

  const from = startOfDay(fromDay);
  const to = endOfDay(toDay);
  const spanDays = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  const bucket = key === "12m" || spanDays > MAX_DAILY_BUCKETS ? "month" : "day";
  const fmt = (day: string) => day.split("-").reverse().join("/");
  return {
    key: key === "custom" && !(isDay(params.de) && isDay(params.ate)) ? "12m" : key,
    from,
    to,
    bucket,
    fromInput: fromDay,
    toInput: toDay,
    label: `${fmt(fromDay)} a ${fmt(toDay)}`,
  };
}

/**
 * Chave do agrupamento de uma data (dia ou mês em Manaus).
 * @param date Data UTC.
 * @param bucket Dia ou mês.
 * @returns "AAAA-MM-DD" ou "AAAA-MM".
 */
export function bucketKey(date: Date, bucket: Period["bucket"]): string {
  const day = manausDay(date);
  return bucket === "day" ? day : day.slice(0, 7);
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Todas as colunas do período, em ordem, com o rótulo curto do eixo.
 * @param period Período resolvido.
 * @returns Chave e rótulo de cada dia ou mês.
 */
export function periodBuckets(period: Period): { key: string; label: string }[] {
  const buckets: { key: string; label: string }[] = [];
  if (period.bucket === "day") {
    for (let t = period.from.getTime(); t <= period.to.getTime(); t += DAY_MS) {
      const day = manausDay(new Date(t + 12 * 60 * 60 * 1000));
      if (buckets.at(-1)?.key === day) continue;
      buckets.push({ key: day, label: `${day.slice(8, 10)}/${day.slice(5, 7)}` });
    }
    return buckets;
  }
  const cursor = new Date(`${period.fromInput.slice(0, 7)}-01T12:00:00Z`);
  const last = period.toInput.slice(0, 7);
  while (cursor.toISOString().slice(0, 7) <= last) {
    const key = cursor.toISOString().slice(0, 7);
    buckets.push({ key, label: `${MONTHS[cursor.getUTCMonth()]}/${key.slice(2, 4)}` });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return buckets;
}

/**
 * Conta datas por coluna do período.
 * @param dates Datas (UTC) dos eventos; null é ignorado.
 * @param period Período resolvido.
 * @returns Mapa chave da coluna → quantidade.
 */
export function countByBucket(dates: (Date | null)[], period: Period): Map<string, number> {
  const counts = new Map<string, number>();
  for (const date of dates) {
    if (!date) continue;
    const key = bucketKey(date, period.bucket);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
