# CLAUDE.md — plataforma

Leia também o `CLAUDE.md` da raiz.

- Plataforma de aulas: página inicial, catálogo, disciplinas, aulas,
  atividades, materiais, fórum, login dos alunos, minha área, assinatura e
  "Sobre o professor". O portfólio é outro projeto (`lib/links.ts`,
  `NEXT_PUBLIC_PORTFOLIO_URL`): links para ele usam `<a>`, nunca `<Link>`.
- Acesso ao banco só via `@portfolio/database`. Não crie tabelas aqui.
- Tema e componentes visuais comuns ficam em `@portfolio/ui` (`packages/ui`).
- **Toda** checagem de acesso passa por `lib/access.ts`: item grátis
  (`is_preview`) ou disciplina em `v_student_course_access` para o aluno
  logado. Nenhuma página decide sozinha.
- Quem não tem acesso não recebe no HTML o link do vídeo, os enunciados nem
  o gabarito. Aula paga aparece com cadeado.
- Páginas públicas são Server Components (SEO). Interatividade em
  componentes cliente pequenos.
- Textos da página inicial ficam em `content/home.ts`. Preço, limite de
  disciplinas e grupos vêm do banco, nunca do texto.
- Webhook do Asaas (`api/webhooks/asaas`): validar `ASAAS_WEBHOOK_TOKEN`,
  gravar em `payment_events` (ignorar repetido), **consultar o pagamento na
  API** e só então alterar a assinatura.
- Vagas: até 3. Vaga vazia → preencher na hora. Vaga ocupada → agendar troca
  (uma por ciclo) para `current_period_end`.
- Vídeo pago: nunca expor URL permanente. PDF: nunca oferecer download.
- Posts de aluno entram como `pending`.
- Tarefas agendadas via Vercel Cron, protegidas por `CRON_SECRET`.
