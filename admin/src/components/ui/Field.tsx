import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-btn border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Rótulo + controle + dica + mensagem de erro. */
export function Field({ label, htmlFor, error, hint, children, className = "" }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-text text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error?.length ? <p className="text-muted text-xs">{hint}</p> : null}
      {error?.length ? (
        <p id={`${htmlFor}-error`} className="text-danger text-xs">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

type WithError = { invalid?: boolean };

/** Campo de texto. */
export function Input({ invalid, className = "", ...props }: ComponentProps<"input"> & WithError) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${control} h-10 ${className}`}
      {...props}
    />
  );
}

/** Área de texto. */
export function Textarea({
  invalid,
  className = "",
  ...props
}: ComponentProps<"textarea"> & WithError) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`${control} min-h-24 py-2 ${className}`}
      {...props}
    />
  );
}

/** Lista de opções. */
export function Select({
  invalid,
  className = "",
  ...props
}: ComponentProps<"select"> & WithError) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${control} h-10 ${className}`}
      {...props}
    />
  );
}

/** Caixa de seleção com rótulo ao lado. */
export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className="text-text inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="accent-accent size-4" {...props} />
      {label}
    </label>
  );
}
