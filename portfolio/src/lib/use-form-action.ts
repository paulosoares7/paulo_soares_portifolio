"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { z } from "zod";
import { formDataToObject, initialActionState, zodFieldErrors } from "@/lib/form";
import type { ActionState, FieldErrors } from "@/types/action";

type FormAction<T extends ActionState> = (state: Awaited<T>, formData: FormData) => Promise<T>;

/**
 * Liga um formulário a uma server action validando ANTES com o mesmo schema Zod
 * do servidor. Não usa a prop `action` do <form> de propósito: assim o React
 * não limpa os campos quando o servidor devolve erro.
 * @param schema Schema Zod compartilhado (validators/).
 * @param action Server action com assinatura (estado, formData).
 * @param options resetOnSuccess limpa o formulário; onSuccess roda após sucesso.
 * @returns Props do form, estado, erros por campo e se está enviando.
 */
export function useFormAction<S extends z.ZodType, T extends ActionState = ActionState>(
  schema: S,
  action: FormAction<T>,
  options: { resetOnSuccess?: boolean; onSuccess?: () => void } = {},
) {
  // T estende ActionState; o estado inicial só tem ok = false.
  const [state, dispatch, pending] = useActionState<T, FormData>(
    action,
    initialActionState as Awaited<T>,
  );
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { resetOnSuccess, onSuccess } = options;

  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) formRef.current?.reset();
    onSuccess?.();
    // Só reage a um novo resultado do servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = schema.safeParse(formDataToObject(formData));
    if (!result.success) {
      setClientErrors(zodFieldErrors(result.error));
      return;
    }
    setClientErrors(null);
    startTransition(() => dispatch(formData));
  }

  return {
    formProps: { ref: formRef, onSubmit, noValidate: true },
    state,
    pending,
    errors: clientErrors ?? state.fieldErrors ?? {},
  };
}
