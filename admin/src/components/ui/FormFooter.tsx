import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import type { ActionState } from "@/types/action";

/** Rodapé de formulário: mensagem do servidor + botão salvar. */
export function FormFooter({
  state,
  pending,
  label = "Salvar",
}: {
  state: ActionState;
  pending: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
      <div className="mr-auto">
        <FormMessage state={state} />
      </div>
      <Button type="submit" disabled={pending}>
        <Save className="size-4" aria-hidden />
        {pending ? "Salvando..." : label}
      </Button>
    </div>
  );
}
