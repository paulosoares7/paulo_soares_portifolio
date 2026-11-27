# Guia de publicação (TiDB Cloud + Vercel)

Passo a passo para pôr no ar o **banco de dados** (TiDB Cloud), o
**portfólio**, o **painel (admin)** e, quando for a hora, a **plataforma de
aulas**. Cada app vira um projeto separado na Vercel, todos ligados ao mesmo
repositório do GitHub e ao mesmo banco.

Ordem recomendada agora (pré-lançamento, sem cobrança):

1. Banco no TiDB Cloud (parte A)
2. Portfólio na Vercel (parte B)
3. Painel na Vercel (parte C)
4. Plataforma: mais tarde (parte D). Até lá, o portfólio mostra "Aulas em
   desenvolvimento" (variável `NEXT_PUBLIC_PLATAFORMA_URL` vazia).

> **Regra de ouro:** senhas e chaves só nos campos do TiDB e da Vercel e no
> seu terminal. Nunca no código, no GitHub ou na conversa com o Claude.

Testado antes de escrever este guia (27/11/2026): os três apps compilam com
`next build`, e todas as migrações e o seed rodam num TiDB v8.5 (a mesma
versão do TiDB Cloud).

---

## A. Banco de dados no TiDB Cloud (grátis)

O TiDB Cloud é compatível com MySQL e tem um plano gratuito, com uma cota
mensal de armazenamento e de uso que sobra para o pré-lançamento (confira os
números atuais na página de preços do TiDB).

1. Entre em **https://tidbcloud.com** e crie a conta (pode ser com o Google
   ou o GitHub).
2. Crie um cluster **Starter** (o gratuito):
   - **Cloud provider:** AWS.
   - **Region:** **N. Virginia (us-east-1)**. É a mesma região padrão das
     funções da Vercel (Washington, `iad1`), então o site e o banco ficam
     perto um do outro e as páginas abrem mais rápido.
   - **Nome:** `portfolio` (ou o que quiser).
3. Com o cluster criado, abra **SQL Editor** (ou **Chat2Query**) e rode:

   ```sql
   CREATE DATABASE portfolio;
   ```

4. Clique em **Connect** (botão no topo do cluster):
   - **Connect With:** _General_ (ou _Prisma_).
   - Clique em **Generate Password** e **guarde a senha** num lugar seguro
     (gerenciador de senhas). Ela só aparece uma vez.
   - Anote o **HOST** (algo como `gateway01.us-east-1.prod.aws.tidbcloud.com`),
     a **PORT** (`4000`) e o **USER** (algo como `abc123XYZ.root`).
5. Monte a sua `DATABASE_URL` (troque as partes em MAIÚSCULAS):

   ```
   mysql://USER:SENHA@HOST:4000/portfolio?sslaccept=strict
   ```

   - O `?sslaccept=strict` no fim é **obrigatório**: liga a conexão
     criptografada que o TiDB Cloud exige (o código do projeto lê esse
     parâmetro; veja `database/src/index.ts`).
   - Se a senha tiver símbolos (`@`, `#`, `/`, `:`...), gere outra só com
     letras e números, para não precisar codificar a URL.

6. **Criar as tabelas, os dados iniciais e o seu login do painel.** No seu
   computador, abra o terminal (Git Bash) na pasta do projeto e rode, um de
   cada vez, **colando a sua URL no lugar de `SUA_URL`** (o comando fica só
   no seu terminal):

   ```bash
   cd database
   export DATABASE_URL='SUA_URL'
   npx prisma migrate deploy        # cria todas as tabelas e a visão
   npm run seed                     # perfil, catálogo e Física I de exemplo, plano
   npm run create-admin -- --email seu@email.com --name "Seu Nome"
   unset DATABASE_URL               # volta ao banco local
   ```

   - O `create-admin` pede a senha do painel sem mostrar na tela.
   - O seed traz textos marcados com **[EXEMPLO]** (perfil, números, uma
     publicação) e um aluno de demonstração: troque ou apague pelo painel
     depois de publicar. Se preferir levar para o banco online o que você já
     cadastrou no computador, peça ao Claude: dá para copiar o banco local
     para o TiDB.

