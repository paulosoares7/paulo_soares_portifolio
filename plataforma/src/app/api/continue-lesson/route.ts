import { NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { getContinueLesson } from "@/lib/student-area";

/**
 * "Continuar de onde parou" do aluno logado, para a saudação da página
 * inicial (que continua estática e lê a sessão no navegador).
 * @returns { lesson } ou 401 sem login.
 */
export async function GET(): Promise<NextResponse> {
  const viewer = await getViewer();
  if (!viewer)
    return NextResponse.json(
      { lesson: null },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  return NextResponse.json(
    { lesson: await getContinueLesson(viewer.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
