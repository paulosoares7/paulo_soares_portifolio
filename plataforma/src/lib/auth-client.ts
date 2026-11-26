// Cliente do Better Auth para os formulários (componentes "use client").
import { createAuthClient } from "better-auth/react";

/** Chamadas de login, cadastro, Google, redefinição e sair (mesmo domínio). */
export const authClient = createAuthClient();
