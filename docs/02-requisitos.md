# 02 — Engenharia de requisitos

Prioridade (MoSCoW): **Must** = obrigatório na v1 · **Should** = desejável
na v1 · **Could** = pode ficar para a v2.

## Atores

| Ator | Quem é | O que faz |
| --- | --- | --- |
| Visitante | Qualquer pessoa sem assinatura (com ou sem conta) | Vê portfólio, publicações, catálogo e as aulas grátis; assina |
| Assinante | Aluno logado com assinatura vigente | Assiste às aulas das disciplinas das suas vagas (padrão 3), faz atividades, posta no fórum |
| Administrador | O professor (único) | Gerencia conteúdo, assinaturas, alunos e fórum |
| Asaas | Sistema externo | Gera as cobranças mensais e avisa pagamentos por webhook |

## Requisitos funcionais

### Site (portfólio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF01 | Home com foto, nome, título, bio curta, botões "Fale comigo" e "Ver currículo", ícones sociais e faixa de números de destaque | Must |
| RF02 | Página Sobre com formação, atuação profissional, áreas de pesquisa e ferramentas | Must |
| RF03 | Página Publicações com filtro por tipo e ano, busca por título, link do DOI e destaques | Must |
| RF04 | Formulário de contato salvo no banco, com aviso por e-mail | Should |

### Site (plataforma de aulas)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF05 | Catálogo dividido em Vestibulares, Ensino Médio, Ensino Superior e Concursos, com cartões de disciplina (ícone, cor e, se assinante, progresso) | Must |
| RF06 | Página da disciplina com abas **Aulas**, Atividades, Materiais e Fórum; aulas organizadas em módulos, temas e aulas | Must |
| RF07 | Página da aula com player, resumo, materiais da aula e comentários; selo "vídeo em breve" quando a aula ainda não tem vídeo | Must |
| RF08 | Aulas grátis (vídeos do YouTube) e atividades grátis abertas sem assinatura, na quantidade que o professor definir por disciplina (padrão: 2 aulas + 1 atividade) | Must |
| RF09 | Assinar: informar nome, e-mail e CPF, escolher Pix, Pix Automático ou cartão e pagar a 1ª mensalidade no Asaas | Must |
| RF10 | Após a confirmação do 1º pagamento, liberar as disciplinas na conta do aluno e avisar por e-mail | Must |
| RF11 | Escolher as disciplinas das vagas da assinatura (padrão 3, configurável no plano e por aluno); vagas vazias são preenchidas na hora | Must |
| RF12 | Agendar a troca de uma disciplina ocupada; a troca vale na renovação; só uma troca agendada por ciclo; pode cancelar o agendamento | Must |
| RF13 | Criar conta e entrar com Google ou com e-mail e senha (confirmação do e-mail por link); até 2 sessões ativas; sair | Must |
| RF14 | Esqueci a senha: link por e-mail válido por 1 hora e de uso único; ao redefinir, todas as sessões são encerradas | Must |
| RF15 | Painel do aluno (`/minha-area`), a tela de início depois do login, com ou sem assinatura: avisos da assinatura, números de desempenho (aulas concluídas, disciplinas em estudo, média de acertos, dias de estudo nos últimos 7 dias), "continuar de onde parou", últimas aulas, progresso por disciplina, atividades recentes, disciplinas da assinatura, próxima cobrança, link da fatura e troca agendada. Aluno novo vê boas-vindas com aulas grátis para começar; quem não assina vê o convite para assinar. A página inicial, para quem está logado, mostra "Olá, Nome" com o continuar de onde parou | Must |
| RF15a | Convite para assinar: ao abrir a última aula grátis de uma disciplina, quem não tem a disciplina na assinatura vê um modal (uma vez por visita) e um cartão fixo abaixo do vídeo, com o preço do plano vindo do banco. A aula com cadeado mostra o mesmo preço | Must |
| RF16 | Cancelar a assinatura pela minha área (acesso segue até o fim do período pago) | Must |
| RF17 | Atividades com correção automática (múltipla escolha e numérica com tolerância), resolução conforme a regra da atividade e histórico de tentativas | Must |
| RF18 | Materiais (PDF) exibidos só dentro da plataforma, com marca d'água e sem botão de download | Must |
| RF19 | Fórum: abrir dúvida ou discussão na aula, responder e reagir (curtir, amei, comemorar); post do aluno aparece só após aprovação; avisos fixados no topo | Should |
| RF20 | Registrar o progresso do vídeo (posição e conclusão) | Should |
| RF21 | Conquistas na minha área (sequência de dias, atividades concluídas) | Could |

