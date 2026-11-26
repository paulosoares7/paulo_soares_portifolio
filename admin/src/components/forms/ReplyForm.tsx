"use client";

import { useState } from "react";
import { replyAsAdmin } from "@/actions/forum";
import { Checkbox, Field } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useFormAction } from "@/lib/use-form-action";
import { replySchema } from "@/validators/forum";

/** Resposta do professor no tópico (publicada como visível). */
export function ReplyForm({ threadId, isQuestion }: { threadId: number; isQuestion: boolean }) {
  // Cada resposta publicada troca a key do editor, que volta vazio.
  const [round, setRound] = useState(0);
  const { formProps, state, pending, errors } = useFormAction(replySchema, replyAsAdmin, {
    resetOnSuccess: true,
    onSuccess: () => setRound((value) => value + 1),
  });
  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="threadId" value={threadId} />
      <Field label="Sua resposta (Markdown + LaTeX)" htmlFor="reply-body" error={errors.body}>
        <MarkdownEditor key={round} id="reply-body" name="body" rows={5} invalid={!!errors.body} />
      </Field>
      {isQuestion ? (
        <Checkbox name="isAnswer" label="Marcar como resposta oficial (resolve a dúvida)" />
      ) : null}
      <FormFooter state={state} pending={pending} label="Responder" />
    </form>
  );
}
