"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import type { FieldErrors } from "@/types/action";
import { slugify } from "@/validators/common";

type TitleSlugFieldsProps = {
  prefix: string;
  titleLabel: string;
  /** Nome do campo no formulário: "title" (padrão) ou "name" (categoria, grupo). */
  titleName?: "title" | "name";
  defaultTitle?: string;
  defaultSlug?: string;
  errors: FieldErrors;
  slugHint: string;
};

/**
 * Título + endereço (slug). Enquanto o slug não for editado à mão, ele
 * acompanha o título ("Física I" → "fisica-i").
 */
export function TitleSlugFields({
  prefix,
  titleLabel,
  titleName = "title",
  defaultTitle = "",
  defaultSlug = "",
  errors,
  slugHint,
}: TitleSlugFieldsProps) {
  const [slugValue, setSlugValue] = useState(defaultSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultSlug));

  return (
    <>
      <Field label={titleLabel} htmlFor={`${prefix}-title`} error={errors.title ?? errors.name}>
        <Input
          id={`${prefix}-title`}
          name={titleName}
          defaultValue={defaultTitle}
          invalid={!!(errors.title ?? errors.name)}
          onChange={(event) => {
            if (!slugTouched) setSlugValue(slugify(event.target.value));
          }}
        />
      </Field>
      <Field label="Endereço (slug)" htmlFor={`${prefix}-slug`} error={errors.slug} hint={slugHint}>
        <Input
          id={`${prefix}-slug`}
          name="slug"
          value={slugValue}
          invalid={!!errors.slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlugValue(event.target.value);
          }}
        />
      </Field>
    </>
  );
}
