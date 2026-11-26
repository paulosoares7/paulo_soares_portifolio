"use client";

import { linkVideoToLesson } from "@/actions/videos";
import { Field, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { linkLessonSchema } from "@/validators/media";

/** Aula agrupada por disciplina para o seletor. */
export type LessonGroup = { course: string; lessons: { id: number; label: string }[] };

/** Vincula um vídeo a uma aula (substitui o vídeo atual da aula). */
export function LinkLessonForm({ videoId, groups }: { videoId: number; groups: LessonGroup[] }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(linkLessonSchema, linkVideoToLesson, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="videoId" value={videoId} />
      <Field
        label="Aula"
        htmlFor="ll-lesson"
        error={errors.lessonId}
        hint="Se a aula já tiver vídeo, ele é substituído."
      >
        <Select id="ll-lesson" name="lessonId" defaultValue="" invalid={!!errors.lessonId}>
          <option value="" disabled>
            Escolha a aula...
          </option>
          {groups.map((group) => (
            <optgroup key={group.course} label={group.course}>
              {group.lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>
      <FormFooter state={state} pending={pending} label="Vincular" />
    </form>
  );
}
