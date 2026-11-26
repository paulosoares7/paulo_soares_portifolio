import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogOut, UserX } from "lucide-react";
import { prisma } from "@portfolio/database";
import { anonymizeStudent, endAllSessions, endSession } from "@/actions/students";
import { StudentForm } from "@/components/forms/StudentForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { SUBSCRIPTION_STATUSES } from "@/lib/labels";

export const metadata: Metadata = { title: "Aluno" };

const EVENT_LABEL = {
  login: "entrou",
  login_denied: "entrada negada",
  play: "assistiu",
  material_view: "abriu material",
  logout: "saiu",
} as const;

/** Aluno: dados, sessões, assinaturas, acessos e anonimização (RF29). */
export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const now = new Date();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      sessions: { orderBy: { createdAt: "desc" } },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        include: {
          courses: {
            orderBy: { slotNumber: "asc" },
            include: { course: { select: { title: true } } },
          },
        },
      },
    },
  });
  if (!student) notFound();
  const logs = await prisma.accessLog.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { lesson: { select: { title: true } }, material: { select: { title: true } } },
  });

  const sessions = student.sessions;
  const openSessions = sessions.filter((s) => s.expiresAt > now);
  const anonymized = student.email.endsWith("@anonimizado.invalid");

  return (
    <>
      <PageHeader
        title={student.name}
        back={{ href: "/alunos", label: "Alunos" }}
        description={`Aluno desde ${formatDateTime(student.createdAt)}`}
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Dados</CardTitle>
          <StudentForm
            item={{
              id: student.id,
              name: student.name,
              displayName: student.displayName,
              email: student.email,
              isBlocked: student.isBlocked,
            }}
          />
        </Card>

        <Card>
          <CardTitle
            actions={
              openSessions.length ? (
                <ActionButton
                  action={endAllSessions.bind(null, student.id)}
                  confirm="Encerrar todas as sessões deste aluno?"
                  variant="secondary"
                >
                  <LogOut className="size-4" aria-hidden /> Encerrar todas
                </ActionButton>
              ) : null
            }
          >
            Sessões ({openSessions.length} aberta(s))
          </CardTitle>
          {sessions.length === 0 ? (
            <EmptyState>Nenhuma sessão.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Dispositivo</Th>
                  <Th>Aberta em</Th>
                  <Th>Expira em</Th>
                  <Th>Situação</Th>
                  <Th className="text-right">Ação</Th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const open = s.expiresAt > now;
                  return (
                    <tr key={s.id}>
                      <Td>
                        <span className="line-clamp-1" title={s.userAgent ?? undefined}>
                          {s.userAgent || "Dispositivo"}
                        </span>
                        <p className="text-muted text-xs">IP {s.ipAddress || "—"}</p>
                      </Td>
                      <Td>{formatDateTime(s.createdAt)}</Td>
                      <Td>{formatDateTime(s.expiresAt)}</Td>
                      <Td>
                        {open ? (
                          <Badge tone="success">aberta</Badge>
                        ) : (
                          <Badge>expirada</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        {open ? (
                          <ActionButton
                            action={endSession.bind(null, s.id)}
                            confirm="Encerrar esta sessão?"
                            title="Encerrar sessão"
                          >
                            <LogOut className="size-4" aria-hidden />
                          </ActionButton>
                        ) : null}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardTitle>Assinaturas</CardTitle>
          {student.subscriptions.length === 0 ? (
            <EmptyState>Nenhuma assinatura.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {student.subscriptions.map((s) => (
                <li key={s.id} className="rounded-btn border-border bg-surface-2 border p-3">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge>{SUBSCRIPTION_STATUSES[s.status]}</Badge>
                    {s.gateway === "manual" ? <Badge tone="accent">cortesia</Badge> : null}
                    até {formatDateTime(s.currentPeriodEnd)}
                  </p>
                  <p className="text-muted mt-1 text-xs">
                    {s.courses.map((c) => `${c.slotNumber}. ${c.course.title}`).join(" · ") ||
                      "sem disciplinas"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Últimos acessos</CardTitle>
          {logs.length === 0 ? (
            <EmptyState>Nenhum acesso registrado.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {logs.map((log) => (
                <li key={log.id.toString()} className="text-muted">
                  {formatDateTime(log.createdAt)} ·{" "}
                  <span className="text-text">{EVENT_LABEL[log.event]}</span>
                  {log.lesson ? ` · ${log.lesson.title}` : ""}
                  {log.material ? ` · ${log.material.title}` : ""}
                  {log.ipAddress ? ` · IP ${log.ipAddress}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {anonymized ? null : (
          <Card className="border-danger/40">
            <CardTitle>Anonimizar (LGPD)</CardTitle>
            <p className="text-muted mb-3 text-sm">
              A pedido do aluno: apaga nome, e-mail, foto e IPs, remove as formas de entrar e encerra as sessões.
              Assinaturas e cobranças ficam como registro financeiro. Não dá para desfazer.
            </p>
            <ActionButton
              action={anonymizeStudent.bind(null, student.id)}
              confirm={`Anonimizar ${student.name}? Não dá para desfazer.`}
              variant="danger"
              size="md"
            >
              <UserX className="size-4" aria-hidden /> Anonimizar aluno
            </ActionButton>
          </Card>
        )}
      </div>
    </>
  );
}
