import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { prisma } from "@portfolio/database";
import { NewStudentForm } from "@/components/forms/NewStudentForm";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { loadCourseOptions } from "@/lib/course-options";
import { signInMethodsLabel } from "@/lib/labels";
import { INVITE_DAYS } from "@/lib/student-auth";

export const metadata: Metadata = { title: "Alunos" };

/**
 * Alunos (RF29): como entram, e-mail verificado, assinatura, disciplinas nas
 * vagas e sessões abertas.
 */
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
      subscriptions: {
        where: {
          status: { in: ["active", "past_due", "canceled"] },
          currentPeriodEnd: { gt: now },
        },
        orderBy: { currentPeriodEnd: "desc" },
        select: {
          gateway: true,
          currentPeriodEnd: true,
          courses: {
            orderBy: { slotNumber: "asc" },
            select: { slotNumber: true, course: { select: { title: true } } },
          },
        },
      },
      accounts: { select: { providerId: true } },
    },
  });
  const [openSessions, plans, courses] = await Promise.all([
    prisma.studentSession.groupBy({
      by: ["studentId"],
      where: { expiresAt: { gt: now } },
      _count: { _all: true },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, maxCourses: true },
    }),
    loadCourseOptions(),
  ]);
  const sessionsByStudent = new Map(openSessions.map((s) => [s.studentId, s._count._all]));

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Como cada aluno entra, e-mail verificado, assinatura, disciplinas e sessões abertas."
        actions={
          <ModalTrigger
            label={
              <>
                <UserPlus className="size-4" aria-hidden /> Adicionar aluno
              </>
            }
            title="Adicionar aluno"
            variant="primary"
            size="md"
            wide
          >
            <NewStudentForm plans={plans} courses={courses} inviteDays={INVITE_DAYS} />
          </ModalTrigger>
        }
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
              <Th>Entra com</Th>
              <Th>E-mail</Th>
              <Th>Assinatura</Th>
              <Th>Disciplinas</Th>
              <Th>Sessões abertas</Th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
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
                  <Td>{signInMethodsLabel(s.accounts.map((a) => a.providerId))}</Td>
                  <Td>
                    {s.emailVerified ? (
                      <Badge tone="success">verificado</Badge>
                    ) : (
                      <Badge tone="warning">não verificado</Badge>
                    )}
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
                      <Badge>não assinante</Badge>
                    )}
                  </Td>
                  <Td className="text-xs">
                    {subscription?.courses.length
                      ? subscription.courses.map((c) => (
                          <p key={c.slotNumber}>
                            {c.slotNumber}. {c.course.title}
                          </p>
                        ))
                      : "—"}
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
