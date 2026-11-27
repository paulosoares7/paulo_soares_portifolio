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
| — | Publicação (passo) | TiDB + Vercel em modo pré-lançamento; Vercel Blob opcional para a foto e o currículo. Passo a passo em `docs/guia-publicacao.md` (migrações e seed testados num TiDB v8.5; conexão com TLS via `?sslaccept=strict`) | Os três apps no ar com o banco na nuvem | 🟡 Guia pronto; portfólio e painel primeiro, plataforma depois |
| 4 | `plataforma` (assinatura) | Assinatura no Asaas ligada à conta do aluno, webhook, vagas e troca, token do player Bunny, marca d'água, visualizador de PDF (R2 privado), cancelamento, Vercel Cron | Assinatura de teste aprovada no sandbox do Asaas e troca de disciplina aplicada na renovação | ⏳ Não iniciada (a página `/assinar` existe só como tela) |
| 5 | `plataforma` + `admin` (comunidade) | Fórum com aprovação, avisos com reações, conquistas, resumo do admin | Post de aluno aprovado no painel e visível na aula | ⏳ Não iniciada (progresso das aulas e a minha área já existem) |
| — | Lançamento (passo) | Vercel Pro, Asaas real (MEI), domínio, política de privacidade (LGPD) | Primeira cobrança real | ⏳ Não iniciado |

Os vídeos reais podem entrar a qualquer momento depois da fase 2, sem mudar
código.

## Pendências adiadas (etapa 4)

Adiadas pelo professor; fazer nesta ordem, porque cada uma usa a anterior.
Antes da etapa 4, o Resend (e-mails) já deve estar configurado: a troca de
e-mail, o aviso de conta excluída e os avisos de vencimento dependem dele.
Total estimado: cerca de 12h50.

