import { Clapperboard, Lock } from "lucide-react";
import { ButtonLink } from "@portfolio/ui/Button";
import { formatMoney } from "@/lib/format";
import type { PlayerSource } from "@/lib/video";

const frame =
  "relative aspect-video w-full overflow-hidden rounded-card border border-border bg-black";

type VideoPlayerProps = {
  title: string;
  player: PlayerSource | "locked" | "coming-soon";
  /** Plano à venda, para o preço no cadeado. */
  plan?: { priceCents: number; maxCourses: number } | null;
};

/**
 * Player grande da aula (inspiração 06). Escolhe a fonte pelo provedor
 * (docs/03-arquitetura.md). Aula paga sem acesso: só o cadeado, sem vídeo.
 */
export function VideoPlayer({ title, player, plan = null }: VideoPlayerProps) {
  if (player === "locked") {
    return (
      <div
        className={`${frame} from-surface to-bg flex items-center justify-center bg-gradient-to-br`}
      >
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <span className="border-accent/40 bg-accent/10 text-accent flex size-16 items-center justify-center rounded-full border">
            <Lock className="size-7" aria-hidden />
          </span>
          <p className="text-lg font-semibold">Aula para assinantes</p>
          <p className="text-muted max-w-sm text-sm">
            {plan
              ? `Assine por ${formatMoney(plan.priceCents)} por mês para assistir a esta aula e a todas as aulas de até ${plan.maxCourses} disciplinas.`
              : "Assine para assistir a esta aula e a todas as aulas das suas disciplinas."}
          </p>
          <ButtonLink href="/assinar">Quero assinar</ButtonLink>
        </div>
      </div>
    );
  }

  if (player === "coming-soon" || player.kind === "unavailable") {
    return (
      <div
        className={`${frame} from-surface to-bg flex items-center justify-center bg-gradient-to-br`}
      >
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <Clapperboard className="text-warning size-10" aria-hidden />
          <p className="text-lg font-semibold">Vídeo em breve</p>
          <p className="text-muted max-w-sm text-sm">
            {player === "coming-soon"
              ? "O vídeo desta aula está sendo preparado. O texto e os materiais já estão disponíveis."
              : player.reason}
          </p>
        </div>
      </div>
    );
  }

  if (player.kind === "mp4") {
    return (
      <div className={frame}>
        {/* controlsList esconde o botão de download do navegador. */}
        <video
          src={player.url}
          controls
          preload="metadata"
          controlsList="nodownload"
          disablePictureInPicture
          className="h-full w-full"
        >
          Seu navegador não reproduz vídeos HTML5.
        </video>
      </div>
    );
  }

  return (
    <div className={frame}>
      <iframe
        src={player.embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
