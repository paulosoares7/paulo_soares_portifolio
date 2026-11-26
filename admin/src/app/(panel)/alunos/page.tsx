import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@portfolio/database";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Alunos" };

/** Alunos com código ativo, sessões abertas e situação da assinatura (RF29). */
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const now = new Date();
  const students = await prisma.student.findMany({
    where: term ? { OR: [{ name: { contains: term } }, { email: { contains: term } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      accessCodes: {
        where: { status: { not: "revoked" } },
        select: { codeHint: true, status: true, lastUsedAt: true },
      },
      subscriptions: {
        where: {
          status: { in: ["active", "past_due", "canceled"] },
          currentPeriodEnd: { gt: now },
        },
        select: { gateway: true, currentPeriodEnd: true },
      },
    },
  });
  const openSessions = await prisma.studentSession.groupBy({
    by: ["accessCodeId"],
    where: { revokedAt: null, expiresAt: { gt: now } },
    _count: { _all: true },
  });
  const sessionsByCode = new Map(openSessions.map((s) => [s.accessCodeId, s._count._all]));
  const codeIds = await prisma.accessCode.findMany({
    where: { id: { in: [...sessionsByCode.keys()] } },
    select: { id: true, studentId: true },
  });
  const sessionsByStudent = new Map<number, number>();
  for (const c of codeIds)
    sessionsByStudent.set(
      c.studentId,
      (sessionsByStudent.get(c.studentId) ?? 0) + (sessionsByCode.get(c.id) ?? 0),
    );

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Códigos de acesso, sessões abertas e assinaturas de cada aluno."
      />
      <form className="mb-4 flex gap-3" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar aluno"
          className="max-w-sm"
        />
        <button type="submit" className={buttonClasses("secondary")}>
          Buscar
        </button>
      </form>
      {students.length === 0 ? (
        <EmptyState>Nenhum aluno encontrado.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Aluno</Th>
              <Th>Acesso</Th>
              <Th>Código</Th>
              <Th>Sessões abertas</Th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const code = s.accessCodes[0];
              const subscription = s.subscriptions[0];
              return (
                <tr key={s.id}>
                  <Td>
                    <Link href={`/alunos/${s.id}`} className="hover:text-accent font-medium">
                      {s.name}
                    </Link>
                    <p className="text-muted text-xs">{s.email}</p>
                    {s.isBlocked ? <Badge tone="danger">bloqueado</Badge> : null}
                  </Td>
                  <Td>
                    {subscription ? (
                      <>
                        <Badge tone="success">
                          {subscription.gateway === "manual" ? "cortesia" : "assinante"}
                        </Badge>
                        <p className="text-muted text-xs">
                          até {formatDateTime(subscription.currentPeriodEnd)}
                        </p>
                      </>
                    ) : (
                      <Badge>sem acesso</Badge>
                    )}
                  </Td>
                  <Td>
                    {code ? (
                      <>
                        <span className="font-mono">••••-{code.codeHint}</span>{" "}
                        {code.status === "suspended" ? (
                          <Badge tone="warning">suspenso</Badge>
                        ) : null}
                        <p className="text-muted text-xs">
                          último uso {formatDateTime(code.lastUsedAt)}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted text-xs">nenhum</span>
                    )}
                  </Td>
                  <Td>{sessionsByStudent.get(s.id) ?? 0}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
