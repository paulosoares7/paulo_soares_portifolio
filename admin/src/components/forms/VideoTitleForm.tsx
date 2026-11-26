"use client";

import { renameVideo } from "@/actions/videos";
import { Field, Input } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { videoTitleSchema } from "@/validators/media";

/** Renomear vídeo hospedado no Bunny. */
export function VideoTitleForm({ item }: { item: { id: number; title: string } }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(videoTitleSchema, renameVideo, {
    onSuccess: close,
  });
  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item.id} />
      <Field label="Título (interno)" htmlFor="vt-title" error={errors.title}>
        <Input id="vt-title" name="title" defaultValue={item.title} invalid={!!errors.title} />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
