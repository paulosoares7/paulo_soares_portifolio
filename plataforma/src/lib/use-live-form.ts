"use client";

import { useState, type FocusEvent, type FormEvent } from "react";
import type { z } from "zod";
import { type FieldErrors, validateForm } from "@/validators/auth";

/**
 * Validação ao vivo dos formulários de login: o botão só libera quando tudo
 * está válido e o erro aparece embaixo do campo depois que a pessoa sai dele
 * (não enquanto ainda está digitando pela primeira vez).
 * @param schema Schema Zod do formulário (o mesmo do envio).
 * @returns Erros visíveis, se dá para enviar e os eventos do <form>.
 */
export function useLiveForm<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  /** Revalida e mostra os erros só dos campos já tocados. */
  function check(form: HTMLFormElement, visible: Set<string>): void {
    const { errors: invalid } = validateForm(schema, form);
    setReady(!invalid);
    const shown: FieldErrors = {};
    for (const [field, message] of Object.entries(invalid ?? {})) {
      if (visible.has(field)) shown[field] = message;
    }
    setErrors(shown);
  }

  return {
    errors,
    /** Mostra todos os erros (usado no envio). */
    setErrors,
    ready,
    formProps: {
      noValidate: true,
      onChange: (event: FormEvent<HTMLFormElement>) => check(event.currentTarget, touched),
      onBlur: (event: FocusEvent<HTMLFormElement>) => {
        const target = event.target;
        // Passar por um campo vazio (Tab) não acusa erro; só depois de digitar.
        if (
          !(target instanceof HTMLInputElement) ||
          !target.name ||
          (!target.value && !touched.has(target.name))
        )
          return;
        const next = new Set(touched).add(target.name);
        setTouched(next);
        check(event.currentTarget, next);
      },
    },
  };
}
