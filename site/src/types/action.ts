/** Erros por campo, no formato de z.flattenError().fieldErrors. */
export type FieldErrors = Record<string, string[] | undefined>;

/** Resultado padrão de toda server action chamada por formulário ou botão. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
};

/** Resultado de ações que geram um código de acesso (mostrado uma única vez). */
export type CodeActionState = ActionState & {
  code?: string;
  emailed?: boolean;
};
