# plataforma — plataforma de aulas

Next.js 16 (App Router) + TypeScript strict + Tailwind 4. Catálogo de Física
(Vestibulares, Ensino Médio, Ensino Superior e Concursos), disciplinas, aulas,
atividades, login dos alunos e assinatura. Acesso ao banco só por
`@portfolio/database`; tema e componentes comuns em `@portfolio/ui`.

Requisitos: RF05 a RF21 em [`../docs/02-requisitos.md`](../docs/02-requisitos.md).
Visual: [`../docs/06-interface.md`](../docs/06-interface.md).

## Rodar

Pré-requisito: o banco ligado (`npm run db:up` na raiz; veja `database/README.md`).

```bash
cp plataforma/.env.example plataforma/.env.local   # e preencha DATABASE_URL
npm install                                         # na raiz do repositório
npm run plataforma:dev                              # http://localhost:3002
```

| Comando (dentro de `plataforma/`) | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento na porta 3002 |
| `npm run build` / `npm start` | Build e servidor de produção (porta 3002) |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## Páginas

| Rota | Requisito | O que mostra |
| --- | --- | --- |
| `/` | — | Apresentação: abertura, como funciona, grupos, aulas grátis, o que está incluído, plano, resumo do professor, disciplinas e chamada final |
| `/aulas`, `/aulas/[seção]` | RF05 | Seções do catálogo e cartões de disciplina com selo de aulas grátis |
| `/disciplina/[slug]?aba=` | RF06 | Abas Aulas, Atividades, Materiais e Fórum (avisos) |
| `/disciplina/[curso]/[módulo]/[aula]` | RF07, RF08 | Player, aulas do módulo ao lado, texto de apoio, materiais |
| `/atividades/[id]` | RF08, RF17 | Atividade com correção no servidor (RN16) |
| `/sobre-o-professor` | — | Resumo do perfil, números, redes sociais, Lattes e link para o portfólio |
| `/assinar` | RF09 | Plano e preço (o pagamento pelo Asaas chega na fase 4) |

## Acesso ao conteúdo

Toda decisão passa por `src/lib/access.ts`:

- item grátis (`is_preview`) → abre para todos;
- demais → só se a disciplina estiver em `v_student_course_access` para o aluno logado.

Para quem não tem acesso, o servidor não envia link nem ID do vídeo, nem os
enunciados e gabaritos das atividades: **só as aulas grátis tocam; as pagas
aparecem com cadeado**. PDF nunca vira link de download (RN12).

## Textos da página inicial

Ficam em `src/content/home.ts` (abertura, como funciona, o que está incluído e
chamada final). Preço, limite de disciplinas, grupos, aulas grátis e o resumo
do professor vêm do banco.
