import { z } from "zod";
import { email } from "@/validators/common";

/** Formulário de login do painel. */
export const loginSchema = z.object({
  email,
  password: z.string({ error: "Informe a senha." }).min(1, "Informe a senha.").max(200),
});
