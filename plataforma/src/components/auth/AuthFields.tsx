import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const field =
  "h-11 w-full rounded-btn border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

/** Campo de texto com rótulo, dica e erro ligados por aria. */
export function TextField({
  id,
  label,
  error,
  hint,
  ...props
}: ComponentProps<"input"> & { id: string; label: string; error?: string; hint?: string }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className={field}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Aviso de erro ou de sucesso do formulário. */
export function FormAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-btn flex gap-2 border p-3 text-sm ${
        tone === "error"
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-success/40 bg-success/10 text-success"
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Moldura das páginas de login: título, texto e o conteúdo num cartão. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      {description ? <p className="text-muted mt-2">{description}</p> : null}
      <div className="rounded-card border-border bg-surface mt-8 flex flex-col gap-5 border p-6 sm:p-8">
        {children}
      </div>
      {footer ? <div className="text-muted mt-6 text-center text-sm">{footer}</div> : null}
    </div>
  );
}
