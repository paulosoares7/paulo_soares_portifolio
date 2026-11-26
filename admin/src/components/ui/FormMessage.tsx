import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ActionState } from "@/types/action";

/** Mensagem geral de sucesso ou erro devolvida por uma server action. */
export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  const Icon = state.ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`flex items-center gap-2 text-sm ${state.ok ? "text-success" : "text-danger"}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {state.message}
    </p>
  );
}
