# CLAUDE.md — database

Leia também o `CLAUDE.md` da raiz.

- O `sql/001_schema.sql` é a especificação. O `schema.prisma` deve gerar
  **exatamente** essa estrutura: mesmos nomes de tabela e coluna
  (`@@map`/`@map` quando o nome do model for diferente), mesmos tipos,
  índices, chaves únicas e regras de exclusão.
- Models em `PascalCase` no singular (`Course` → tabela `courses`); campos em
  `camelCase` mapeados para `snake_case`.
- O Prisma não cria CHECK nem visões: adicione-os à migração inicial em SQL
  (`prisma migrate dev --create-only` e edite o `migration.sql`).
- Mudança no banco = nova migração + atualização do `001_schema.sql` + do
  dicionário em `docs/04-banco-de-dados.md`, no mesmo commit.
- Seeds e scripts comentados em português.
- Nunca rode `prisma migrate reset` nem DROP sem confirmação.
