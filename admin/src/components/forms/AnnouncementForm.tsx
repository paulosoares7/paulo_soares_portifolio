"use client";

import { createAnnouncement } from "@/actions/forum";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useFormAction } from "@/lib/use-form-action";
import { announcementSchema } from "@/validators/forum";

/** Novo aviso do professor no feed da disciplina (RF30). */
export function AnnouncementForm({ courses }: { courses: { id: number; title: string }[] }) {
  const { formProps, state, pending, errors } = useFormAction(
    announcementSchema,
    createAnnouncement,
  );
  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <Field label="Disciplina" htmlFor="ann-course" error={errors.courseId}>
        <Select id="ann-course" name="courseId" defaultValue="" invalid={!!errors.courseId}>
          <option value="" disabled>
            Escolha...
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Título" htmlFor="ann-title" error={errors.title}>
        <Input id="ann-title" name="title" invalid={!!errors.title} />
      </Field>
      <Field
        label="Mensagem (Markdown + LaTeX)"
        htmlFor="ann-body"
        error={errors.body}
        className="md:col-span-2"
      >
        <MarkdownEditor id="ann-body" name="body" rows={5} invalid={!!errors.body} />
      </Field>
      <div className="md:col-span-2">
        <Checkbox name="isPinned" defaultChecked label="Fixar no topo" />
      </div>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} label="Publicar aviso" />
      </div>
    </form>
  );
}
