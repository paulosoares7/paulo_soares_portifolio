"use client";

import { saveSocialLink } from "@/actions/profile";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { SOCIAL_NETWORK_OPTIONS, SOCIAL_NETWORKS } from "@/lib/labels";
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

  // Link antigo de rede que não está mais na lista (ex.: YouTube).
  const legacy =
    item && !(SOCIAL_NETWORK_OPTIONS as readonly string[]).includes(item.network)
      ? (SOCIAL_NETWORKS[item.network as keyof typeof SOCIAL_NETWORKS] ?? item.network)
      : null;

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Rede" htmlFor="sl-network" error={errors.network}>
        <Select
          id="sl-network"
          name="network"
          defaultValue={item && !legacy ? item.network : ""}
          invalid={!!errors.network}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {SOCIAL_NETWORK_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {SOCIAL_NETWORKS[value]}
            </option>
          ))}
        </Select>
      </Field>
      {legacy ? (
        <p className="text-warning text-xs">
          Este link é de uma rede que saiu da lista ({legacy}). Escolha uma das opções acima ou
          remova o link.
        </p>
      ) : null}
      <Field
        label="Link"
        htmlFor="sl-url"
        error={errors.url}
        hint="https://... ou, para E-mail, o endereço (voce@exemplo.com)"
      >
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
