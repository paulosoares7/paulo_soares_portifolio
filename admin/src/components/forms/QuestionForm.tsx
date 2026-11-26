"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { saveQuestion } from "@/actions/activities";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { FileUpload } from "@/components/ui/FileUpload";
import { FormFooter } from "@/components/ui/FormFooter";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { QUESTION_TYPES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { questionSchema } from "@/validators/activity";

type OptionValue = { id: number | null; text: string; isCorrect: boolean; feedback: string };

/** Valores de uma questão para edição (decimais como texto). */
export type QuestionValues = {
  id: number;
  type: string;
  statement: string;
  imageFileId: number | null;
  imageName: string | null;
  points: string;
  numericAnswer: string;
  tolerancePct: string;
  unit: string;
  explanation: string;
  options: OptionValue[];
};

const EMPTY_OPTIONS: OptionValue[] = [
  { id: null, text: "", isCorrect: true, feedback: "" },
  { id: null, text: "", isCorrect: false, feedback: "" },
];

/**
 * Questão com enunciado em Markdown + LaTeX, figura opcional e gabarito:
 * alternativas (múltipla escolha), valor com tolerância (numérica) ou
 * correção manual (aberta).
 */
export function QuestionForm({
  activityId,
  item,
  storageReady,
}: {
  activityId: number;
  item?: QuestionValues;
  storageReady: boolean;
}) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(questionSchema, saveQuestion, {
    onSuccess: close,
  });
  const [type, setType] = useState(item?.type ?? "multiple_choice");
  const [options, setOptions] = useState<OptionValue[]>(
    item?.options.length ? item.options : EMPTY_OPTIONS,
  );
  const [image, setImage] = useState(
    item?.imageFileId ? { id: item.imageFileId, name: item.imageName ?? "imagem" } : null,
  );

  function updateOption(index: number, patch: Partial<OptionValue>): void {
    setOptions((current) =>
      current.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    );
  }

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-3">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="imageFileId" value={image?.id ?? ""} />
      {/* Alternativas só valem para múltipla escolha; nos outros tipos vão vazias. */}
      <input
        type="hidden"
        name="options"
        value={type === "multiple_choice" ? JSON.stringify(options) : "[]"}
      />

      <Field label="Tipo" htmlFor="q-type" className="md:col-span-2">
        <Select
          id="q-type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {Object.entries(QUESTION_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Pontos" htmlFor="q-points" error={errors.points}>
        <Input
          id="q-points"
          name="points"
          defaultValue={item?.points ?? "1,00"}
          invalid={!!errors.points}
        />
      </Field>
      <Field
        label="Enunciado (Markdown + LaTeX)"
        htmlFor="q-statement"
        error={errors.statement}
        className="md:col-span-3"
      >
        <MarkdownEditor
          id="q-statement"
          name="statement"
          defaultValue={item?.statement}
          invalid={!!errors.statement}
          rows={5}
        />
      </Field>

      <div className="flex flex-col gap-2 md:col-span-3">
        <span className="text-sm font-medium">Figura ou gráfico (opcional)</span>
        {image ? (
          <p className="text-sm">
            {image.name}{" "}
            <button
              type="button"
              className="text-danger text-xs hover:underline"
              onClick={() => setImage(null)}
            >
              remover
            </button>
          </p>
        ) : null}
        <FileUpload
          kind="question-image"
          storageReady={storageReady}
          label="Enviar imagem"
          onUploaded={(id, name) => setImage({ id, name })}
        />
      </div>

      {type === "multiple_choice" ? (
        <fieldset className="flex flex-col gap-3 md:col-span-3">
          <legend className="mb-2 text-sm font-medium">Alternativas (marque a correta)</legend>
          {options.map((option, index) => (
            <div
              key={index}
              className="rounded-btn border-border grid gap-2 border p-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-center"
            >
              <label className="text-muted flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="accent-success size-4"
                  checked={option.isCorrect}
                  onChange={(event) => updateOption(index, { isCorrect: event.target.checked })}
                  aria-label={`Alternativa ${index + 1} correta`}
                />
                {String.fromCharCode(65 + index)}
              </label>
              <Input
                value={option.text}
                placeholder="Texto da alternativa"
                aria-label={`Texto da alternativa ${index + 1}`}
                onChange={(event) => updateOption(index, { text: event.target.value })}
              />
              <Input
                value={option.feedback}
                placeholder="Por que está certa/errada (opcional)"
                aria-label={`Comentário da alternativa ${index + 1}`}
                onChange={(event) => updateOption(index, { feedback: event.target.value })}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remover alternativa ${index + 1}`}
                disabled={options.length <= 2}
                onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          {errors.options ? <p className="text-danger text-xs">{errors.options[0]}</p> : null}
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={options.length >= 10}
              onClick={() =>
                setOptions((current) => [
                  ...current,
                  { id: null, text: "", isCorrect: false, feedback: "" },
                ])
              }
            >
              <Plus className="size-4" aria-hidden /> Alternativa
            </Button>
          </div>
        </fieldset>
      ) : null}

      {type === "numeric" ? (
        <>
          <Field label="Resposta (gabarito)" htmlFor="q-answer" error={errors.numericAnswer}>
            <Input
              id="q-answer"
              name="numericAnswer"
              defaultValue={item?.numericAnswer}
              invalid={!!errors.numericAnswer}
            />
          </Field>
          <Field
            label="Tolerância (%)"
            htmlFor="q-tolerance"
            error={errors.tolerancePct}
            hint="Ex.: 2 = aceita ±2% do gabarito."
          >
            <Input
              id="q-tolerance"
              name="tolerancePct"
              defaultValue={item?.tolerancePct}
              invalid={!!errors.tolerancePct}
            />
          </Field>
          <Field label="Unidade" htmlFor="q-unit" error={errors.unit} hint="Ex.: m/s">
            <Input id="q-unit" name="unit" defaultValue={item?.unit} />
          </Field>
        </>
      ) : null}

      {type === "open" ? (
        <p className="text-muted text-sm md:col-span-3">
          Questão aberta: as respostas aparecem em &quot;Correção de abertas&quot; para você
          corrigir.
        </p>
      ) : null}

      <Field
        label="Resolução (mostrada conforme a regra da atividade)"
        htmlFor="q-explanation"
        error={errors.explanation}
        className="md:col-span-3"
      >
        <MarkdownEditor
          id="q-explanation"
          name="explanation"
          defaultValue={item?.explanation}
          rows={4}
        />
      </Field>
      <div className="md:col-span-3">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
