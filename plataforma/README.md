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
cp plataforma/.env.example plataforma/.env.local   # preencha DATABASE_URL e BETTER_AUTH_SECRET
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
| `/entrar`, `/cadastrar` | RF13 | Google ou e-mail e senha; volta para `?next=` |
| `/esqueci-a-senha`, `/redefinir-senha` | RF13 | Link por e-mail (1 h, uso único); encerra as sessões |
| `/confirmar-email` | RF13 | Destino do link de confirmação do cadastro |
| `/minha-area` | RF15 | Disciplinas da assinatura, formas de entrar, aparelhos e sair (versão inicial) |

## Login dos alunos

Better Auth (`src/lib/auth.ts`, rotas em `/api/auth/*`), com as tabelas do
projeto `database` (`student_accounts`, `student_sessions`,
`auth_verifications`, `auth_rate_limits`).

- **Google:** só aparece com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
  Se o e-mail já tem conta, o Google entra nela. Se o e-mail ainda não estava
  confirmado, a senha antiga é apagada (pode ter sido criada por outra pessoa).
- **E-mail e senha:** só entra quem confirmou o e-mail. Cadastro com e-mail já
  existente responde igual a um novo (o dono recebe um aviso por e-mail).
- **Limites:** 5 erros de login a cada 15 min por IP e por e-mail
  (`src/lib/login-limit.ts`); o Better Auth ainda limita cadastro e pedidos de
  link a 5 a cada 15 min e o login a 3 a cada 10 s.
- **Sessões:** no máximo 2 por aluno (a mais antiga cai); 30 dias.
- **Sem Resend** (`RESEND_API_KEY` vazio) em desenvolvimento, os e-mails e
  links aparecem no terminal do `npm run dev`.
- Aluno de teste do seed: `aluno.demo@exemplo.com` / `AlunoDemo2026`.

## Acesso ao conteúdo

Toda decisão passa por `src/lib/access.ts`:

- item grátis (`is_preview`) → abre para todos;
- demais → só se a disciplina estiver em `v_student_course_access` para o aluno logado;
- visitante sem login numa aula ou atividade paga vai para `/entrar` e volta depois.

Para quem não tem acesso, o servidor não envia link nem ID do vídeo, nem os
enunciados e gabaritos das atividades: **só as aulas grátis tocam; as pagas
aparecem com cadeado**. PDF nunca vira link de download (RN12).

## Textos da página inicial

Ficam em `src/content/home.ts` (abertura, como funciona, o que está incluído e
chamada final). Preço, limite de disciplinas, grupos, aulas grátis e o resumo
do professor vêm do banco.
