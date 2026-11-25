# CLAUDE.md — admin

Leia também o `CLAUDE.md` da raiz.

- Acesso ao banco só via `@portfolio/database`. Não crie tabelas aqui.
- Toda rota de `(panel)` exige sessão de admin (verificar no `layout.tsx` e
  em cada server action).
- Formulários: um componente por entidade em `components/forms/`, validados
  com o mesmo schema Zod no cliente e no servidor (`validators/`).
- Importação Lattes/ORCID: sempre gerar uma **prévia** (novos, alterados,
  duplicados por DOI) antes de gravar. Registrar em `import_jobs`.
- Envio de vídeo: o navegador envia direto ao Bunny com a URL gerada em
  `api/videos/upload-url`; o servidor só grava o registro em `videos`.
- Cortesia = assinatura com `gateway = 'manual'`.
- Posts do admin no fórum entram como `visible`.