7. Confira: no **SQL Editor** do TiDB, `SHOW TABLES FROM portfolio;` deve
   listar as tabelas (`courses`, `lessons`, `profile`...).

---

## B. Portfólio na Vercel

1. Entre em **https://vercel.com** com a sua conta do **GitHub** (plano
   **Hobby**, gratuito; o Pro só é necessário antes de começar a cobrar).
2. **Add New… → Project → Import** o repositório `portfolio-academico`.
   (Se ele não aparecer: _Adjust GitHub App Permissions_ e libere o
   repositório.)
3. Na tela de configuração:
   - **Project Name:** `portfolio` (vira `portfolio-xxxx.vercel.app`).
   - **Framework Preset:** Next.js (detectado sozinho).
   - **Root Directory:** clique em _Edit_ e escolha **`portfolio`**.
   - **Build and Output Settings:** deixe como está. A Vercel instala as
     dependências do repositório inteiro (npm workspaces) e o
     `prisma generate` roda sozinho na instalação.
4. **Environment Variables** (abra a seção antes de clicar em _Deploy_):

   | Nome                          | Valor                                                             |
   | ----------------------------- | ----------------------------------------------------------------- |
   | `DATABASE_URL`                | a URL do passo A.5                                                |
   | `NEXT_PUBLIC_SITE_URL`        | por enquanto `https://portfolio.vercel.app`; ajuste no passo 6    |
   | `NEXT_PUBLIC_PLATAFORMA_URL`  | **deixe sem criar** (ou vazia): mostra "Aulas em desenvolvimento" |
   | `RESEND_API_KEY`, `MAIL_FROM` | opcionais: aviso por e-mail de nova mensagem de contato           |

5. Clique em **Deploy** e espere (2 a 4 minutos).
6. Ao terminar, copie o endereço final (ex.: `https://portfolio-abc.vercel.app`),
   vá em **Settings → Environment Variables**, corrija
   `NEXT_PUBLIC_SITE_URL` com esse endereço e faça **Deployments → ⋯ →
   Redeploy**. As variáveis `NEXT_PUBLIC_*` entram no site na hora da
   compilação, por isso o redeploy.
7. **Região das funções:** Settings → Functions → **Function Region** =
   _Washington, D.C., USA (iad1)_ (o padrão; mantém o site perto do banco).

Dica: em **Settings → Domains** você liga um domínio próprio quando tiver
(ex.: `professorpaulo.com.br`). Depois de trocar, atualize o
`NEXT_PUBLIC_SITE_URL` e faça o redeploy.

---

## C. Painel (admin) na Vercel

Mesmo processo, outro projeto:

