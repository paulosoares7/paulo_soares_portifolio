// Traduz erros do banco em mensagens para o painel.
import { Prisma } from "@portfolio/database";
import type { ActionState } from "@/types/action";

/**
 * Converte um erro do Prisma/MySQL em ActionState legível.
 * Erros desconhecidos são registrados no log do servidor e viram mensagem genérica.
 * @param error Erro capturado na server action.
 * @param fallback Mensagem quando o erro não é reconhecido.
 * @returns ActionState com ok = false.
 */
export function actionError(error: unknown, fallback = "Não foi possível salvar."): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { ok: false, message: "Já existe um registro com esse valor (campo único)." };
    }
    if (error.code === "P2003") {
      return {
        ok: false,
        message: "Este registro está em uso por outros cadastros e não pode ser removido.",
      };
    }
    if (error.code === "P2025") {
      return { ok: false, message: "Registro não encontrado (talvez já tenha sido removido)." };
    }
  }
  // CHECK do MySQL (erro 3819): uma regra do banco foi violada.
  const text = error instanceof Error ? error.message : String(error);
  const check = text.match(/Check constraint '([a-z_]+)' is violated/);
  if (check) {
    return { ok: false, message: `O banco recusou os dados (regra ${check[1]}).` };
  }
  console.error(error);
  return { ok: false, message: fallback };
}
