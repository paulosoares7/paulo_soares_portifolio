"use client";

import { useState } from "react";
import { saveCourse } from "@/actions/catalog";
import { TitleSlugFields } from "@/components/forms/TitleSlugFields";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { COURSE_ICONS, CourseIcon } from "@/lib/course-icons";
import { COURSE_STATUSES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { courseSchema } from "@/validators/catalog";

/** Valores de uma disciplina para edição. */
export type CourseValues = {
  id: number;
  groupId: number;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  /** RN10: vazio = sem limite. */
  maxFreeLessons: string;
  maxFreeActivities: string;
};

/** Categorias com seus grupos, para o seletor em dois níveis. */
export type GroupOptions = { id: number; name: string; groups: { id: number; name: string }[] }[];

type CourseFormProps = {
  item?: CourseValues;
  categories: GroupOptions;
  defaultGroupId?: number;
};

/**
 * Dados da disciplina: grupo, título, endereço, textos, ícone, cor, status e
 * quantas aulas e atividades grátis ela pode ter (RN10).
 */
export function CourseForm({ item, categories, defaultGroupId }: CourseFormProps) {
  const { formProps, state, pending, errors } = useFormAction(courseSchema, saveCourse);
  const [icon, setIcon] = useState(item?.icon || "atom");
  const [color, setColor] = useState(item?.color || "#0EA5E9");

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field
        label="Categoria › Grupo"
        htmlFor="course-group"
        error={errors.groupId}
        hint="Os grupos são criados em Categorias e grupos."
      >
        <Select
          id="course-group"
          name="groupId"
          defaultValue={item?.groupId ?? defaultGroupId ?? ""}
          invalid={!!errors.groupId}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {categories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {c.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {c.name} › {g.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>
      <Field
        label="Status"
        htmlFor="course-status"
        error={errors.status}
        hint="Rascunho e arquivada não aparecem no site."
      >
        <Select id="course-status" name="status" defaultValue={item?.status ?? "draft"}>
          {Object.entries(COURSE_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <TitleSlugFields
        prefix="course"
        titleLabel="Título"
        defaultTitle={item?.title}
        defaultSlug={item?.slug}
        errors={errors}
        slugHint="Usado na URL: /disciplina/fisica-1"
      />
      <Field
        label="Descrição curta (cartão)"
        htmlFor="course-short"
        error={errors.shortDescription}
        className="md:col-span-2"
      >
        <Textarea
          id="course-short"
          name="shortDescription"
          defaultValue={item?.shortDescription}
          maxLength={300}
          invalid={!!errors.shortDescription}
        />
      </Field>
      <Field
        label="Descrição completa (opcional, Markdown)"
        htmlFor="course-desc"
        error={errors.description}
        className="md:col-span-2"
      >
        <Textarea
          id="course-desc"
          name="description"
          defaultValue={item?.description}
          className="min-h-32"
        />
      </Field>
      <Field label="Ícone" htmlFor="course-icon" error={errors.icon}>
        <div className="flex items-center gap-3">
          <span className="rounded-btn border-border bg-surface-2 flex size-10 shrink-0 items-center justify-center border">
            <CourseIcon name={icon} color={color} />
          </span>
          <Select
            id="course-icon"
            name="icon"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
          >
            {Object.keys(COURSE_ICONS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </Field>
      <Field label="Cor do cartão" htmlFor="course-color" error={errors.color}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Escolher cor"
            value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#0EA5E9"}
            onChange={(event) => setColor(event.target.value.toUpperCase())}
            className="rounded-btn border-border bg-surface-2 size-10 shrink-0 cursor-pointer border"
          />
          <Input
            id="course-color"
            name="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            invalid={!!errors.color}
          />
        </div>
      </Field>
      <fieldset className="border-border rounded-card grid gap-4 border p-4 md:col-span-2 md:grid-cols-2">
        <legend className="px-1 text-sm font-medium">Conteúdo grátis (aberto sem login)</legend>
        <Field
          label="Máximo de aulas grátis"
          htmlFor="course-free-lessons"
          error={errors.maxFreeLessons}
          hint="Vazio = sem limite. 0 = nenhuma. Aula grátis usa vídeo do YouTube."
        >
          <Input
            id="course-free-lessons"
            name="maxFreeLessons"
            type="number"
            min={0}
            max={999}
            inputMode="numeric"
            placeholder="sem limite"
            defaultValue={item ? item.maxFreeLessons : "2"}
            invalid={!!errors.maxFreeLessons}
          />
        </Field>
        <Field
          label="Máximo de atividades grátis"
          htmlFor="course-free-activities"
          error={errors.maxFreeActivities}
          hint="Vazio = sem limite. 0 = nenhuma."
        >
          <Input
            id="course-free-activities"
            name="maxFreeActivities"
            type="number"
            min={0}
            max={999}
            inputMode="numeric"
            placeholder="sem limite"
            defaultValue={item ? item.maxFreeActivities : "1"}
            invalid={!!errors.maxFreeActivities}
          />
        </Field>
        <p className="text-muted text-xs md:col-span-2">
          Diminuir o limite não desmarca o que já é grátis: só impede marcar novas aulas ou
          atividades como grátis.
        </p>
      </fieldset>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} label={item ? "Salvar" : "Criar disciplina"} />
      </div>
    </form>
  );
}