1. **Add New… → Project → Import** o mesmo repositório.
2. **Project Name:** `admin` (ou `painel`). **Root Directory:** **`admin`**.
3. **Environment Variables:**

   | Nome                          | Valor                                                                                                                                                           |
   | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`                | a mesma URL do passo A.5                                                                                                                                        |
   | `SESSION_SECRET`              | uma sequência aleatória longa (veja abaixo)                                                                                                                     |
   | `ADMIN_URL`                   | endereço do painel, usado no link do "Esqueci a senha" (ajuste depois do 1º deploy, como no B.6)                                                                |
   | `PLATAFORMA_URL`              | endereço da plataforma; por enquanto pode ficar sem criar (só é usado pelo botão "Enviar link de senha" da página do aluno, que gera um link para a plataforma) |
   | `BETTER_AUTH_SECRET`          | outra sequência aleatória; **guarde**: a plataforma vai usar **a mesma**                                                                                        |
   | `ORCID_ID`                    | opcional: o seu ORCID, para a sincronização de publicações                                                                                                      |
   | `RESEND_API_KEY`, `MAIL_FROM` | opcionais: e-mails de "esqueci a senha" e convites                                                                                                              |
   | `STORAGE_*`                   | só quando o Cloudflare R2 for configurado (etapa 4a); sem eles, use links externos                                                                              |

   Para gerar as sequências aleatórias, rode no seu terminal (uma vez para
   cada segredo) e cole o resultado no campo da Vercel:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

4. **Deploy**, depois corrija o `ADMIN_URL` e faça **Redeploy**.
5. Entre no painel com o e-mail e a senha do passo A.6 (`create-admin`) e
   troque os textos **[EXEMPLO]** pelo seu conteúdo.

Segurança do painel no ar: o login já tem limite de 5 erros a cada 15 min,
cookie `Secure`/`httpOnly` e sessão com hash no banco. Não divulgue o
endereço do painel; ele não aparece em nenhum link do portfólio.

---

## D. Plataforma de aulas (quando for publicar)

1. Novo projeto na Vercel, **Root Directory:** **`plataforma`**.
2. **Environment Variables:**

   | Nome                                             | Valor                                                                |
   | ------------------------------------------------ | -------------------------------------------------------------------- |
   | `DATABASE_URL`                                   | a mesma URL do passo A.5                                             |
   | `NEXT_PUBLIC_SITE_URL` e `BETTER_AUTH_URL`       | o endereço da plataforma (ex.: `https://aulas-abc.vercel.app`)       |
   | `NEXT_PUBLIC_PORTFOLIO_URL`                      | o endereço do portfólio                                              |
   | `BETTER_AUTH_SECRET`                             | **o mesmo** do painel (parte C)                                      |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`       | os mesmos do desenvolvimento                                         |
   | `RESEND_API_KEY`, `MAIL_FROM`                    | necessários para o cadastro com e-mail e senha (link de confirmação) |
   | `ASAAS_*`, `BUNNY_*`, `CRON_SECRET`, `STORAGE_*` | só na fase 4 (assinatura)                                            |

3. **Deploy**, ajuste `NEXT_PUBLIC_SITE_URL`/`BETTER_AUTH_URL` com o
   endereço final e faça **Redeploy**.
4. **Google Cloud** (Credenciais → o cliente OAuth): acrescente em
   _Origens JavaScript autorizadas_ o endereço da plataforma e em _URIs de
   redirecionamento autorizados_
   `https://ENDERECO-DA-PLATAFORMA/api/auth/callback/google`. Para qualquer
   pessoa entrar (não só os usuários de teste), publique o app na _Tela de
   consentimento OAuth_. Veja `docs/guia-login-google.md`.
5. **Ligar as aulas no portfólio:** no projeto do portfólio, crie
   `NEXT_PUBLIC_PLATAFORMA_URL` com o endereço da plataforma e faça
   **Redeploy**. Os links "Aulas" deixam de mostrar o aviso e passam a abrir
   a plataforma. No painel, atualize também `PLATAFORMA_URL`.

---

## Depois de publicar

- **Cada `git push` na `main` publica de novo** os três projetos
  automaticamente. Push em outro branch gera um endereço de **pré-visualização**
  (Preview), sem mexer no site principal.
- **Mudou o banco (nova migração)?** Antes de publicar o código novo, rode o
  `npx prisma migrate deploy` com a URL do TiDB (como no passo A.6).
- **Backup:** o plano gratuito do TiDB guarda backups automáticos por pouco
  tempo. Para uma cópia sua, peça ao Claude o comando de exportação.
- **Antes de cobrar:** Vercel **Pro** (o Hobby não permite uso comercial),
  Asaas em produção, domínio próprio e política de privacidade (roadmap,
  "Lançamento").

## Problemas comuns

| Sintoma                                                       | Causa provável                                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Build falha com `DATABASE_URL não definida`                   | variável não criada no projeto da Vercel (ou criada só para _Preview_; marque _Production_)  |
| Página dá erro 500 e o log fala em `SSL`/`insecure transport` | falta `?sslaccept=strict` no fim da `DATABASE_URL`                                           |
| `Access denied for user`                                      | usuário ou senha errados; gere outra senha no _Connect_ do TiDB e atualize nos três projetos |
| Links e metadados apontam para `localhost`                    | `NEXT_PUBLIC_SITE_URL` não foi ajustada, ou faltou o **Redeploy** depois de ajustar          |
| "Entrar com Google" dá `redirect_uri_mismatch`                | endereço da plataforma não cadastrado no Google Cloud (parte D.4)                            |
