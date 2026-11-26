"use client";

import { saveTopic } from "@/actions/catalog";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { topicSchema } from "@/validators/catalog";

/** Tema dentro de um módulo (cria ou edita). */
export function TopicForm({
  moduleId,
  item,
}: {
  moduleId: number;
  item?: { id: number; title: string; description: string };
}) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(topicSchema, saveTopic, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <Field
        label="Título do tema"
        htmlFor="topic-title"
        error={errors.title}
        hint="Ex.: Movimento retilíneo uniforme"
      >
        <Input id="topic-title" name="title" defaultValue={item?.title} invalid={!!errors.title} />
      </Field>
      <Field label="Descrição (opcional)" htmlFor="topic-desc" error={errors.description}>
        <Textarea
          id="topic-desc"
          name="description"
          defaultValue={item?.description}
          maxLength={400}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
