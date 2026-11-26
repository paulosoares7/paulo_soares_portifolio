"use client";

import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { sendContactMessage } from "@/actions/contact";
import { Button } from "@/components/ui/Button";
import { useFormAction } from "@/lib/use-form-action";
import { contactSchema } from "@/validators/contact";

const field =
  "w-full rounded-btn border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

/** Campo com rótulo e erro. */
function Row({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error?.length ? (
        <p id={`${id}-error`} className="text-danger text-xs">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

/** Formulário de contato, validado com o mesmo schema no navegador e no servidor. */
export function ContactForm() {
  const { formProps, state, pending, errors } = useFormAction(contactSchema, sendContactMessage, {
    resetOnSuccess: true,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Row id="name" label="Nome" error={errors.name}>
          <input
            id="name"
            name="name"
            autoComplete="name"
            className={`${field} h-11`}
            aria-invalid={!!errors.name || undefined}
          />
        </Row>
        <Row id="email" label="E-mail" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`${field} h-11`}
            aria-invalid={!!errors.email || undefined}
          />
        </Row>
      </div>
      <Row id="subject" label="Assunto (opcional)" error={errors.subject}>
        <input id="subject" name="subject" className={`${field} h-11`} />
      </Row>
      <Row id="message" label="Mensagem" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={6}
          className={`${field} py-2`}
          aria-invalid={!!errors.message || undefined}
        />
      </Row>
      {/* Armadilha para robôs: invisível para pessoas e leitores de tela. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Site</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={`flex items-center gap-2 text-sm ${state.ok ? "text-success" : "text-danger"}`}
        >
          {state.ok ? (
            <CheckCircle2 className="size-4" aria-hidden />
          ) : (
            <AlertCircle className="size-4" aria-hidden />
          )}
          {state.message}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          <Send className="size-4" aria-hidden /> {pending ? "Enviando..." : "Enviar mensagem"}
        </Button>
      </div>
    </form>
  );
}
