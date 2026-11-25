# Portfólio Acadêmico + Plataforma de Aulas

Portfólio acadêmico (perfil, formação, publicações no estilo Lattes) com uma
plataforma de videoaulas por assinatura, dividida em Vestibulares, Ensino
Médio, Ensino Superior e Concursos.

> **Status:** estrutura e engenharia definidas. Ainda **não há código de
> aplicação**: ele será escrito com o Claude Code, fase por fase.

## Projetos

| Pasta | O que é | Fase |
| --- | --- | --- |
| [`database/`](database/) | Estrutura do MySQL: SQL, schema Prisma, migrações e seed | 1 |
| [`admin/`](admin/) | Painel gerencial em Next.js | 2 |
| [`site/`](site/) | Site principal em Next.js | 3, 4 e 5 |

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [01 — Decisões](docs/01-decisoes.md) | Pagamento, acesso, vídeo, anti-pirataria, Lattes/ORCID, hospedagem |
| [02 — Requisitos](docs/02-requisitos.md) | Atores, requisitos funcionais e não funcionais, regras de negócio |
| [03 — Arquitetura](docs/03-arquitetura.md) | Como os três projetos e os serviços externos se ligam |
| [04 — Banco de dados](docs/04-banco-de-dados.md) | Dicionário das 39 tabelas |
| [05 — Fluxos](docs/05-fluxos.md) | Assinatura, código de acesso, troca de disciplina, reprodução |
| [06 — Interface](docs/06-interface.md) | Mapa de páginas, inspirações e tokens visuais |
| [07 — Roadmap](docs/07-roadmap.md) | Fases e critérios para avançar |

As regras de código que o Claude Code segue estão em [`CLAUDE.md`](CLAUDE.md).

## Como continuar no Claude Code

1. Abra o Claude Code na raiz deste repositório.
2. Comece pela fase 1, por exemplo:
   *"Leia o CLAUDE.md, o docs/04-banco-de-dados.md e o database/README.md.
   Monte o projeto database conforme a fase 1 do roadmap."*
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
