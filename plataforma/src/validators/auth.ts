// Validação dos formulários de login (no navegador, antes de chamar o Better
// Auth; o servidor do Better Auth valida de novo).
import { z } from "zod";

const email = z.email("Digite um e-mail válido.").max(190, "E-mail longo demais.");
const password = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Digite a senha."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Digite o seu nome.").max(150, "Nome longo demais."),
  email,
  password,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não são iguais.",
  });

/** Erros por campo (primeira mensagem de cada um). */
export type FieldErrors = Partial<Record<string, string>>;

/**
 * Valida um formulário e devolve os dados ou os erros por campo.
 * @param schema Schema Zod.
 * @param form Formulário enviado.
 * @returns { data } ou { errors }.
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  form: HTMLFormElement,
): { data: z.infer<T>; errors?: undefined } | { data?: undefined; errors: FieldErrors } {
  const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
  if (parsed.success) return { data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { errors };
}
