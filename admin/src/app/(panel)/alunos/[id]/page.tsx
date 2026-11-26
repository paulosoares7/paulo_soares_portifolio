import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import { prisma } from "@portfolio/database";
import { endAllSessions, endSession, sendPasswordResetLink } from "@/actions/students";
import { CourtesyToggle } from "@/components/forms/CourtesyToggle";
import { DeleteStudentForm } from "@/components/forms/DeleteStudentForm";
import { StudentForm } from "@/components/forms/StudentForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { loadCourseOptions } from "@/lib/course-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { getStudentFootprint, mustAnonymize } from "@/lib/student-removal";
import { ACCESS_STATUSES } from "@/lib/subscription-rules";
import { signInMethodsLabel, SUBSCRIPTION_STATUSES } from "@/lib/labels";

export const metadata: Metadata = { title: "Aluno" };

const EVENT_LABEL = {
  login: "entrou",
  login_denied: "entrada negada",
  play: "assistiu",
  material_view: "abriu material",
  logout: "saiu",
} as const;

/**
 * Aluno (RF29): dados, como entra, link de senha, cortesia (ligar e
 * desligar), sessões, assinaturas, acessos e exclusão (ou anonimização).
 */
export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const now = new Date();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      sessions: { orderBy: { createdAt: "desc" } },
      accounts: { select: { providerId: true, createdAt: true } },
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
  const [logs, footprint, plans, courses] = await Promise.all([
    prisma.accessLog.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { lesson: { select: { title: true } }, material: { select: { title: true } } },
    }),
    getStudentFootprint(id),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, maxCourses: true },
    }),
    loadCourseOptions(),
  ]);
  const vigente = student.subscriptions.find(
    (s) =>
      (ACCESS_STATUSES as readonly string[]).includes(s.status) &&
      s.currentPeriodEnd !== null &&
      s.currentPeriodEnd > now,
  );
  const courtesy = vigente?.gateway === "manual" ? vigente : null;
  const anonymize = mustAnonymize(footprint);

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

        {anonymized ? null : (
          <Card>
            <CardTitle
              actions={
                <ActionButton
                  action={sendPasswordResetLink.bind(null, student.id)}
                  confirm={`Enviar para ${student.email} um link para criar ou trocar a senha?`}
                  variant="secondary"
                >
                  <KeyRound className="size-4" aria-hidden /> Enviar link de senha
                </ActionButton>
              }
            >
              Acesso à plataforma
            </CardTitle>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Entra com</dt>
                <dd>{signInMethodsLabel(student.accounts.map((a) => a.providerId))}</dd>
              </div>
              <div>
                <dt className="text-muted">E-mail</dt>
                <dd>
                  {student.emailVerified ? (
                    <Badge tone="success">verificado</Badge>
                  ) : (
                    <Badge tone="warning">não verificado</Badge>
                  )}
                </dd>
              </div>
            </dl>
            <p className="text-muted mt-3 text-xs">
              O link vale por 1 hora e só uma vez. Serve também para o aluno de cortesia criar a
              primeira senha. Ao salvar, o aluno sai de todos os aparelhos.
            </p>
          </Card>
        )}

        {anonymized ? null : (
          <Card>
            <CardTitle>Cortesia</CardTitle>
            <CourtesyToggle
              studentId={student.id}
              plans={plans}
              courses={courses}
              active={
                courtesy
                  ? { subscriptionId: courtesy.id, endLabel: formatDate(courtesy.currentPeriodEnd) }
                  : null
              }
              blockedReason={
                vigente && !courtesy ? "O aluno já tem assinatura paga vigente." : undefined
              }
            />
            <p className="text-muted mt-3 text-xs">
              Para mudar disciplinas, vagas ou a data de uma cortesia ligada, use o lápis em
              Assinaturas.
            </p>
          </Card>
        )}

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
                        {open ? <Badge tone="success">aberta</Badge> : <Badge>expirada</Badge>}
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
            <CardTitle>
              {anonymize ? "Excluir aluno (será anonimizado)" : "Excluir aluno"}
            </CardTitle>
            {anonymize ? (
              <div className="text-muted mb-4 flex flex-col gap-2 text-sm">
                <p>
                  Este aluno tem histórico na plataforma, por isso não é apagado: ele é{" "}
                  <strong className="text-text">anonimizado</strong> (LGPD). Não dá para desfazer.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    Nome, e-mail, foto e IPs são apagados; as formas de entrar e as sessões saem.
                  </li>
                  <li>As assinaturas com acesso são encerradas agora.</li>
                  {footprint.activeAsaasIds.length ? (
                    <li>
                      {footprint.activeAsaasIds.length} assinatura(s) do Asaas serão canceladas lá
                      (param de cobrar).
                    </li>
                  ) : null}
                  <li>
                    Ficam como registro: {footprint.payments} cobrança(s), {footprint.forumPosts}{" "}
                    post(s) no fórum (com autor &quot;Anônimo&quot;), {footprint.lessonProgress}{" "}
                    aula(s) com progresso, {footprint.activityAttempts} tentativa(s) de atividade e{" "}
                    {footprint.accessLogs} acesso(s) registrados.
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-muted mb-4 text-sm">
                Este aluno não tem cobranças, posts nem histórico: ele será{" "}
                <strong className="text-text">apagado de vez</strong>, junto com
                {footprint.courtesies ? ` ${footprint.courtesies} cortesia(s),` : ""} as formas de
                entrar e as sessões. Não dá para desfazer.
              </p>
            )}
            <DeleteStudentForm studentId={student.id} email={student.email} anonymize={anonymize} />
          </Card>
        )}
      </div>
    </>
  );
}
