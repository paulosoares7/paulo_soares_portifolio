import { z } from "zod";
import { email } from "@/validators/common";

/** Formulário de login do painel. */
export const loginSchema = z.object({
  email,
  password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha.").max(200),
});

/** "Esqueci a senha" do painel. */
export const forgotPasswordSchema = z.object({ email });

/** Nova senha do painel (mesma regra do script create-admin). */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(100),
    password: z
      .string({ error: "Informe a nova senha." })
      .min(12, "A senha precisa ter pelo menos 12 caracteres.")
      .max(72, "Use no máximo 72 caracteres."),
    confirm: z.string({ error: "Repita a senha." }),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não são iguais.",
  });
