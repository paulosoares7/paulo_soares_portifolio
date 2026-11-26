import type { Metadata } from "next";
import { PublicationForm } from "@/components/forms/PublicationForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Nova publicação" };

/** Cadastro manual de publicação. */
export default function NewPublicationPage() {
  return (
    <>
      <PageHeader title="Nova publicação" back={{ href: "/publicacoes", label: "Publicações" }} />
      <Card>
        <PublicationForm />
      </Card>
    </>
  );
}
