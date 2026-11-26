"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/Field";

/** Disciplina para escolher nas vagas, com o caminho Categoria › Grupo. */
export type CourseOption = { id: number; title: string; path: string };

type CourseSlotsFieldProps = {
  courses: CourseOption[];
  /** Vagas que valem (plano ou exceção do aluno). */
  limit: number;
  defaultSelected?: number[];
  error?: string[];
  name?: string;
};

/**
 * Caixas das disciplinas das vagas com o contador "2 de 3". Acima do limite,
 * avisa (as que já estavam saem na renovação; o servidor recusa novas).
 */
export function CourseSlotsField({
  courses,
  limit,
  defaultSelected = [],
  error,
  name = "courseIds[]",
}: CourseSlotsFieldProps) {
  const [selected, setSelected] = useState<number[]>(defaultSelected);
  const over = selected.length > limit;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 flex flex-wrap items-baseline gap-2 text-sm font-medium">
        Disciplinas nas vagas
        <span className={`text-xs ${over ? "text-warning" : "text-muted"}`}>
          {selected.length} de {limit} vaga(s)
        </span>
      </legend>
      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {courses.map((c) => (
          <Checkbox
            key={c.id}
            name={name}
            value={c.id}
            checked={selected.includes(c.id)}
            onChange={(event) =>
              setSelected((current) =>
                event.target.checked ? [...current, c.id] : current.filter((id) => id !== c.id),
              )
            }
            label={
              <span>
                {c.title} <span className="text-muted text-xs">· {c.path}</span>
              </span>
            }
          />
        ))}
      </div>
      {over ? (
        <p className="text-warning text-xs">
          Acima do limite: as disciplinas que já estavam ficam até a renovação; não dá para
          acrescentar novas.
        </p>
      ) : null}
      {error?.length ? <p className="text-danger text-xs">{error[0]}</p> : null}
    </fieldset>
  );
}
