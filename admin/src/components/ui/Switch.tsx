"use client";

/**
 * Botão de ligar e desligar. Desligado fica neutro; ligado fica na cor de
 * sucesso do tema. Leitores de tela anunciam "ligado/desligado" (role switch).
 * @param checked Estado atual.
 * @param onChange Chamado com o novo estado.
 * @param label Texto ao lado (também é o nome acessível).
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group text-text inline-flex items-center gap-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
          checked ? "border-success bg-success" : "border-border bg-surface-2"
        }`}
      >
        <span
          className={`bg-text size-4 rounded-full shadow transition-transform duration-200 motion-reduce:transition-none ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      <span className={checked ? "text-success" : undefined}>{label}</span>
    </button>
  );
}