| Ordem | Item | O que é | Tempo |
| --- | --- | --- | --- |
| 4a | **Cloudflare R2 (armazenamento)** | Configurar as variáveis `STORAGE_*` no `admin/.env.local` (token "Object Read & Write" só no bucket do projeto, sem filtro de IP; regras em `docs/prompts/auditoria-e-continuacao.md`, "REGRAS DOS ARQUIVOS NO R2"). Libera o "Enviar arquivo" dos materiais, da foto e do currículo, e a foto por arquivo do aluno (4c). Testar: enviar e abrir um PDF de teste e uma foto. Sem o R2, o link externo continua funcionando | cerca de 30 min |
| 4b | ✅ **Painel inicial do aluno** (feito em 27/11/2026) | **Problema observado (27/11/2026):** depois do login o aluno volta para a página inicial, que continua pedindo assinatura (o botão "Entrar" leva `?next=` com a página atual, em `lib/safe-next.ts`, e a página inicial não muda para quem está logado). **Como deve ficar:** ao entrar, o aluno cai no **painel dele** (`/minha-area`), a tela de início do aluno, com: o último vídeo assistido ("continuar de onde parou"), dashboard de desempenho (aulas concluídas, progresso por disciplina, atividades feitas e média de acertos, dias de estudo na semana), últimas aulas vistas, situação da assinatura e avisos. Vale para todos, com ou sem assinatura (sem assinatura, o painel mostra o conteúdo grátis). Exceção: quem entrou a partir de uma aula ou atividade volta para ela. A página inicial, para quem está logado, troca a abertura de venda por "Olá, Nome — continuar de onde parou" com atalho para o painel. **Painel vazio** (aluno novo): boas-vindas e "comece por aqui" com aulas grátis sugeridas. **Limite:** o YouTube não informa quanto foi assistido; nas aulas grátis o progresso vem do botão "Aula concluída" (minutos assistidos só nos vídeos pagos, fase 4). **Convite para assinar:** ao abrir a última aula grátis de uma disciplina (e ao tocar numa aula com cadeado), um card ou modal convida para assinar, com o preço do plano vindo do banco. **Feito:** o Início é o próprio painel para quem está logado (sem a apresentação de venda); painel completo para assinante e cortesia, simples com a chamada para assinar para quem não assina; `/minha-area` redireciona para `/`. **Decidido:** o convite aparece ao abrir a última aula grátis (modal uma vez por visita e cartão fixo abaixo do vídeo); o menu do avatar e o do celular chamam a tela de "Painel" | cerca de 4h20 |
| 4c | **Minha conta (extensão do painel, pelo avatar)** | Item **"Minha conta"** no menu do avatar (Painel · Minhas disciplinas · Assinatura · Minha conta · Sair), página `/minha-area/conta`. Perfil: nome, nome no fórum, foto (Google, link ou arquivo pelo R2). Login e segurança: troca de senha (ou criar senha), troca de e-mail com confirmação no e-mail novo (quem só entra com Google precisa criar uma senha antes de trocar o e-mail), aparelhos conectados (encerrar um ou todos). **Baixar meus dados** (LGPD): arquivo com perfil, progresso, atividades e pagamentos. **Excluir conta**, só pelo próprio aluno (o sistema nunca exclui ninguém sozinho): sem pagamentos, apaga; com pagamentos, anonimiza ("Aluno removido", RN14); posts do fórum ficam como "Aluno removido"; assinatura ativa é cancelada antes; e-mail de aviso. **A confirmar:** confirmação digitando o e-mail (e a senha, se tiver); sem volta atrás ou 30 dias de espera | cerca de 3h45 |
| 4d | **Carência de 10 dias e versão gratuita** | Quem não paga não perde a conta: até 10 dias depois do vencimento, acesso completo com aviso no painel "pagamento atrasado: faltam X dias"; depois, a conta fica limitada ao conteúdo grátis (login, progresso e histórico continuam) até pagar de novo, e o painel mostra o convite para assinar (4b). Cortesia que termina segue a mesma regra, sem os 10 dias. E-mails de aviso: no vencimento e 3 dias antes de limitar. Muda a visão `v_student_course_access` (migração), avisos no painel e estado no admin; atualizar RN04 e RN05. Funciona já para as assinaturas do painel; com o Asaas (fase 4), vale para os pagamentos reais sem mudar a regra. **A confirmar:** 10 dias fixos ou campo no plano; guardar as disciplinas escolhidas para quando voltar a pagar (sugestão: sim) | cerca de 2h45 |
| 4e | **Seletor de tema** (claro, escuro e sistema) no admin, portfolio e plataforma | Base pronta: tokens de cor em `packages/ui/src/tokens.css` (commit `ae75e55`). Regras em `docs/prompts/auditoria-e-continuacao.md` ("REGRAS DO TEMA"). O botão de tema entra também no menu do avatar | 1h30 a 2h |

Em todas: testes do Playwright e documentação junto (requisitos no `docs/02`,
fluxos no `docs/05`, páginas no `docs/06`).

## Portfólio antes da plataforma

O portfólio pode ir ao ar sozinho. Enquanto `NEXT_PUBLIC_PLATAFORMA_URL`
estiver vazia, todos os links "Aulas" (menu, ícone, rodapé e seção da home)
levam à página `/aulas` com o aviso "Aulas em desenvolvimento" (27/11/2026).
Quando a plataforma for publicada: preencher a variável na Vercel com o
endereço dela e publicar o portfólio de novo. Nada no código muda.

## Pendências por credencial

| Funcionalidade | Situação | Credencial |
| --- | --- | --- |
| Botão "Entrar com Google" | ✅ Configurado no desenvolvimento (27/11/2026). Na publicação: acrescentar no Google Cloud a origem e o endereço de retorno `https://…/api/auth/callback/google` do site no ar, pôr as duas variáveis na Vercel e publicar o app na tela de consentimento | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (plataforma) |
| E-mails reais (confirmação, convite, esqueci a senha, contato) | Prontos, mostrados no terminal | `RESEND_API_KEY` (admin, portfolio, plataforma) |
| "Enviar arquivo" (materiais, foto, currículo) | Pronto, desativado; o link externo funciona. **Adiado para a etapa 4a** | `STORAGE_*` do Cloudflare R2 (admin) |

## Melhorias futuras

Depois do lançamento:

- Modo offline dos PDFs enviados (estilo Spotify) — docs/prompts/futuro-pdf-offline.md
