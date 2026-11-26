// Prepara o aluno de teste da plataforma: e-mail fixo, senha nova e aleatória
// a cada execução (bcrypt, como o Better Auth grava), cortesia com Física I e
// sem histórico de estudo. Imprime e-mail e senha em JSON para os testes.
// Rodado pelo e2e/global-setup.ts com database/ como diretório atual.
import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../database/src/index";

const EMAIL = "e2e.aluno@example.com";
const COURSE_SLUG = "fisica-1";
const DAY = 24 * 60 * 60 * 1000;

/** Recria o aluno de teste do zero (só o dele; nada mais é apagado). */
async function main(): Promise<void> {
  const password = randomBytes(12).toString("base64url");
  const plan = await prisma.plan.findFirst({ orderBy: { id: "asc" } });
  const course = await prisma.course.findUnique({ where: { slug: COURSE_SLUG } });
  if (!plan || !course) throw new Error("Rode o seed: falta plano ou a disciplina fisica-1.");

  const student = await prisma.student.upsert({
    where: { email: EMAIL },
    create: { name: "Aluno Teste E2E", displayName: "Aluno", email: EMAIL, emailVerified: true },
    update: { name: "Aluno Teste E2E", emailVerified: true, isBlocked: false },
  });
  const studentId = student.id;
  const now = new Date();

  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { studentId } }),
    prisma.activityAttempt.deleteMany({ where: { studentId } }),
    prisma.accessLog.deleteMany({ where: { studentId } }),
    prisma.studentSession.deleteMany({ where: { studentId } }),
    prisma.studentAccount.deleteMany({ where: { studentId } }),
    prisma.subscription.deleteMany({ where: { studentId, gateway: "manual" } }),
    prisma.studentAccount.create({
      data: {
        studentId,
        providerId: "credential",
        accountId: String(studentId),
        password: await bcrypt.hash(password, 10),
      },
    }),
    prisma.subscription.create({
      data: {
        studentId,
        planId: plan.id,
        status: "active",
        gateway: "manual",
        priceCents: 0,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 7 * DAY),
        courses: { create: [{ slotNumber: 1, courseId: course.id }] },
      },
    }),
  ]);
  console.log(JSON.stringify({ email: EMAIL, password }));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
