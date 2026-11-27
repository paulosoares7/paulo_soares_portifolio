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
| 3 | `portfolio` + `plataforma` | Portfólio (Home, Sobre, Publicações, Contato, redes, botão Lattes, seção Aulas, foto e currículo com reserva na pasta public); plataforma (catálogo, disciplina, aulas grátis com YouTube, player, login com Google e e-mail/senha, visitante, avatar com menu, minha área, "Sobre o professor", materiais por link com Google Drive embutido); transições; PWA; tema | Aula grátis tocando no celular e no computador | 🟡 Falta: tema claro/escuro/sistema (adiado). Google configurado no desenvolvimento |
| — | Publicação (passo) | TiDB + Vercel em modo pré-lançamento; Vercel Blob opcional para a foto e o currículo | Os três apps no ar com o banco na nuvem | ⏳ Não iniciada |
| 4 | `plataforma` (assinatura) | Assinatura no Asaas ligada à conta do aluno, webhook, vagas e troca, token do player Bunny, marca d'água, visualizador de PDF (R2 privado), cancelamento, Vercel Cron | Assinatura de teste aprovada no sandbox do Asaas e troca de disciplina aplicada na renovação | ⏳ Não iniciada (a página `/assinar` existe só como tela) |
| 5 | `plataforma` + `admin` (comunidade) | Fórum com aprovação, avisos com reações, conquistas, resumo do admin | Post de aluno aprovado no painel e visível na aula | ⏳ Não iniciada (progresso das aulas e a minha área já existem) |
| — | Lançamento (passo) | Vercel Pro, Asaas real (MEI), domínio, política de privacidade (LGPD) | Primeira cobrança real | ⏳ Não iniciado |

Os vídeos reais podem entrar a qualquer momento depois da fase 2, sem mudar
código.

## Pendências adiadas

| Item | Situação | Quando |
| --- | --- | --- |
| Bloco 4a — Seletor de tema (claro, escuro e sistema) no admin, portfolio e plataforma | Adiado pelo professor. A base está pronta: tokens de cor centralizados em `packages/ui/src/tokens.css` (commit `ae75e55`). Regras em `docs/prompts/auditoria-e-continuacao.md` (seção "REGRAS DO TEMA"). Cerca de 1h30 a 2h | Semana de 30/11/2026 ou depois |
| Bloco 4b — Configurações da conta do aluno | Página `/minha-area/conta` e item "Configurações da conta" no menu do avatar: nome, nome no fórum, foto (Google, link; arquivo quando o R2 estiver ligado), troca de senha (ou criar senha), troca de e-mail com confirmação no e-mail novo, aparelhos conectados (encerrar um ou todos). Cerca de 2h15 | Junto com o 4a |
| Bloco 4c — Excluir conta (só pelo próprio aluno) | O sistema nunca exclui ninguém sozinho. Sem pagamentos: apaga; com pagamentos: anonimiza ("Aluno removido", RN14); posts do fórum ficam como "Aluno removido"; assinatura ativa é cancelada antes; e-mail de aviso. **A confirmar:** confirmação digitando o e-mail (e a senha, se tiver); sem volta atrás ou 30 dias de espera. Cerca de 45 min | Junto com o 4a |
| Bloco 4d — Carência de 10 dias e versão gratuita | Quem não paga não perde a conta: até 10 dias depois do vencimento, acesso completo com aviso "pagamento atrasado: faltam X dias"; depois, a conta fica limitada ao conteúdo grátis (login, progresso e histórico continuam) até pagar de novo. Muda a visão `v_student_course_access` (migração), avisos na Minha área e estado no admin; atualizar RN04 e RN05. **A confirmar:** 10 dias fixos ou campo no plano; guardar as disciplinas escolhidas para quando voltar a pagar (sugestão: sim). Cerca de 2h | Junto com o 4a |

## Pendências por credencial

| Funcionalidade | Situação | Credencial |
| --- | --- | --- |
| Botão "Entrar com Google" | ✅ Configurado no desenvolvimento (27/11/2026). Na publicação: acrescentar no Google Cloud a origem e o endereço de retorno `https://…/api/auth/callback/google` do site no ar, pôr as duas variáveis na Vercel e publicar o app na tela de consentimento | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (plataforma) |
| E-mails reais (confirmação, convite, esqueci a senha, contato) | Prontos, mostrados no terminal | `RESEND_API_KEY` (admin, portfolio, plataforma) |
| "Enviar arquivo" (materiais, foto, currículo) | Pronto, desativado; o link externo funciona | `STORAGE_*` do Cloudflare R2 (admin) |

## Melhorias futuras

Depois do lançamento:

- Modo offline dos PDFs enviados (estilo Spotify) — docs/prompts/futuro-pdf-offline.md
