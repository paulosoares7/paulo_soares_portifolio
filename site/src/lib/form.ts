// Utilitários de formulário usados no cliente e no servidor (sem acesso ao banco).
import { z } from "zod";
import type { ActionState, FieldErrors } from "@/types/action";

/** Estado inicial de useActionState. */
export const initialActionState: ActionState = { ok: false };

type FormValue = FormDataEntryValue | FormDataEntryValue[];

/**
 * Converte FormData em objeto simples para o Zod validar.
 * Campos com nome terminado em "[]" viram listas (ex.: courseIds[]).
 * @param formData Dados do formulário.
 * @returns Objeto { campo: valor }.
 */
export function formDataToObject(formData: FormData): Record<string, FormValue> {
  const result: Record<string, FormValue> = {};
  for (const [key, value] of formData.entries()) {
    // Campos internos das server actions do React.
    if (key.startsWith("$ACTION")) continue;
    if (key.endsWith("[]")) {
      const listKey = key.slice(0, -2);
      const current = result[listKey];
      result[listKey] = Array.isArray(current) ? [...current, value] : [value];
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Extrai os erros por campo de um ZodError.
 * @param error Erro do Zod.
 * @returns Mapa campo → mensagens.
 */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

/**
 * Valida um FormData com o schema (mesmo schema usado no cliente).
 * @param schema Schema Zod da entidade.
 * @param formData Dados recebidos pela server action.
 * @returns Dados tipados ou um ActionState com os erros.
 */
export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): { success: true; data: z.output<S> } | { success: false; state: ActionState } {
  const result = schema.safeParse(formDataToObject(formData));
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    state: {
      ok: false,
      message: "Confira os campos destacados.",
      fieldErrors: zodFieldErrors(result.error),
    },
  };
}
