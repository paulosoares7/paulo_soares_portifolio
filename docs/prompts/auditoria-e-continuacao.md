# Auditoria e continuação das fases

> **Quando usar:** agora, para descobrir o que já foi feito e concluir o que falta das fases 1 a 3 (com os ajustes decididos), antes da publicação e das fases 4 e 5.
> **Como chamar:** *Execute o pedido de docs/prompts/auditoria-e-continuacao.md.*

## Mapa das fases (as 5 originais, com os ajustes dentro delas)

| Fase | Nome | Ajustes decididos |
| --- | --- | --- |
| 1 | Banco de dados | Login (Google, e-mail e senha, confirmação, redefinição, sessões); remoção do código de acesso; estrutura Categoria → Grupo → Disciplina → Módulo → Tema → Aula; vagas configuráveis; Lattes nas redes |
| 2 | Painel admin | Menu dividido (Portfólio e Plataforma) com seções recolhíveis e rolagem; alunos (adicionar, editar, excluir ou anonimizar); cortesia como botão de ligar e desligar; editar assinatura; relatórios e gráficos; "esqueci a senha"; materiais, foto e currículo por arquivo ou link; transições; PWA; tema |
| 3 | Sites públicos | Separação em `portfolio` e `plataforma`; redes sociais, botão Lattes e seção Aulas; foto e currículo com reserva na pasta public; login com Google e e-mail/senha; visitante; validação; avatar com menu; dashboard da minha área; "Sobre o professor"; materiais por link (Google Drive embutido); transições; PWA; tema |
| — | Publicação (passo) | TiDB + Vercel, modo pré-lançamento; Vercel Blob opcional para a foto e o currículo |
| 4 | Assinatura | Asaas ligado à conta do aluno, vagas e troca, conteúdo protegido (R2 privado e Bunny), Vercel Cron |
| 5 | Comunidade | Fórum com aprovação, progresso, conquistas |
| — | Lançamento (passo) | Vercel Pro, Asaas real (MEI), domínio, LGPD |

Melhoria futura (depois do lançamento): modo offline dos PDFs enviados, em `docs/prompts/futuro-pdf-offline.md`.

## Pedido

