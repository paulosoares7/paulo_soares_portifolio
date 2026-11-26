import { z } from "zod";
import { UPLOAD_KINDS, UPLOAD_RULES } from "@/lib/upload-kinds";

/** Pedido de URL de envio (antes de o navegador mandar o arquivo). */
export const uploadRequestSchema = z
  .object({
    kind: z.enum(UPLOAD_KINDS),
    fileName: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(1).max(100),
    size: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    const rule = UPLOAD_RULES[value.kind];
    if (!rule.accept.includes(value.contentType)) {
      ctx.addIssue({
        code: "custom",
        path: ["contentType"],
        message: `Tipo não aceito. ${rule.label}.`,
      });
    }
    if (value.size > rule.maxBytes) {
      ctx.addIssue({
        code: "custom",
        path: ["size"],
        message: `Arquivo grande demais. ${rule.label}.`,
      });
    }
  });

/** Registro do arquivo depois do envio ao bucket. */
export const uploadRegisterSchema = z.object({
  kind: z.enum(UPLOAD_KINDS),
  storageKey: z.string().trim().min(1).max(255),
  originalName: z.string().trim().min(1).max(255),
});
