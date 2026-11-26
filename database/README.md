# database — Projeto 1

Única fonte da estrutura do MySQL. Os projetos `admin` e `site` importam o
Prisma Client exportado daqui (`@portfolio/database`) e nunca definem tabelas.

```ts
import { prisma } from "@portfolio/database";
const aulas = await prisma.lesson.findMany({ where: { status: "published" } });
```

## Conteúdo

| Caminho | O que é |
| --- | --- |
| `sql/001_schema.sql` | **Especificação** da estrutura (39 tabelas + visão) |
| `sql/002_seed.sql` | Dados de exemplo de Física I em SQL puro |
| `prisma/schema.prisma` | Schema Prisma equivalente ao `001_schema.sql` |
| `prisma/migrations/` | Migrações versionadas (a inicial inclui CHECKs, `ON UPDATE` e a visão) |
| `prisma/seed.ts` | Seed em TypeScript (mesmos dados do `002_seed.sql`) |
| `prisma.config.ts` | Configuração do Prisma CLI (URL do banco, seed) |
| `src/index.ts` | Exporta uma instância única do PrismaClient |
| `scripts/create-admin.ts` | Cria o administrador ou troca a senha (bcrypt) |
| `scripts/backup.sh` | `mysqldump` compactado com retenção de 7 dias |
| `docker-compose.yml` | MySQL 8 local (imagem `mysql:8`) |
| `docker/mysql-init/` | Script da primeira subida: cria o banco `portfolio_shadow` |

Dicionário de dados: [`../docs/04-banco-de-dados.md`](../docs/04-banco-de-dados.md).

## Pré-requisitos

- Node.js 20+ e npm
- Docker Desktop **funcionando** (no Windows Home, ele precisa do WSL 2:
  `wsl --install --no-distribution` num PowerShell como administrador e
  reiniciar o computador)

## Primeira vez (do zero)

Na raiz do repositório:

```bash
npm install                        # instala e gera o Prisma Client
cp database/.env.example database/.env   # e troque as senhas
npm run db:setup                   # sobe o MySQL, aplica a migração e roda o seed
```

O `db:setup` é o "um comando" do roadmap: `db:up` + `migrate:deploy` + `seed`.

Depois, crie o administrador de verdade:

```bash
npm run create-admin -w @portfolio/database -- --email voce@dominio.com --name "Paulo"
```

Na primeira vez, o script assume a conta de exemplo do seed (`admin@exemplo.com`,
autora do aviso de exemplo do fórum), porque o sistema tem um único
administrador. Rodar de novo com o mesmo e-mail troca a senha.

## Ligar e desligar o banco

Comandos dentro de `database/` (ou na raiz com `-w @portfolio/database`):

| Ação | Comando | O que acontece |
| --- | --- | --- |
| **Ligar** | `npm run db:up` | Sobe o container `portfolio-mysql` e espera ele ficar saudável |
| **Desligar** | `npm run db:down` | Para o container; **os dados ficam guardados** |
| Ver logs | `npm run db:logs` | Acompanha o log do MySQL (Ctrl+C sai) |
| Ver status | `docker compose ps` | Mostra se está rodando e se está `healthy` |
| Abrir o console SQL | `docker compose exec mysql mysql -uportfolio -p portfolio` | Pede a `MYSQL_PASSWORD` do `.env` |

Na raiz do repositório também existem os atalhos `npm run db:up` e
`npm run db:down`.

O container usa `restart: unless-stopped`: se você não desligar, ele volta
sozinho quando o Docker Desktop abrir.

Os dados ficam no volume Docker `portfolio-mysql-data`. Para **apagar tudo**
e recomeçar do zero (destrutivo, perde todos os dados locais):

```bash
docker compose down -v   # remove o container e o volume
npm run setup            # recria, migra e popula
```

## Migrações

| Situação | Comando |
| --- | --- |
| Aplicar migrações pendentes (local, CI, produção) | `npm run migrate:deploy` |
| Criar migração nova depois de editar o `schema.prisma` | `npm run migrate:dev -- --name descricao` |
| Ver o estado | `npm run migrate:status` |

Regras (ver `CLAUDE.md`): toda mudança vira migração nova **e** atualiza o
`sql/001_schema.sql` e o `docs/04-banco-de-dados.md` no mesmo commit. CHECK,
visão e `ON UPDATE CURRENT_TIMESTAMP` o Prisma não gera: crie com
`--create-only` e edite o `migration.sql`.

O `migrate dev` usa o banco `portfolio_shadow` (`SHADOW_DATABASE_URL`), criado
na primeira subida do container.

## Seed

`npm run seed` popula um banco **vazio** com os dados de Física I (3 módulos,
7 temas, 11 aulas, 2 grátis), o plano mensal e o aluno demo com o código
`FIS1-DEMO-2026-TEST`. Se o banco já tiver dados, o seed não faz nada.

## Backup

```bash
npm run backup
```

Gera `database/backups/portfolio-AAAAMMDD-HHMMSS.sql.gz` e apaga os arquivos
com mais de 7 dias. Usa o `mysqldump` da máquina ou, se não houver, o do
container. A pasta `backups/` não vai para o Git.

## Diferenças conhecidas em relação ao `001_schema.sql`

- Comentários de tabela e coluna (`COMMENT '...'`) não são criados pela
  migração; eles estão como `///` no `schema.prisma`.
- A visão `v_student_course_access` existe no banco, mas não tem model no
  Prisma Client (consulte com `prisma.$queryRaw` ou pela regra em `lib/`).

## Testar o SQL direto (sem Prisma)

```bash
mysql -u root -p < sql/001_schema.sql
mysql -u root -p < sql/002_seed.sql
```
