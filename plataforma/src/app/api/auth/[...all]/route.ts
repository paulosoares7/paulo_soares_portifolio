// Rotas do Better Auth (/api/auth/*): login, cadastro, Google, confirmação de
// e-mail, redefinição de senha e sair.
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
