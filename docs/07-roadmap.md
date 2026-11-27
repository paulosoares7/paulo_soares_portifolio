# 07 — Roadmap

Ordem pelas dependências: banco → painel → sites públicos. Assim os sites já
nascem exibindo dados reais. Cada fase é um pedido separado ao Claude Code.
Só passe para a próxima quando o critério de avanço for cumprido. Para
conferir o que falta, use `docs/prompts/auditoria-e-continuacao.md`.

Status conferido no código em 26/11/2026 (auditoria).

| Fase | Projeto | Entregas | Critério para avançar | Status |
| --- | --- | --- | --- | --- |
| 1 | `database` | Workspace npm, `schema.prisma` equivalente ao `001_schema.sql`, migrações, seed de Física I, `create-admin`, MySQL no Docker, backup. Login dos alunos (Google, e-mail e senha, confirmação, redefinição, sessões), estrutura Categoria → Grupo → Disciplina → Módulo → Tema → Aula, vagas configuráveis, Lattes nas redes, links externos em materiais, foto e currículo | O banco sobe do zero com um comando, já com o seed de Física I | ✅ Feita |
| 2 | `admin` | Login e "esqueci a senha"; perfil e portfólio; publicações (XML Lattes e ORCID com prévia); categorias, grupos, disciplinas, módulos, temas e aulas; vídeos; materiais, foto e currículo por arquivo ou link; atividades; alunos; plano, assinaturas e cortesias; relatórios e gráficos; menu dividido e recolhível; transições; PWA; tema | Física I inteira cadastrada pelo painel, sem SQL manual | 🟡 Falta: tema claro/escuro/sistema (adiado) |
| 3 | `portfolio` + `plataforma` | Portfólio (Home, Sobre, Publicações, Contato, redes, botão Lattes, seção Aulas, foto e currículo com reserva na pasta public); plataforma (catálogo, disciplina, aulas grátis com YouTube, player, login com Google e e-mail/senha, visitante, avatar com menu, minha área, "Sobre o professor", materiais por link com Google Drive embutido); transições; PWA; tema | Aula grátis tocando no celular e no computador | 🟡 Falta: tema claro/escuro/sistema (adiado). Botão do Google pronto, aguardando as credenciais |
| — | Publicação (passo) | TiDB + Vercel em modo pré-lançamento; Vercel Blob opcional para a foto e o currículo | Os três apps no ar com o banco na nuvem | ⏳ Não iniciada |
| 4 | `plataforma` (assinatura) | Assinatura no Asaas ligada à conta do aluno, webhook, vagas e troca, token do player Bunny, marca d'água, visualizador de PDF (R2 privado), cancelamento, Vercel Cron | Assinatura de teste aprovada no sandbox do Asaas e troca de disciplina aplicada na renovação | ⏳ Não iniciada (a página `/assinar` existe só como tela) |
| 5 | `plataforma` + `admin` (comunidade) | Fórum com aprovação, avisos com reações, conquistas, resumo do admin | Post de aluno aprovado no painel e visível na aula | ⏳ Não iniciada (progresso das aulas e a minha área já existem) |
| — | Lançamento (passo) | Vercel Pro, Asaas real (MEI), domínio, política de privacidade (LGPD) | Primeira cobrança real | ⏳ Não iniciado |

Os vídeos reais podem entrar a qualquer momento depois da fase 2, sem mudar
código.

## Pendências adiadas

| Item | Situação | Quando |
| --- | --- | --- |
| Seletor de tema (claro, escuro e sistema) no admin, portfolio e plataforma | Adiado pelo professor. A base está pronta: tokens de cor centralizados em `packages/ui/src/tokens.css` (commit `ae75e55`). Regras em `docs/prompts/auditoria-e-continuacao.md` (seção "REGRAS DO TEMA") | Semana de 30/11/2026 |

## Pendências por credencial

| Funcionalidade | Situação | Credencial |
| --- | --- | --- |
| Botão "Entrar com Google" | Pronta, escondida | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (plataforma) |
| E-mails reais (confirmação, convite, esqueci a senha, contato) | Prontos, mostrados no terminal | `RESEND_API_KEY` (admin, portfolio, plataforma) |
| "Enviar arquivo" (materiais, foto, currículo) | Pronto, desativado; o link externo funciona | `STORAGE_*` do Cloudflare R2 (admin) |

## Melhorias futuras

Depois do lançamento:

- Modo offline dos PDFs enviados (estilo Spotify) — docs/prompts/futuro-pdf-offline.md
