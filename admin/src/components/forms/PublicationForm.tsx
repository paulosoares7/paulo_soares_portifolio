"use client";

import { savePublication } from "@/actions/publications";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { PUBLICATION_TYPES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { publicationSchema } from "@/validators/publication";

/** Valores de uma publicação para edição (texto vazio quando não há). */
export type PublicationValues = {
  id: number;
  type: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  abstract: string;
  keywords: string;
  isFeatured: boolean;
  isVisible: boolean;
};

/** Formulário de publicação (cadastro manual e edição). */
export function PublicationForm({ item }: { item?: PublicationValues }) {
  const { formProps, state, pending, errors } = useFormAction(publicationSchema, savePublication);

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-6">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Tipo" htmlFor="pub-type" error={errors.type} className="md:col-span-3">
        <Select
          id="pub-type"
          name="type"
          defaultValue={item?.type ?? "journal_article"}
          invalid={!!errors.type}
        >
          {Object.entries(PUBLICATION_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ano" htmlFor="pub-year" error={errors.year} className="md:col-span-3">
        <Input
          id="pub-year"
          name="year"
          inputMode="numeric"
          defaultValue={item?.year}
          invalid={!!errors.year}
        />
      </Field>
      <Field label="Título" htmlFor="pub-title" error={errors.title} className="md:col-span-6">
        <Input id="pub-title" name="title" defaultValue={item?.title} invalid={!!errors.title} />
      </Field>
      <Field
        label="Autores"
        htmlFor="pub-authors"
        error={errors.authors}
        className="md:col-span-6"
        hint="Como devem aparecer: SOBRENOME, N.; COAUTOR, A."
      >
        <Input
          id="pub-authors"
          name="authors"
          defaultValue={item?.authors}
          invalid={!!errors.authors}
        />
      </Field>
      <Field
        label="Periódico, evento ou editora"
        htmlFor="pub-venue"
        error={errors.venue}
        className="md:col-span-6"
      >
        <Input id="pub-venue" name="venue" defaultValue={item?.venue} />
      </Field>
      <Field label="Volume" htmlFor="pub-volume" error={errors.volume} className="md:col-span-2">
        <Input id="pub-volume" name="volume" defaultValue={item?.volume} />
      </Field>
      <Field label="Número" htmlFor="pub-issue" error={errors.issue} className="md:col-span-2">
        <Input id="pub-issue" name="issue" defaultValue={item?.issue} />
      </Field>
      <Field label="Páginas" htmlFor="pub-pages" error={errors.pages} className="md:col-span-2">
        <Input id="pub-pages" name="pages" defaultValue={item?.pages} />
      </Field>
      <Field
        label="DOI"
        htmlFor="pub-doi"
        error={errors.doi}
        className="md:col-span-3"
        hint="Ex.: 10.1590/1806-9126-rbef-2026-0001"
      >
        <Input id="pub-doi" name="doi" defaultValue={item?.doi} />
      </Field>
      <Field label="Link" htmlFor="pub-url" error={errors.url} className="md:col-span-3">
        <Input id="pub-url" name="url" type="url" defaultValue={item?.url} invalid={!!errors.url} />
      </Field>
      <Field
        label="Resumo (opcional)"
        htmlFor="pub-abstract"
        error={errors.abstract}
        className="md:col-span-6"
      >
        <Textarea id="pub-abstract" name="abstract" defaultValue={item?.abstract} />
      </Field>
      <Field
        label="Palavras-chave"
        htmlFor="pub-keywords"
        error={errors.keywords}
        className="md:col-span-6"
        hint="Separadas por ponto e vírgula."
      >
        <Input id="pub-keywords" name="keywords" defaultValue={item?.keywords} />
      </Field>
      <div className="flex flex-wrap gap-6 md:col-span-6">
        <Checkbox
          name="isFeatured"
          label="Destaque na home"
          defaultChecked={item?.isFeatured ?? false}
        />
        <Checkbox
          name="isVisible"
          label="Visível no site"
          defaultChecked={item?.isVisible ?? true}
        />
      </div>
      <div className="md:col-span-6">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
