import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Ban, LogOut, Pause, Play, UserX } from "lucide-react";
import { prisma } from "@portfolio/database";
import { anonymizeStudent, endAllSessions, endSession, setCodeStatus } from "@/actions/students";
import { RegenerateCodeButton } from "@/components/forms/RegenerateCodeButton";
import { StudentForm } from "@/components/forms/StudentForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { ACCESS_CODE_STATUSES, SUBSCRIPTION_STATUSES } from "@/lib/labels";

export const metadata: Metadata = { title: "Aluno" };

const CODE_TONE = { active: "success", suspended: "warning", revoked: "neutral" } as const;
const EVENT_LABEL = {
  login: "entrou",
  login_denied: "entrada negada",
  play: "assistiu",
  material_view: "abriu material",
  logout: "saiu",
} as const;

/** Aluno: dados, códigos (suspender/revogar/gerar), sessões e anonimização (RF29). */
export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const now = new Date();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      accessCodes: {
        orderBy: { createdAt: "desc" },
        include: { sessions: { orderBy: { createdAt: "desc" }, take: 20 } },
      },
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
    where: { accessCode: { studentId: id } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { lesson: { select: { title: true } }, material: { select: { title: true } } },
  });

  const sessions = student.accessCodes.flatMap((c) =>
    c.sessions.map((s) => ({ ...s, hint: c.codeHint })),
  );
  const openSessions = sessions.filter((s) => !s.revokedAt && s.expiresAt > now);
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
          <CardTitle>Códigos de acesso</CardTitle>
          <p className="text-muted mb-4 text-sm">
            O banco guarda só o hash; aparecem os 4 últimos caracteres. Um código ativo por aluno
            (RN01).
          </p>
          {student.accessCodes.length === 0 ? (
            <EmptyState>Nenhum código.</EmptyState>
          ) : (
            <ul className="mb-4 flex flex-col gap-2">
              {student.accessCodes.map((code) => (
                <li
                  key={code.id}
                  className="rounded-btn border-border bg-surface-2 flex flex-wrap items-center justify-between gap-2 border p-3"
                >
                  <div>
                    <p className="flex items-center gap-2">
                      <span className="font-mono">••••-••••-••••-{code.codeHint}</span>
                      <Badge tone={CODE_TONE[code.status]}>
                        {ACCESS_CODE_STATUSES[code.status]}
                      </Badge>
                    </p>
                    <p className="text-muted text-xs">
                      Criado {formatDateTime(code.createdAt)} · último uso{" "}
                      {formatDateTime(code.lastUsedAt)} · até {code.maxDevices} dispositivos
                    </p>
                  </div>
                  {code.status !== "revoked" ? (
                    <div className="flex gap-1">
                      {code.status === "active" ? (
                        <ActionButton
                          action={setCodeStatus.bind(null, code.id, "suspended")}
                          confirm="Suspender o código? As sessões abertas são encerradas."
                          title="Suspender"
                        >
                          <Pause className="size-4" aria-hidden /> Suspender
                        </ActionButton>
                      ) : (
                        <ActionButton
                          action={setCodeStatus.bind(null, code.id, "active")}
                          title="Reativar"
                        >
                          <Play className="size-4" aria-hidden /> Reativar
                        </ActionButton>
                      )}
                      <ActionButton
                        action={setCodeStatus.bind(null, code.id, "revoked")}
                        confirm="Revogar o código? Não dá para desfazer."
                        title="Revogar"
                        variant="danger"
                      >
                        <Ban className="size-4" aria-hidden /> Revogar
                      </ActionButton>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {anonymized ? null : <RegenerateCodeButton studentId={student.id} />}
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
                  <Th>Última atividade</Th>
                  <Th>Situação</Th>
                  <Th className="text-right">Ação</Th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const open = !s.revokedAt && s.expiresAt > now;
                  return (
                    <tr key={s.id}>
                      <Td>
                        {s.deviceLabel ?? "Dispositivo"}
                        <p className="text-muted text-xs">
                          {s.ipAddress ?? "—"} · código ••••-{s.hint}
                        </p>
                      </Td>
                      <Td>{formatDateTime(s.createdAt)}</Td>
                      <Td>{formatDateTime(s.lastSeenAt)}</Td>
                      <Td>
                        {open ? (
                          <Badge tone="success">aberta</Badge>
                        ) : (
                          <Badge>{s.revokedAt ? "encerrada" : "expirada"}</Badge>
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
              A pedido do aluno: apaga nome, e-mail e IPs, revoga códigos e encerra sessões.
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
