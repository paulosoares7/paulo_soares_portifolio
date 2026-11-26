"use client";

import { saveVideoLink } from "@/actions/videos";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { videoLinkSchema } from "@/validators/media";

type VideoLinkValues = {
  id: number;
  title: string;
  provider: string;
  externalUrl: string;
  duration: string;
};

/** Vídeo por link: YouTube (aulas grátis), Vimeo ou MP4. */
export function VideoLinkForm({ item }: { item?: VideoLinkValues }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(videoLinkSchema, saveVideoLink, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Título (interno)" htmlFor="vl-title" error={errors.title}>
        <Input id="vl-title" name="title" defaultValue={item?.title} invalid={!!errors.title} />
      </Field>
      <Field label="Origem" htmlFor="vl-provider" error={errors.provider}>
        <Select id="vl-provider" name="provider" defaultValue={item?.provider ?? "youtube"}>
          <option value="youtube">YouTube (aulas grátis)</option>
          <option value="vimeo">Vimeo</option>
          <option value="mp4">MP4 (link direto)</option>
        </Select>
      </Field>
      <Field label="Link" htmlFor="vl-url" error={errors.externalUrl}>
        <Input
          id="vl-url"
          name="externalUrl"
          type="url"
          defaultValue={item?.externalUrl}
          invalid={!!errors.externalUrl}
        />
      </Field>
      <Field
        label="Duração (opcional)"
        htmlFor="vl-duration"
        error={errors.duration}
        hint="mm:ss, ex.: 9:56"
      >
        <Input
          id="vl-duration"
          name="duration"
          defaultValue={item?.duration}
          invalid={!!errors.duration}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
