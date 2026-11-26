import { Lock } from "lucide-react";
import { ButtonLink } from "@portfolio/ui/Button";
import { formatMoney } from "@/lib/format";

/** Chamada para assinar, mostrada perto de conteúdo bloqueado. */
export function SubscribeCta({
  plan,
  compact = false,
}: {
  plan: { priceCents: number; maxCourses: number } | null;
  compact?: boolean;
}) {
  return (
    <aside
      className={`rounded-card border-accent/40 bg-accent/5 flex flex-col gap-3 border ${compact ? "p-4" : "p-6"} sm:flex-row sm:items-center sm:justify-between`}
    >
      <div className="flex items-start gap-3">
        <Lock className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Aulas com cadeado são para assinantes</p>
          <p className="text-muted text-sm">
            {plan
              ? `Assinatura mensal de ${formatMoney(plan.priceCents)} com até ${plan.maxCourses} disciplinas à sua escolha.`
              : "Assine para liberar todas as aulas, atividades e materiais."}
          </p>
        </div>
      </div>
      <ButtonLink href="/assinar" className="shrink-0">
        Quero assinar
      </ButtonLink>
    </aside>
  );
}
