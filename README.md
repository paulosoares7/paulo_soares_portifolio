# Portfólio Acadêmico + Plataforma de Aulas

Portfólio acadêmico (perfil, formação, publicações no estilo Lattes) com uma
plataforma de videoaulas por assinatura, dividida em Vestibulares, Ensino
Médio, Ensino Superior e Concursos.

> **Status:** fases 1 (`database`), 2 (`admin`) e 3 (`portfolio` e
> `plataforma`) quase prontas; faltam o tema claro/escuro e o PWA. Depois vêm
> a publicação e a fase 4 (assinatura). Veja `docs/07-roadmap.md`.

## Projetos

| Pasta | O que é | Fase |
| --- | --- | --- |
| [`database/`](database/) | Estrutura do MySQL: SQL, schema Prisma, migrações e seed | 1 |
| [`admin/`](admin/) | Painel gerencial em Next.js (`npm run admin:dev`, porta 3001) | 2 |
| [`portfolio/`](portfolio/) | Portfólio em Next.js (`npm run portfolio:dev`, porta 3000) | 3 |
| [`plataforma/`](plataforma/) | Plataforma de aulas em Next.js (`npm run plataforma:dev`, porta 3002) | 3, 4 e 5 |
| [`packages/ui/`](packages/ui/) | Tema e componentes comuns ao portfólio e à plataforma | 3 |

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [01 — Decisões](docs/01-decisoes.md) | Pagamento, acesso, vídeo, anti-pirataria, Lattes/ORCID, hospedagem |
| [02 — Requisitos](docs/02-requisitos.md) | Atores, requisitos funcionais e não funcionais, regras de negócio |
| [03 — Arquitetura](docs/03-arquitetura.md) | Como os projetos e os serviços externos se ligam |
| [04 — Banco de dados](docs/04-banco-de-dados.md) | Dicionário das 42 tabelas |
| [05 — Fluxos](docs/05-fluxos.md) | Login, assinatura, troca de disciplina, reprodução |
| [06 — Interface](docs/06-interface.md) | Mapa de páginas, inspirações e tokens visuais |
| [07 — Roadmap](docs/07-roadmap.md) | Fases, status real e critérios para avançar |
| [Guia de publicação](docs/guia-publicacao.md) | Banco no TiDB Cloud e os três apps na Vercel, passo a passo |
| [Guia do login com Google](docs/guia-login-google.md) | Credenciais do Google Cloud para o "Entrar com Google" |
| [Pedidos](docs/prompts/README.md) | Pedidos prontos para o Claude Code (auditoria, modo offline) |

As regras de código que o Claude Code segue estão em [`CLAUDE.md`](CLAUDE.md).

## Como continuar no Claude Code

1. Abra o Claude Code na raiz deste repositório.
2. Para saber o que falta, peça: *"Execute o pedido de
   docs/prompts/auditoria-e-continuacao.md."*
3. Ao terminar cada fase, confira o critério de avanço em
   `docs/07-roadmap.md` antes de passar para a próxima.

## Testar o banco agora

```bash
mysql -u root -p < database/sql/001_schema.sql
mysql -u root -p < database/sql/002_seed.sql
```

O seed cria Física I com 3 módulos, 11 aulas (2 grátis no YouTube), uma
atividade grátis, o plano mensal e um aluno de demonstração com o código
`FIS1-DEMO-2026-TEST`.