### Admin

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF22 | Login do administrador com e-mail e senha | Must |
| RF23 | Cadastro do perfil, números de destaque, redes sociais, formação, atuação e áreas de pesquisa | Must |
| RF24 | Cadastro de publicações; importação do XML do Lattes e sincronização com o ORCID, sempre com prévia antes de gravar; histórico de importações | Must |
| RF25 | Cadastro de categorias, disciplinas, módulos, temas e aulas, com reordenação por arrastar | Must |
| RF26 | Vídeos: envio direto ao Bunny com barra de progresso e status, ou cadastro de link (YouTube, Vimeo, MP4); vínculo com a aula | Must |
| RF27 | Materiais: envio de PDF e marcação de "grátis" | Must |
| RF28 | Atividades e questões com editor que aceita LaTeX, gabarito, tolerância, marcação de "grátis" e correção manual de questões abertas | Must |
| RF29 | Plano e preço; lista de assinaturas e cobranças; assinatura de cortesia; encerramento de sessões e envio de link de redefinição de senha ao aluno | Must |
| RF30 | Fila de aprovação do fórum, avisos e marcação de resposta oficial | Should |
| RF31 | Caixa de mensagens de contato | Should |
| RF32 | Resumo inicial: assinantes ativos, receita do mês, posts aguardando aprovação; gráficos com filtro de período e página de relatórios com exportação em CSV e PDF | Could |

### Database

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF33 | Schema, migrações versionadas, seed, script de criação do admin e rotina de backup | Must |

## Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF01 | Next.js (App Router), TypeScript strict e Tailwind; componentes por domínio; funções exportadas com JSDoc |
| RNF02 | Responsivo (mobile first); nota mínima 90 no Lighthouse em desempenho e acessibilidade nas páginas públicas |
| RNF03 | Segurança: segredos só em hash; cookies httpOnly/Secure/SameSite=Lax; 5 tentativas de login a cada 15 min por IP e por e-mail; Zod em toda entrada; webhook validado e pagamento confirmado na API do Asaas |
| RNF04 | Conteúdo pago: token de vídeo de 2 h, marca d'água dinâmica, sem download de vídeo nem de PDF |
| RNF05 | LGPD: política de privacidade, consentimento na assinatura e anonimização do aluno a pedido |
| RNF06 | SEO: metadados, sitemap, páginas públicas renderizadas no servidor |
| RNF07 | Backup diário do MySQL, retenção de 7 dias |
| RNF08 | Interface em pt-BR; datas no fuso America/Manaus |
| RNF09 | ESLint, Prettier, Conventional Commits e README em cada projeto |
| RNF10 | Compatível com a Vercel: funções serverless, sem processo rodando em segundo plano (tarefas agendadas via Vercel Cron) |

## Regras de negócio

| ID | Regra |
| --- | --- |
| RN01 | Cada aluno tem uma conta por e-mail. Entrar com Google usando um e-mail já cadastrado vincula à mesma conta. Login com senha exige e-mail confirmado. |
| RN02 | A assinatura começa `pending`. Com o 1º pagamento confirmado na API do Asaas, vira `active`, o período vai até a próxima data de cobrança, e as disciplinas são liberadas na conta do aluno. |
| RN03 | A cada pagamento confirmado, `current_period_end` avança um ciclo. |
| RN04 | Uma aula paga está acessível se a disciplina estiver numa vaga da assinatura e `current_period_end` estiver no futuro (visão `v_student_course_access`). |
| RN05 | Cobrança vencida: a assinatura vira `past_due` e mantém o acesso até o fim do período pago; depois, `expired`. |
| RN06 | Cancelamento: acesso até o fim do período pago, sem novas cobranças. Estorno encerra o acesso na hora. |
| RN07 | Vagas: o plano define de 1 a 10 (padrão 3) e o painel pode dar uma exceção por aluno; o banco garante o teto de 10 e o código, o limite do plano/aluno. Reduzir o limite não apaga disciplinas: a vaga a mais sai na renovação. Vaga vazia: preenchida na hora. Vaga ocupada: uma troca por ciclo, agendada com `effective_at` = fim do período e aplicada na renovação. |
| RN08 | Ao abrir uma 3ª sessão na mesma conta, a sessão mais antiga é encerrada. |
| RN09 | Cada evento do webhook é processado uma única vez (`payment_events`). |
| RN10 | Grátis por disciplina: o professor define no cadastro da disciplina o máximo de aulas grátis (sempre com vídeo do YouTube) e de atividades grátis, abertas sem assinatura. Padrão: 2 aulas + 1 atividade; campo vazio = sem limite. Reduzir o limite não desmarca o que já é grátis: só impede marcar novas. |
| RN11 | Aula sem vídeo aparece com o selo "vídeo em breve" e mantém materiais e fórum. |
| RN12 | PDF nunca é baixável. |
| RN13 | Post de aluno entra como `pending` e só aparece após aprovação. Só assinantes da disciplina postam; visitantes leem os avisos. |
| RN14 | Disciplina com assinantes não é apagada, é arquivada. Aluno não é apagado, é anonimizado. |
| RN15 | Importação de publicações mostra o que é novo e o que mudou; o admin escolhe o que gravar. Duplicatas entre Lattes e ORCID são apontadas pelo DOI. |
| RN16 | Resposta numérica correta quando a diferença para o gabarito é no máximo a tolerância (%) do valor do gabarito. |
