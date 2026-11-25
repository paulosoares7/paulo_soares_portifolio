# database — Projeto 1

Única fonte da estrutura do MySQL. Os projetos `admin` e `site` importam o
Prisma Client exportado daqui (`@portfolio/database`) e nunca definem tabelas.

## Conteúdo

| Caminho | O que é | Status |
| --- | --- | --- |
| `sql/001_schema.sql` | Estrutura completa (39 tabelas + visão), testada | Pronto |
| `sql/002_seed.sql` | Dados de exemplo de Física I, testado | Pronto |
| `prisma/schema.prisma` | Schema Prisma equivalente ao SQL | Fase 1 |
| `prisma/migrations/` | Migrações versionadas | Fase 1 |
| `prisma/seed.ts` | Seed em TypeScript (mesmos dados do `002_seed.sql`) | Fase 1 |
| `scripts/create-admin.ts` | Cria/atualiza a senha do administrador (bcrypt) | Fase 1 |
| `scripts/backup.sh` | `mysqldump` compactado com retenção de 7 dias | Fase 1 |
| `src/index.ts` | Exporta uma instância única do PrismaClient | Fase 1 |

Dicionário de dados: [`../docs/04-banco-de-dados.md`](../docs/04-banco-de-dados.md).

## Testar o SQL direto

```bash
mysql -u root -p < sql/001_schema.sql
mysql -u root -p < sql/002_seed.sql
```
