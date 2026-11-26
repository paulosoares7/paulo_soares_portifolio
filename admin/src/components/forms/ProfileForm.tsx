"use client";

import { saveProfile } from "@/actions/profile";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useFormAction } from "@/lib/use-form-action";
import { profileSchema } from "@/validators/profile";

/** Valores atuais do perfil (texto vazio quando não há). */
export type ProfileValues = {
  fullName: string;
  displayName: string;
  headline: string;
  shortBio: string;
  longBio: string;
  publicEmail: string;
  city: string;
  lattesId: string;
  lattesUrl: string;
  orcidId: string;
  scholarUrl: string;
};

/** Formulário dos dados do perfil (RF23). */
export function ProfileForm({ values }: { values: ProfileValues }) {
  const { formProps, state, pending, errors } = useFormAction(profileSchema, saveProfile);

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <Field label="Nome completo" htmlFor="fullName" error={errors.fullName}>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={values.fullName}
          invalid={!!errors.fullName}
        />
      </Field>
      <Field
        label="Nome curto (cabeçalho)"
        htmlFor="displayName"
        error={errors.displayName}
        hint="Ex.: Paulo."
      >
        <Input
          id="displayName"
          name="displayName"
          defaultValue={values.displayName}
          invalid={!!errors.displayName}
        />
      </Field>
      <Field
        label="Título"
        htmlFor="headline"
        error={errors.headline}
        className="md:col-span-2"
        hint="Aparece em ciano na home."
      >
        <Input
          id="headline"
          name="headline"
          defaultValue={values.headline}
          invalid={!!errors.headline}
        />
      </Field>
      <Field
        label="Bio curta (home)"
        htmlFor="shortBio"
        error={errors.shortBio}
        className="md:col-span-2"
        hint="Até 400 caracteres."
      >
        <Textarea
          id="shortBio"
          name="shortBio"
          defaultValue={values.shortBio}
          maxLength={400}
          invalid={!!errors.shortBio}
        />
      </Field>
      <Field
        label="Texto da página Sobre"
        htmlFor="longBio"
        error={errors.longBio}
        className="md:col-span-2"
        hint="Aceita Markdown."
      >
        <Textarea id="longBio" name="longBio" defaultValue={values.longBio} className="min-h-40" />
      </Field>
      <Field label="E-mail público" htmlFor="publicEmail" error={errors.publicEmail}>
        <Input
          id="publicEmail"
          name="publicEmail"
          type="email"
          defaultValue={values.publicEmail}
          invalid={!!errors.publicEmail}
        />
      </Field>
      <Field label="Cidade" htmlFor="city" error={errors.city}>
        <Input id="city" name="city" defaultValue={values.city} />
      </Field>
      <Field
        label="Número do Lattes"
        htmlFor="lattesId"
        error={errors.lattesId}
        hint="Só números (16 dígitos)."
      >
        <Input
          id="lattesId"
          name="lattesId"
          inputMode="numeric"
          defaultValue={values.lattesId}
          invalid={!!errors.lattesId}
        />
      </Field>
      <Field label="Link do Lattes" htmlFor="lattesUrl" error={errors.lattesUrl}>
        <Input
          id="lattesUrl"
          name="lattesUrl"
          type="url"
          defaultValue={values.lattesUrl}
          invalid={!!errors.lattesUrl}
        />
      </Field>
      <Field label="ORCID iD" htmlFor="orcidId" error={errors.orcidId} hint="0000-0000-0000-0000">
        <Input
          id="orcidId"
          name="orcidId"
          defaultValue={values.orcidId}
          invalid={!!errors.orcidId}
        />
      </Field>
      <Field label="Google Acadêmico" htmlFor="scholarUrl" error={errors.scholarUrl}>
        <Input
          id="scholarUrl"
          name="scholarUrl"
          type="url"
          defaultValue={values.scholarUrl}
          invalid={!!errors.scholarUrl}
        />
      </Field>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
