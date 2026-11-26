// Asaas no painel: consulta das cobranças e cancelamento da assinatura (ao
// excluir um aluno). Cobrança, webhook e regras de acesso (RN02–RN06) ficam
// na plataforma, fase 4.

type AsaasPayment = {
  id: string;
  status: string;
  billingType?: string;
  value: number;
  netValue?: number;
  dueDate: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  invoiceUrl?: string | null;
};

/** Cobrança do Asaas convertida para a tabela payments. */
export type MirroredPayment = {
  gatewayPaymentId: string;
  status: "pending" | "confirmed" | "received" | "overdue" | "refunded" | "canceled";
  billingType: "pix" | "pix_automatic" | "credit_card" | "boleto" | null;
  amountCents: number;
  netAmountCents: number | null;
  dueDate: Date;
  paidAt: Date | null;
  invoiceUrl: string | null;
};

const STATUS_MAP: Record<string, MirroredPayment["status"]> = {
  PENDING: "pending",
  AWAITING_RISK_ANALYSIS: "pending",
  CONFIRMED: "confirmed",
  RECEIVED: "received",
  RECEIVED_IN_CASH: "received",
  OVERDUE: "overdue",
  REFUNDED: "refunded",
  REFUND_REQUESTED: "refunded",
  REFUND_IN_PROGRESS: "refunded",
  CHARGEBACK_REQUESTED: "refunded",
  CHARGEBACK_DISPUTE: "refunded",
  DELETED: "canceled",
};

const BILLING_MAP: Record<string, MirroredPayment["billingType"]> = {
  PIX: "pix",
  CREDIT_CARD: "credit_card",
  BOLETO: "boleto",
};

/**
 * Diz se ASAAS_API_KEY está preenchida.
 * @returns true quando a consulta ao Asaas pode ser usada.
 */
export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY);
}

/**
 * Chama a API do Asaas com a chave do painel.
 * @param path Caminho depois de /v3 (ex.: /subscriptions/sub_123).
 * @param init Método e corpo, se houver.
 * @returns Resposta da API.
 */
async function asaasFetch(path: string, init: { method?: string } = {}): Promise<Response> {
  if (!isAsaasConfigured()) throw new Error("Asaas não configurado (ASAAS_API_KEY).");
  const base = process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3";
  return fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      access_token: process.env.ASAAS_API_KEY ?? "",
      Accept: "application/json",
      "User-Agent": "portfolio-admin",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
}

/**
 * Cancela a assinatura no Asaas (para de gerar cobranças). Assinatura que o
 * Asaas já não tem (404) conta como cancelada.
 * @param gatewaySubscriptionId ID sub_... no Asaas.
 */
export async function cancelAsaasSubscription(gatewaySubscriptionId: string): Promise<void> {
  const response = await asaasFetch(`/subscriptions/${encodeURIComponent(gatewaySubscriptionId)}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`O Asaas respondeu ${response.status} ao cancelar a assinatura.`);
  }
}

/** Valor em reais (float da API) para centavos inteiros. */
function toCents(value: number | undefined): number | null {
  return value == null ? null : Math.round(value * 100);
}

/**
 * Lista as cobranças de uma assinatura no Asaas.
 * @param gatewaySubscriptionId ID sub_... no Asaas.
 * @returns Cobranças no formato da tabela payments.
 */
export async function fetchSubscriptionPayments(
  gatewaySubscriptionId: string,
): Promise<MirroredPayment[]> {
  const response = await asaasFetch(
    `/subscriptions/${encodeURIComponent(gatewaySubscriptionId)}/payments?limit=100`,
  );
  if (!response.ok) throw new Error(`O Asaas respondeu ${response.status}.`);
  const data = (await response.json()) as { data?: AsaasPayment[] };

  return (data.data ?? []).map((p) => {
    const paid = p.paymentDate ?? p.clientPaymentDate;
    return {
      gatewayPaymentId: p.id,
      status: STATUS_MAP[p.status] ?? "pending",
      billingType: p.billingType ? (BILLING_MAP[p.billingType] ?? null) : null,
      amountCents: toCents(p.value) ?? 0,
      netAmountCents: toCents(p.netValue),
      dueDate: new Date(`${p.dueDate}T00:00:00Z`),
      paidAt: paid ? new Date(`${paid}T12:00:00Z`) : null,
      invoiceUrl: p.invoiceUrl ?? null,
    };
  });
}
