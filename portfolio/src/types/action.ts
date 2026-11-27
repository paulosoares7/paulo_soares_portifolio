/** Erros por campo, no formato de z.flattenError().fieldErrors. */
export type FieldErrors = Record<string, string[] | undefined>;

/** Resultado padrão de toda server action chamada por formulário ou botão. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
};
