# site — Projeto 3 (site principal)

Next.js 16 (App Router) + TypeScript strict + Tailwind 4. Portfólio acadêmico +
plataforma de aulas por assinatura. Acesso ao banco só por `@portfolio/database`.

Requisitos: RF01 a RF21 em [`../docs/02-requisitos.md`](../docs/02-requisitos.md).
Páginas: [`../docs/06-interface.md`](../docs/06-interface.md). Fluxos:
[`../docs/05-fluxos.md`](../docs/05-fluxos.md).

## Rodar

Pré-requisito: o banco ligado (`npm run db:up` na raiz; veja `database/README.md`).

```bash
cp site/.env.example site/.env.local   # e preencha DATABASE_URL
npm install                             # na raiz do repositório
npm run site:dev                        # http://localhost:3000
```

| Comando (dentro de `site/`) | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento na porta 3000 |
| `npm run build` / `npm start` | Build e servidor de produção (porta 3000) |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## Status por fase

| Fase | Entregue |
| --- | --- |
| 3 — público | Home, Sobre, Publicações, Contato, catálogo, disciplina (abas), aula com player, atividade grátis, sitemap e robots |
| 4 — assinatura | `/assinar` e `/entrar` hoje são informativas; Asaas, código, minha área, player Bunny, PDF com marca d'água chegam aqui |
| 5 — comunidade | Fórum com postagem, progresso, conquistas |

## Páginas da fase 3

| Rota | Requisito | O que mostra |
| --- | --- | --- |
| `/` | RF01 | Apresentação no estilo Jacob, números de destaque, publicações em destaque, chamada para as aulas |
| `/sobre` | RF02 | Bio, áreas de pesquisa, formação e atuação em linha do tempo, ferramentas |
| `/publicacoes` | RF03 | Busca por título, filtros por tipo e ano, destaques, DOI |
| `/contato` | RF04 | Formulário salvo em `contact_messages` (aparece no painel), aviso por e-mail via Resend |
| `/aulas`, `/aulas/[seção]` | RF05 | Seções do catálogo e cartões de disciplina com selo de aulas grátis |
| `/disciplina/[slug]?aba=` | RF06 | Abas Aulas, Atividades, Materiais e Fórum (avisos) |
| `/disciplina/[curso]/[módulo]/[aula]` | RF07, RF08 | Player grande, aulas do módulo ao lado, texto de apoio, materiais |
| `/atividades/[id]` | RF08 | Atividade grátis com correção no servidor (RN16) |

## Acesso ao conteúdo

Toda decisão passa por `src/lib/access.ts`:

- item grátis (`is_preview`) → abre para todos;
- demais → só se a disciplina estiver em `v_student_course_access` para o aluno logado.

Até a fase 4 não há entrada com código, então todo visitante é anônimo: **só
as aulas grátis tocam; as pagas aparecem com cadeado**. Para quem não tem
acesso, o servidor não envia link nem ID do vídeo, nem os enunciados e
gabaritos das atividades. PDF nunca vira link de download (RN12).

## Conteúdo que vem do painel

- **Ferramentas (página Sobre):** lidas de `site_settings`, chave `tools`, no
  formato `["GeoGebra", "PhET", "Tracker"]`. Sem a chave, a seção não aparece.
  O painel ainda não edita `site_settings`.
- **Vídeos grátis:** links do YouTube cadastrados no painel (o seed usa
  `SEU_VIDEO_ID_*`, que o YouTube mostra como indisponível até ser trocado).
- **Foto e currículo:** precisam do storage configurado no painel e de
  `STORAGE_PUBLIC_URL` (sem foto, a home mostra uma órbita com as iniciais).
