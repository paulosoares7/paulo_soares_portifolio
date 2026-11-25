# CLAUDE.md — site

Leia também o `CLAUDE.md` da raiz.

- Acesso ao banco só via `@portfolio/database`. Não crie tabelas aqui.
- **Toda** checagem de acesso passa por `lib/access.ts` (aula grátis ou
  disciplina em `v_student_course_access`). Nenhuma página decide sozinha.
- Páginas públicas são Server Components (SEO). Interatividade em
  componentes cliente pequenos.
- Webhook do Asaas (`api/webhooks/asaas`): validar `ASAAS_WEBHOOK_TOKEN`,
  gravar em `payment_events` (ignorar repetido), **consultar o pagamento na
  API** e só então alterar a assinatura.
- Código de acesso: gerado em `lib/access-code.ts`; mostrado uma única vez;
  gravar só o SHA-256.
- Vagas: até 3. Vaga vazia → preencher na hora. Vaga ocupada → agendar troca
  (uma por ciclo) para `current_period_end`.
- Vídeo pago: nunca expor URL permanente. PDF: nunca oferecer download.
- Posts de aluno entram como `pending`.
- Tarefas agendadas via Vercel Cron, protegidas por `CRON_SECRET`.