```
Antes de qualquer alteração, quero uma auditoria do projeto. Nesta primeira parte NÃO altere nenhum arquivo, NÃO rode migrações e NÃO faça commits. Só leia e verifique.

## O QUE VERIFICAR
Confira no código, no banco local (schema.prisma e migrações), no histórico do Git (todos os branches) e rodando os projetos, se cada item abaixo está FEITO, PARCIAL ou NÃO FEITO. Para FEITO e PARCIAL, diga onde está (arquivo ou rota). Para PARCIAL, diga o que falta. Não confie só na documentação: confirme no código.

FASE 1 — Banco de dados
1. Tabelas, Prisma, migrações e seed de Física I
2. Tabelas do login: Google, e-mail e senha, confirmação de e-mail, redefinição de senha, sessões com limite por aluno
3. Código de acesso removido
4. Estrutura padronizada: Categoria → Grupo → Disciplina → Módulo → Tema → Aula
5. Quantidade de vagas configurável por plano e por aluno
6. Opção Lattes nas redes sociais
7. Materiais, foto e currículo aceitam arquivo enviado OU link externo (campo external_url ou equivalente)

FASE 2 — Painel admin
1. Cadastros: perfil, publicações, conteúdo, vídeos, materiais, atividades, assinaturas, fórum
2. Menu dividido em "Portfólio" e "Plataforma de aulas"
3. Sidebar com rolagem
4. Seções do menu recolhíveis
5. Alunos: adicionar (com convite), editar, excluir ou anonimizar
6. Cortesia como botão de ligar e desligar, com cor quando ativa
7. Editar assinatura (ícone de lápis nas ações)
8. Relatórios e gráficos com filtro de período e exportação em CSV e PDF
9. "Esqueci a senha" do admin
10. Transições suaves
11. PWA
12. Seletor de tema (claro, escuro e sistema), começando no tema do sistema
13. Materiais: escolher entre "Enviar arquivo" e "Colar link externo", com os avisos e regras do bloco "MATERIAIS, FOTO E CURRÍCULO"
14. Perfil: foto e currículo por arquivo enviado ou por link externo
15. Textos atualizados: nenhum texto falando em "código de acesso" (ex.: "Grátis (visível sem login)")

FASE 3 — Sites públicos
1. Pasta `site` separada em `portfolio` e `plataforma` (e se a pasta `site` ainda existe)
2. Portfolio: home, sobre, publicações, contato
3. Portfolio: ícones de LinkedIn, Lattes, Instagram, Facebook, GitHub, E-mail e Aulas
4. Portfolio: botão "Currículo Lattes" e seção "Aulas"
5. Portfolio: foto e currículo com a prioridade arquivo enviado → link externo → pasta public (public/perfil/foto.jpg e public/perfil/curriculo.pdf)
6. Plataforma: catálogo, disciplinas e aulas
7. Plataforma: login com e-mail e senha, cadastro e confirmação de e-mail
8. Plataforma: botão "Entrar com Google" funcionando (ou o motivo de não aparecer)
9. Plataforma: "esqueci a senha"
10. Plataforma: entrar como visitante
11. Plataforma: validação dos campos vazios no login
12. Plataforma: avatar no header com menu
13. Plataforma: dashboard da minha área (continuar de onde parou, assistidos por último, progresso)
14. Plataforma: página "Sobre o professor"
15. Plataforma: materiais por link externo respeitando as regras de acesso; Google Drive abrindo embutido
16. Transições suaves (portfolio e plataforma)
17. PWA (portfolio e plataforma)
18. Seletor de tema no portfolio e na plataforma (claro, escuro e sistema), começando no tema do sistema

GERAL
1. Testes com Playwright: existem? Quais? Passam?
2. Typecheck e build: rode nos 4 projetos e diga se passam
3. Documentação: o CLAUDE.md e o docs/ estão coerentes com o código?
4. Git: em qual branch estou, se há alterações não salvas e se há branches que ainda não foram juntados ao main
5. Cores: existem cores fixas espalhadas pelo código em vez de tokens centralizados?

CREDENCIAIS (verifique só se EXISTEM e estão preenchidas; NUNCA mostre os valores)
Para cada projeto (database, admin, portfolio, plataforma), confira o .env e o .env.example e diga, para cada variável: presente e preenchida / presente mas vazia / ausente, e se ela está sendo usada no código. Inclua pelo menos:
- DATABASE_URL
- AUTH_SECRET / SESSION_SECRET
- credenciais do Google (ID e chave secreta do cliente)
- RESEND_API_KEY e remetente do e-mail
- BUNNY_* (Library ID, API Key, Token Key)
- STORAGE_* (Cloudflare R2: endpoint, bucket, região "auto", access key e secret key)
- BLOB_READ_WRITE_TOKEN (Vercel Blob, opcional, para foto e currículo do portfolio)
- ASAAS_* (URL, chave e token do webhook)
- CRON_SECRET
- NEXT_PUBLIC_PORTFOLIO_URL e NEXT_PUBLIC_PLATAFORMA_URL
- ORCID_ID
Confira também se algum .env ou chave foi parar no Git por engano (no histórico ou em arquivos versionados).

PRÓXIMAS FASES (só confirme que ainda não foram feitas)
- Publicação (TiDB + Vercel, modo pré-lançamento)
- Fase 4 — Assinatura com Asaas
- Fase 5 — Comunidade

## COMO ME MOSTRAR
1. Uma tabela por fase: item | status (FEITO / PARCIAL / NÃO FEITO) | onde está | o que falta.
2. Uma tabela de credenciais: projeto | variável | situação | usada no código? | necessária para qual item.
3. Os erros encontrados no typecheck, no build ou nos testes.
4. Um resumo final: percentual de conclusão de cada fase.
5. Uma proposta de ordem para concluir o que falta, agrupada em blocos curtos, começando pelo que é base para o resto (banco antes do admin e da plataforma; tokens de cor antes do seletor de tema). Em cada bloco, indique se ele precisa de alguma credencial que ainda está faltando.

## ⛔ PARE
Depois de mostrar a auditoria, pare e me pergunte se pode continuar. Só depois da minha autorização:
- crie um branch para os ajustes;
- atualize primeiro o docs/07-roadmap.md com o status real, mantendo as 5 fases originais (com a publicação e o lançamento como passos) e a seção "Melhorias futuras" com o modo offline dos PDFs;
- faça um bloco de cada vez, rodando typecheck, build e testes ao fim de cada bloco, fazendo um commit por bloco e me pedindo aprovação antes do bloco seguinte.

## 🎨 REGRAS DO TEMA (portfolio, plataforma e admin)
Se o seletor de tema não existir ou estiver parcial, inclua um bloco para ele na proposta de ordem, seguindo estas regras:
1. Três opções: Claro, Escuro e Sistema. Ao abrir pela primeira vez, usar o tema do sistema (prefers-color-scheme).
2. A escolha do usuário fica salva no navegador e vale nas próximas visitas. Se ele escolher "Sistema", acompanhar as mudanças do sistema em tempo real.
3. Sem "piscar" o tema errado ao carregar a página: aplicar o tema antes da primeira pintura (por exemplo, com o next-themes ou um script no <head>).
4. Botão de tema no header do portfolio e da plataforma, no menu do avatar da plataforma e na sidebar do admin, com ícones (sol, lua, monitor) e transição suave na troca.
5. O tema escuro atual (paleta do modelo Jacob) continua como está. Crie a versão clara com os mesmos tons de destaque (ciano), mantendo o contraste mínimo WCAG AA nos textos e botões.
6. Tokens de cor centralizados e usados por todos os componentes (Tailwind com variáveis CSS). Nada de cor fixa espalhada pelo código: se encontrar, troque pelos tokens.
7. A cor da barra do navegador e do PWA (theme-color) acompanha o tema escolhido.
8. Documente as duas paletas no docs/06-interface.md.
9. Testes do Playwright: abrir cada site com o sistema em modo claro e em modo escuro e conferir o tema aplicado; trocar o tema pelo botão e conferir que a escolha continua depois de recarregar.

## 📎 MATERIAIS, FOTO E CURRÍCULO: ARQUIVO OU LINK
Se algo deste bloco não existir ou estiver parcial, inclua um bloco para ele na proposta de ordem, seguindo estas regras:
1. Nos cadastros de material e nos campos de foto e currículo do perfil, oferecer duas formas:
   a) "Enviar arquivo": usa o R2. Se as variáveis do storage não estiverem configuradas, a opção fica desativada com o aviso "Configure o armazenamento para enviar arquivos", sem quebrar a tela.
   b) "Colar link externo": aceita uma URL https (Google Drive, OneDrive, Dropbox ou site).
2. Botão "Testar link", que confere se o endereço responde.
3. Links do Google Drive: converter para o formato de visualização e, na plataforma, abrir o PDF embutido na página, com a opção de abrir em nova aba.
4. Links do Discord: mostrar o aviso "Links de arquivos do Discord expiram e podem parar de funcionar".
5. Com link externo, mostrar o aviso: "Link externo não tem proteção contra pirataria: sem link temporário, sem marca d'água no arquivo e qualquer pessoa com o link pode baixar. Use para materiais grátis."
6. Material pago (sem "Grátis" marcado) com link externo: aviso em destaque e confirmação ao salvar: "Este material é pago, mas está por link externo e não ficará protegido. Deseja salvar mesmo assim?"
7. A frase "PDFs nunca são baixáveis: o site mostra só no visualizador, com marca d'água" aparece só quando houver arquivo enviado.
8. Trocar "Grátis (visível sem código)" por "Grátis (visível sem login)" e corrigir qualquer outro texto que ainda fale em "código de acesso".
9. Nas listas do admin, um ícone indica se o material é arquivo ou link.
10. Na plataforma, material por link respeita as regras de acesso: se for de disciplina paga, só aparece para quem tem acesso.
11. Foto e currículo do portfolio: prioridade arquivo enviado → link externo → pasta public (public/perfil/foto.jpg e public/perfil/curriculo.pdf). Colocar arquivos de exemplo na pasta public e explicar no portfolio/README.md como trocar.
12. Deixar o envio de foto e currículo preparado para o Vercel Blob (BLOB_READ_WRITE_TOKEN) como alternativa ao R2 no portfolio, ativado só se a variável existir.
13. Usar os campos que já existem no banco (external_url). Se faltar algo, criar a migração.

## 📁 REGRAS DOS ARQUIVOS NO R2
1. Imagens públicas (foto de perfil, capas): bucket público com domínio próprio (quando houver), Cache-Control de longa duração e next/image. Até lá, podem sair do bucket privado com URL assinada.
2. PDFs: bucket privado, servidos só por URL assinada de curta duração, com cache privado só no navegador do aluno por 7 dias (Cache-Control: private) e nunca em cache público nem no service worker.
3. Nunca fazer o arquivo passar pelo servidor da Vercel.
4. Token do R2 com permissão "Object Read & Write" restrita ao bucket do projeto e sem filtro de IP.

## 🔑 PROTOCOLO DE CREDENCIAIS (vale para todos os blocos)
Quando um bloco depender de uma credencial que está ausente ou vazia, faça assim:

1. Faça primeiro toda a parte do código que não depende da credencial. O sistema deve funcionar sem ela, de forma segura:
   - botão do Google escondido (com um aviso no terminal, em desenvolvimento, dizendo qual variável falta);
   - e-mails (confirmação, convite, esqueci a senha) mostrados no terminal, em desenvolvimento;
   - envio de arquivos desativado, com uma mensagem clara no admin, e o link externo funcionando normalmente.
2. Antes de seguir para o teste dessa parte, PARE e me mostre um bloco "⏳ AGUARDANDO CREDENCIAL" contendo:
   - qual credencial falta e para que ela serve;
   - o passo a passo para eu conseguir, em português e com os nomes dos menus. Para o Google, inclua: criar o projeto no Google Cloud Console, configurar a tela de consentimento (público externo, meu e-mail como usuário de teste), criar o ID do cliente OAuth do tipo "Aplicativo da Web", e as origens e as URIs de redirecionamento EXATAS deste projeto para o localhost (e quais serão as da produção). Para o R2, inclua: criar o token em "Manage API Tokens" com "Object Read & Write", só no bucket do projeto, sem filtro de IP, e quais valores vão em cada variável;
   - o nome exato da variável e em qual arquivo .env eu devo colocar;
   - as opções que eu tenho: (a) eu coloco a credencial e aviso "pronto"; (b) pular por enquanto.
3. NUNCA me peça para colar chaves, senhas ou segredos aqui na conversa. Eu mesmo coloco no arquivo .env.
4. Quando eu responder "pronto":
   - confira só se a variável existe e está preenchida (sem mostrar o valor);
   - reinicie o projeto e teste a funcionalidade (ex.: o botão do Google aparece e o login funciona; um PDF de teste é enviado e aberto);
   - se der erro (ex.: redirect_uri_mismatch, acesso negado no R2), me explique a causa e o que corrigir.
5. Se eu escolher "pular", deixe a funcionalidade pronta e desativada, registre no docs/07-roadmap.md como "pendente: aguardando credencial X" e siga para o próximo bloco.
6. Segredos que podem ser gerados aleatoriamente (AUTH_SECRET, CRON_SECRET, token do webhook do Asaas): pergunte se pode gerar e gravar direto no .env local. Não mostre o valor.
7. Antes de cada commit, confira se nenhum .env, chave ou segredo está entrando no Git.
```
