import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, CircleStop, Pencil, Plus, RefreshCw } from "lucide-react";
import { prisma, type Prisma } from "@portfolio/database";
import { courseCatalogOrder } from "@/lib/catalog-order";
import { endCourtesy, syncAsaasPayments } from "@/actions/subscriptions";
import { CourtesyForm } from "@/components/forms/CourtesyForm";
import { ExtendCourtesyForm } from "@/components/forms/ExtendCourtesyForm";
import { PlanForm } from "@/components/forms/PlanForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { isAsaasConfigured } from "@/lib/asaas";
import {
  centsToInput,
  dateToInputInManaus,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import {
  BILLING_CYCLES,
  BILLING_TYPES,
  PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
} from "@/lib/labels";

export const metadata: Metadata = { title: "Assinaturas" };

const SUB_TONE = {
  pending: "warning",
  active: "success",
  past_due: "warning",
  canceled: "neutral",
  expired: "danger",
} as const;
const PAY_TONE = {
  pending: "warning",
  confirmed: "success",
  received: "success",
  overdue: "danger",
  refunded: "neutral",
  canceled: "neutral",
} as const;

/** Plano, assinaturas, cobranças e cortesias (RF29). */
export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;
  const where: Prisma.SubscriptionWhereInput =
    status in SUBSCRIPTION_STATUSES ? { status: status as keyof typeof SUBSCRIPTION_STATUSES } : {};
  const now = new Date();

  const [plans, subscriptions, payments, students, courses] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { subscriptions: true } } },
    }),
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        student: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
        courses: {
          orderBy: { slotNumber: "asc" },
          include: { course: { select: { title: true } } },
        },
        courseChanges: {
          where: { status: "scheduled" },
          include: { toCourse: { select: { title: true } } },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: { dueDate: "desc" },
      take: 50,
      include: { subscription: { select: { student: { select: { id: true, name: true } } } } },
    }),
    prisma.student.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.course.findMany({
      where: { status: { not: "archived" } },
      orderBy: courseCatalogOrder,
      select: { id: true, title: true },
    }),
  ]);
  const asaasReady = isAsaasConfigured();
  const inOneMonth = new Date(now);
  inOneMonth.setUTCMonth(inOneMonth.getUTCMonth() + 1);

  return (
    <>
      <PageHeader
        title="Assinaturas"
        description="Plano e preço, assinaturas do Asaas, cobranças e cortesias."
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle
            actions={
              <ModalTrigger
                label={
                  <>
                    <Plus className="size-4" aria-hidden /> Novo plano
                  </>
                }
                title="Novo plano"
              >
                <PlanForm />
              </ModalTrigger>
            }
          >
            Planos
          </CardTitle>
          <ul className="flex flex-col gap-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="rounded-btn border-border bg-surface-2 flex flex-wrap items-center justify-between gap-3 border p-3"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {plan.name} <span className="text-accent">{formatMoney(plan.priceCents)}</span>
                    <span className="text-muted text-sm">
                      / {BILLING_CYCLES[plan.billingCycle].toLowerCase()}
                    </span>
                    {plan.isActive ? (
                      <Badge tone="success">à venda</Badge>
                    ) : (
                      <Badge>fora de venda</Badge>
                    )}
                  </p>
                  <p className="text-muted text-xs">
                    {plan.maxCourses} vaga(s) · {plan._count.subscriptions} assinatura(s)
                    {plan.description ? ` · ${plan.description}` : ""}
                  </p>
                </div>
                <ModalTrigger
                  label={
                    <>
                      <Pencil className="size-4" aria-hidden /> Editar
                    </>
                  }
                  title="Editar plano"
                  variant="ghost"
                >
                  <PlanForm
                    item={{
                      id: plan.id,
                      name: plan.name,
                      description: plan.description ?? "",
                      price: centsToInput(plan.priceCents),
                      billingCycle: plan.billingCycle,
                      maxCourses: plan.maxCourses,
                      isActive: plan.isActive,
                    }}
                  />
                </ModalTrigger>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Nova cortesia</CardTitle>
          <CourtesyForm
            students={students.map((s) => ({ id: s.id, label: `${s.name} (${s.email})` }))}
            plans={plans.map((p) => ({ id: p.id, name: p.name, maxCourses: p.maxCourses }))}
            courses={courses}
            defaultEnd={dateToInputInManaus(inOneMonth)}
          />
        </Card>

        <Card>
          <CardTitle
            actions={
              <form className="flex items-center gap-2">
                <Select
                  name="status"
                  defaultValue={status}
                  aria-label="Filtrar por status"
                  className="w-44"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(SUBSCRIPTION_STATUSES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <button type="submit" className={buttonClasses("secondary", "sm")}>
                  Filtrar
                </button>
              </form>
            }
          >
            Assinaturas
          </CardTitle>
          {!asaasReady ? (
            <p className="text-warning mb-3 text-xs">
              Asaas não configurado (ASAAS_API_KEY): a sincronização de cobranças fica desativada.
            </p>
          ) : null}
          {subscriptions.length === 0 ? (
            <EmptyState>Nenhuma assinatura.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Aluno</Th>
                  <Th>Status</Th>
                  <Th>Disciplinas (vagas)</Th>
                  <Th>Acesso até</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const hasAccess =
                    s.currentPeriodEnd !== null &&
                    s.currentPeriodEnd > now &&
                    ["active", "past_due", "canceled"].includes(s.status);
                  return (
                    <tr key={s.id}>
                      <Td>
                        <Link
                          href={`/alunos/${s.student.id}`}
                          className="hover:text-accent font-medium"
                        >
                          {s.student.name}
                        </Link>
                        <p className="text-muted text-xs">{s.student.email}</p>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={SUB_TONE[s.status]}>{SUBSCRIPTION_STATUSES[s.status]}</Badge>
                          {s.gateway === "manual" ? (
                            <Badge tone="accent">cortesia</Badge>
                          ) : (
                            <Badge>Asaas</Badge>
                          )}
                        </div>
                        <p className="text-muted mt-1 text-xs">
                          {s.gateway === "manual" ? "R$ 0,00" : formatMoney(s.priceCents)} ·{" "}
                          {s.plan.name}
                          {s.billingType ? ` · ${BILLING_TYPES[s.billingType]}` : ""}
                        </p>
                      </Td>
                      <Td>
                        <ol className="text-xs">
                          {[1, 2, 3].map((slot) => {
                            const taken = s.courses.find((c) => c.slotNumber === slot);
                            return (
                              <li key={slot} className={taken ? "" : "text-muted"}>
                                {slot}. {taken ? taken.course.title : "livre"}
                              </li>
                            );
                          })}
                        </ol>
                        {s.courseChanges.map((change) => (
                          <p key={change.id} className="text-warning mt-1 text-xs">
                            Troca agendada (vaga {change.slotNumber} → {change.toCourse.title}) em{" "}
                            {formatDate(change.effectiveAt)}
                          </p>
                        ))}
                      </Td>
                      <Td>
                        {formatDateTime(s.currentPeriodEnd)}
                        <p className={`text-xs ${hasAccess ? "text-success" : "text-muted"}`}>
                          {hasAccess ? "com acesso" : "sem acesso"}
                        </p>
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          {s.gateway === "manual" ? (
                            <>
                              <ModalTrigger
                                label={<CalendarPlus className="size-4" aria-hidden />}
                                title="Prorrogar cortesia"
                                variant="ghost"
                                ariaLabel="Prorrogar cortesia"
                              >
                                <ExtendCourtesyForm
                                  subscriptionId={s.id}
                                  currentEnd={dateToInputInManaus(s.currentPeriodEnd)}
                                />
                              </ModalTrigger>
                              {hasAccess ? (
                                <ActionButton
                                  action={endCourtesy.bind(null, s.id)}
                                  confirm="Encerrar a cortesia agora? O acesso termina na hora."
                                  title="Encerrar cortesia"
                                >
                                  <CircleStop className="size-4" aria-hidden />
                                </ActionButton>
                              ) : null}
                            </>
                          ) : asaasReady ? (
                            <ActionButton
                              action={syncAsaasPayments.bind(null, s.id)}
                              title="Atualizar cobranças pelo Asaas"
                            >
                              <RefreshCw className="size-4" aria-hidden />
                            </ActionButton>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardTitle>Cobranças recentes</CardTitle>
          {payments.length === 0 ? (
            <EmptyState>
              Nenhuma cobrança registrada. Elas chegam pelo webhook do Asaas (fase 4) ou pela
              sincronização.
            </EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Vencimento</Th>
                  <Th>Aluno</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                  <Th>Pago em</Th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <Td>{formatDate(p.dueDate)}</Td>
                    <Td>
                      <Link
                        href={`/alunos/${p.subscription.student.id}`}
                        className="hover:text-accent"
                      >
                        {p.subscription.student.name}
                      </Link>
                    </Td>
                    <Td>
                      {formatMoney(p.amountCents)}
                      {p.netAmountCents != null ? (
                        <p className="text-muted text-xs">
                          líquido {formatMoney(p.netAmountCents)}
                        </p>
                      ) : null}
                    </Td>
                    <Td>
                      <Badge tone={PAY_TONE[p.status]}>{PAYMENT_STATUSES[p.status]}</Badge>
                      {p.billingType ? (
                        <p className="text-muted text-xs">{BILLING_TYPES[p.billingType]}</p>
                      ) : null}
                    </Td>
                    <Td>
                      {formatDateTime(p.paidAt)}
                      {p.invoiceUrl ? (
                        <a
                          href={p.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent block text-xs hover:underline"
                        >
                          fatura
                        </a>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
