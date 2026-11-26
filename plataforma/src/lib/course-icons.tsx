// Ícones lucide dos cartões de disciplina (mesma lista do painel).
import {
  Atom,
  BookOpen,
  Calculator,
  Compass,
  FlaskConical,
  Gauge,
  GraduationCap,
  Lightbulb,
  Magnet,
  Orbit,
  Rocket,
  Ruler,
  Shield,
  Sigma,
  Telescope,
  Thermometer,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  atom: Atom,
  magnet: Magnet,
  zap: Zap,
  orbit: Orbit,
  rocket: Rocket,
  waves: Waves,
  thermometer: Thermometer,
  lightbulb: Lightbulb,
  telescope: Telescope,
  "flask-conical": FlaskConical,
  sigma: Sigma,
  calculator: Calculator,
  ruler: Ruler,
  compass: Compass,
  gauge: Gauge,
  "graduation-cap": GraduationCap,
  shield: Shield,
  "book-open": BookOpen,
};

/** Cor padrão quando a disciplina não define uma (ciano da paleta). */
export const DEFAULT_COURSE_COLOR = "#0EA5E9";

/** Quadrado colorido com o ícone da disciplina (como nos cartões de matérias). */
export function CourseIcon({
  name,
  color,
  size = "md",
}: {
  name: string | null;
  color: string | null;
  size?: "md" | "lg";
}) {
  const Icon = (name && ICONS[name]) || BookOpen;
  const tint = color ?? DEFAULT_COURSE_COLOR;
  const box = size === "lg" ? "size-16 rounded-card" : "size-12 rounded-btn";
  return (
    <span
      aria-hidden
      className={`flex ${box} shrink-0 items-center justify-center`}
      style={{ backgroundColor: `${tint}26`, color: tint }}
    >
      <Icon className={size === "lg" ? "size-8" : "size-6"} />
    </span>
  );
}
