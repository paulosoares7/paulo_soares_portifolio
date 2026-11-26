"use client";

import { saveSocialLink } from "@/actions/profile";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { SOCIAL_NETWORKS } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { socialLinkSchema } from "@/validators/profile";

type SocialLinkValues = {
  id: number;
  network: string;
  label: string;
  url: string;
  isVisible: boolean;
};

/** Link de rede social (cria ou edita). */
export function SocialLinkForm({ item }: { item?: SocialLinkValues }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(socialLinkSchema, saveSocialLink, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Rede" htmlFor="sl-network" error={errors.network}>
        <Select
          id="sl-network"
          name="network"
          defaultValue={item?.network ?? ""}
          invalid={!!errors.network}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {Object.entries(SOCIAL_NETWORKS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Link" htmlFor="sl-url" error={errors.url} hint="https://... ou mailto:voce@...">
        <Input id="sl-url" name="url" defaultValue={item?.url} invalid={!!errors.url} />
      </Field>
      <Field label="Texto alternativo (opcional)" htmlFor="sl-label" error={errors.label}>
        <Input id="sl-label" name="label" defaultValue={item?.label} maxLength={60} />
      </Field>
      <Checkbox name="isVisible" label="Mostrar no site" defaultChecked={item?.isVisible ?? true} />
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
