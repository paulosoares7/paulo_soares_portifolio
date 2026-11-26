// ÚNICO lugar que decide o acesso ao conteúdo (site/CLAUDE.md).
// Regras: aula/atividade/material grátis abre para todos (RN08, RN10);
// o resto exige a disciplina em v_student_course_access (RN04).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@portfolio/database";
import { auth } from "@/lib/auth";
import { loginUrl } from "@/lib/safe-next";

/** Resultado da checagem de acesso. */
export type Access = "free" | "subscriber" | "locked";

/** Aluno logado, como as páginas precisam dele. */
export type Viewer = { id: number; name: string; email: string; image: string | null };

/**
 * Aluno logado na requisição atual (sessão do Better Auth no banco).
 * @returns Aluno ou null para visitantes.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, image } = session.user;
  return { id: Number(id), name, email, image: image ?? null };
});

/**
 * ID do aluno logado na requisição atual.
 * @returns ID do aluno ou null.
 */
export const getViewerStudentId = cache(
  async (): Promise<number | null> => (await getViewer())?.id ?? null,
);

/**
 * Disciplinas que o aluno pode abrir agora (visão do banco, RN04).
 * @param studentId Aluno.
 * @returns IDs das disciplinas com acesso.
 */
const getAccessibleCourseIds = cache(async (studentId: number): Promise<Set<number>> => {
  const rows = await prisma.$queryRaw<{ course_id: number }[]>`
    SELECT course_id FROM v_student_course_access WHERE student_id = ${studentId}`;
  return new Set(rows.map((row) => Number(row.course_id)));
});

/**
 * Decide o acesso a um item de uma disciplina.
 * @param item isPreview do item e a disciplina dele.
 * @param studentId Aluno logado (ou null).
 * @returns free (grátis), subscriber (assinante da disciplina) ou locked.
 */
export async function checkAccess(
  item: { isPreview: boolean; courseId: number },
  studentId: number | null,
): Promise<Access> {
  if (item.isPreview) return "free";
  if (studentId === null) return "locked";
  return (await getAccessibleCourseIds(studentId)).has(item.courseId) ? "subscriber" : "locked";
}

/**
 * Acesso do visitante atual a um item (atalho de checkAccess).
 * @param item isPreview do item e a disciplina dele.
 * @returns free, subscriber ou locked.
 */
export async function viewerAccess(item: {
  isPreview: boolean;
  courseId: number;
}): Promise<Access> {
  return checkAccess(item, await getViewerStudentId());
}

/**
 * Diz se o visitante pode participar do fórum da disciplina (RN13: só assinantes).
 * @param courseId Disciplina.
 * @returns true para assinantes da disciplina.
 */
export async function canUseForum(courseId: number): Promise<boolean> {
  return (await viewerAccess({ isPreview: false, courseId })) === "subscriber";
}

/**
 * Conteúdo pago aberto por visitante sem login: manda para /entrar e volta
 * para a mesma página depois. Aluno logado sem assinatura vê o cadeado.
 * @param access Resultado de checkAccess/viewerAccess.
 * @param path Caminho da página atual.
 */
export async function requireLoginForLocked(access: Access, path: string): Promise<void> {
  if (access === "locked" && (await getViewerStudentId()) === null) redirect(loginUrl(path));
}
