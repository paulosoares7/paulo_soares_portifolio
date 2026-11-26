import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { prisma } from "@portfolio/database";
import { ContactForm } from "@/components/contact/ContactForm";
import { Container, PageTitle } from "@portfolio/ui/Container";
import { SocialLinks } from "@portfolio/ui/SocialIcon";
import { getSiteIdentity } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale comigo: dúvidas sobre as aulas, parcerias e pesquisa.",
};

/** Contato (RF04): formulário salvo no banco, com aviso por e-mail. */
export default async function ContactPage() {
  const [identity, profile] = await Promise.all([
    getSiteIdentity(),
    prisma.profile.findUnique({ where: { id: 1 }, select: { publicEmail: true, city: true } }),
  ]);

  return (
    <Container>
      <PageTitle
        title="Vamos"
        accent="conversar"
        description="Dúvidas sobre as aulas, parcerias ou pesquisa: escreva que eu respondo pelo seu e-mail."
      />
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-card border-border bg-surface border p-6 sm:p-8">
          <ContactForm />
        </section>
        <aside className="flex flex-col gap-5">
          {profile?.publicEmail ? (
            <a
              href={`mailto:${profile.publicEmail}`}
              className="text-muted hover:text-accent flex items-center gap-3"
            >
              <Mail className="text-accent size-5" aria-hidden /> {profile.publicEmail}
            </a>
          ) : null}
          {profile?.city ? (
            <p className="text-muted flex items-center gap-3">
              <MapPin className="text-accent size-5" aria-hidden /> {profile.city}
            </p>
          ) : null}
          <SocialLinks links={identity.socialLinks} />
        </aside>
      </div>
    </Container>
  );
}
