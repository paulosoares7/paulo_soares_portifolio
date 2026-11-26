"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@portfolio/ui/Button";
import { authClient } from "@/lib/auth-client";

/** Botão "Sair": apaga a sessão deste aparelho e volta para o início. */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut className="size-4" aria-hidden /> {pending ? "Saindo..." : "Sair"}
    </Button>
  );
}
