import { redirect } from "next/navigation";

/**
 * Endereço antigo do painel: o painel do aluno agora é a página inicial.
 * Mantido para links e favoritos antigos (o #disciplinas/#assinatura do
 * navegador continua valendo depois do redirecionamento).
 */
export default function StudentAreaPage(): never {
  redirect("/");
}
