"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const CloseModalContext = createContext<() => void>(() => {});

/**
 * Função para o formulário dentro do modal fechá-lo após salvar.
 * @returns Função que fecha o modal mais próximo.
 */
export function useCloseModal(): () => void {
  return useContext(CloseModalContext);
}

type ModalTriggerProps = {
  label: ReactNode;
  title: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  wide?: boolean;
  ariaLabel?: string;
};

/** Botão que abre um modal com um formulário dentro. */
export function ModalTrigger({
  label,
  title,
  children,
  variant = "secondary",
  size = "sm",
  wide,
  ariaLabel,
}: ModalTriggerProps) {
  const [open, setOpen] = useState(false);
  const close = (): void => setOpen(false);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {label}
      </Button>
      <Modal open={open} onClose={close} title={title} wide={wide}>
        <CloseModalContext.Provider value={close}>{children}</CloseModalContext.Provider>
      </Modal>
    </>
  );
}
