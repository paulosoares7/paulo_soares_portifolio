import { z } from "zod";

const text = (min: number, max: number, message: string) =>
  z.string({ error: message }).trim().min(min, message).max(max, `Máximo de ${max} caracteres.`);

/** Formulário de contato (RF04). "website" é armadilha para robôs: deve vir vazio. */
export const contactSchema = z.object({
  name: text(2, 150, "Informe seu nome."),
  email: z
    .string({ error: "Informe seu e-mail." })
    .trim()
    .toLowerCase()
    .min(1, "Informe seu e-mail.")
    .pipe(z.email("E-mail inválido.").max(190)),
  subject: z
    .string()
    .trim()
    .max(200, "Máximo de 200 caracteres.")
    .optional()
    .transform((value) => value || null),
  message: text(10, 5000, "Escreva sua mensagem (pelo menos 10 caracteres)."),
  website: z.string().max(0).optional(),
});
