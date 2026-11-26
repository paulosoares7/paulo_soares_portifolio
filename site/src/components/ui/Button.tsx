import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-btn px-5 h-11 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  // Botões do modelo Jacob: cheio em ciano e contornado em ciano.
  primary: "bg-accent text-bg hover:bg-accent-strong hover:text-text",
  outline: "border border-accent text-accent hover:bg-accent/10",
  ghost: "text-muted hover:text-text hover:bg-surface",
};

/**
 * Classes do botão para links e botões.
 * @param variant Estilo visual.
 * @returns Classes Tailwind.
 */
export function buttonClasses(variant: Variant = "primary"): string {
  return `${base} ${variants[variant]}`;
}

/** Botão padrão. */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} className={`${buttonClasses(variant)} ${className}`} {...props} />;
}

/** Link com aparência de botão. */
export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonClasses(variant)} ${className}`} {...props} />;
}
