# CLAUDE.md — regras do repositório

Este arquivo é lido pelo Claude Code em toda sessão. Ele resume os padrões
combinados para o projeto. As decisões completas estão em `docs/`.

## O que é

Portfólio acadêmico de um professor de Física + plataforma de aulas por
assinatura. São **três projetos independentes** neste repositório:

| Pasta | Projeto | Papel |
| --- | --- | --- |
| `database/` | Banco de dados | Única fonte da estrutura do MySQL (SQL, Prisma, seed) |
| `admin/` | Painel gerencial (Next.js) | Cadastra tudo que o site exibe |
| `site/` | Site principal (Next.js) | Portfólio, catálogo, aulas, assinatura, fórum |

`admin` e `site` **não conversam entre si**. Os dois usam o mesmo banco por
meio do pacote interno `@portfolio/database` (Prisma Client exportado por
`database/`). Nenhum dos dois define tabelas.

## Como trabalhar

- Trabalhe **um projeto por vez**, na ordem do roadmap (`docs/07-roadmap.md`).
- Antes de criar algo, leia o `CLAUDE.md` e o `README.md` da pasta do projeto.
- **Não invente regra de negócio.** Se algo não estiver em `docs/`, pergunte.
- Mudou o banco? A mudança começa em `database/` (SQL + migração Prisma)
  e só depois chega ao `admin` e ao `site`.
- Não rode comandos destrutivos no banco (DROP, TRUNCATE, `prisma migrate reset`)
  sem pedir confirmação.

## Stack

- Next.js (App Router) + TypeScript em modo `strict` + Tailwind CSS
- Prisma ORM + MySQL 8 (InnoDB, utf8mb4)
- Zod para validar toda entrada (formulários, APIs, webhooks)
- Ícones: `lucide-react`
- Pagamento: **Asaas** (assinatura mensal; Pix, Pix Automático, cartão)
- Vídeo: Bunny Stream (pago) e YouTube (aulas grátis); MP4 por link como alternativa
- E-mail transacional: Resend
- Hospedagem: Vercel (os dois apps) + MySQL gerenciado externo

## Convenções de código

- **Idioma:** código, tabelas, colunas, variáveis e nomes de arquivo em inglês.
  Comentários, textos da interface e mensagens de commit em português.
  Rotas visíveis ao usuário em português (`/aulas`, `/minha-area`).
- **Nomes:** componentes em `PascalCase.tsx`; funções e variáveis em
  `camelCase`; arquivos de utilitário em `kebab-case.ts`; tabelas no plural em
  `snake_case`.
- **Pastas:** componentes agrupados por domínio (`components/player/`,
  `components/forum/`). Componentes genéricos ficam em `components/ui/`.
- **Componentes:** pequenos, sem acesso direto ao banco. Dados vêm de Server
  Components, Server Actions (`actions/`) ou rotas em `app/api/`.
- **Regra de negócio** fica em `lib/` (ex.: `lib/access.ts`), nunca espalhada
  em componentes.
- **Comentários:** toda função exportada tem JSDoc curto dizendo o que faz,
  os parâmetros e o retorno. Comente o *porquê* das decisões, não o óbvio.
- **Simplicidade:** prefira o código mais simples que resolve. Nada de
  abstração antes da segunda repetição.
- **Tipos:** sem `any`. Tipos compartilhados em `types/`.
- **Dinheiro** sempre em centavos (`number` inteiro). Datas em UTC no banco;
  exibição no fuso `America/Manaus`.
- **Segredos** só em variáveis de ambiente (`.env.local`, nunca commitado).
  Cada projeto tem um `.env.example`.
- **Formatação:** ESLint + Prettier. Commits no padrão Conventional Commits
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).

## Segurança (obrigatório)

- Senha do admin com bcrypt. Código de acesso, tokens de sessão: só SHA-256 no banco.
- Cookies `httpOnly`, `Secure`, `SameSite=Lax`.
- Limite: 5 tentativas de código a cada 15 min por IP.
- Webhook do Asaas: validar o token do cabeçalho e **confirmar o pagamento na
  API do Asaas** antes de liberar acesso. Registrar o evento em
  `payment_events` (idempotência).
- Vídeo pago: URL com token que expira em 2 h + marca d'água com nome do aluno.
- PDF: nunca baixável; visualização na plataforma com marca d'água.

## Visual

Tema escuro com a paleta do modelo Jacob (`docs/inspiracoes/01-home-jacob-paleta.png`).
Tokens em `docs/06-interface.md`. Fonte Poppins.
