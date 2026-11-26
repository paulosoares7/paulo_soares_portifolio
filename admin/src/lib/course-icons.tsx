// Ícones lucide oferecidos para os cartões de disciplina (coluna courses.icon).
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

/** Nome do ícone (como gravado no banco) → componente. */
export const COURSE_ICONS: Record<string, LucideIcon> = {
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

/** Ícone da disciplina com fallback. */
export function CourseIcon({
  name,
  color,
  className = "size-5",
}: {
  name: string | null;
  color?: string | null;
  className?: string;
}) {
  const Icon = (name && COURSE_ICONS[name]) || BookOpen;
  return <Icon className={className} style={color ? { color } : undefined} aria-hidden />;
}
