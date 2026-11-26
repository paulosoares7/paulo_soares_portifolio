# Guia: ativar "Continuar com Google" na plataforma de aulas

## Por que o botão não aparecia

O código do login com Google já está pronto (`plataforma/src/lib/auth.ts`,
Better Auth). O botão só aparece quando as duas variáveis abaixo estão
preenchidas no `plataforma/.env.local`:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

No `.env.local` atual as duas estão vazias. Por isso o Google fica desligado
(`isGoogleEnabled = false`) e o botão some. Em desenvolvimento, agora o botão
aparece desativado com um aviso; em produção, sem as chaves, ele continua
escondido.

## Passo a passo no Google Cloud Console

1. Acesse <https://console.cloud.google.com/> com a conta Google do professor.
2. No topo, clique no seletor de projetos → **Novo projeto**. Nome sugerido:
   `Aulas de Física`. Clique em **Criar** e selecione o projeto.
3. Menu ☰ → **APIs e serviços** → **Tela de consentimento OAuth**
   (em algumas contas aparece como **Google Auth Platform** → **Branding**).
   - Tipo de usuário: **Externo** → **Criar**.
   - Nome do app: `Aulas de Física` (é o nome que o aluno vê).
   - E-mail de suporte: o e-mail do professor.
   - Logo (opcional) e **domínio autorizado**: o domínio de produção, sem
     `https://` (ex.: `aulas.seudominio.com.br`).
   - Contato do desenvolvedor: o e-mail do professor. **Salvar e continuar**.
   - Escopos: não precisa adicionar nada (o Better Auth usa `openid`, `email`
     e `profile`, que são básicos). **Salvar e continuar**.
   - Usuários de teste: enquanto o app estiver em "Teste", só os e-mails
     listados aqui conseguem entrar. Adicione o seu e alguns alunos de teste.
4. Menu ☰ → **APIs e serviços** → **Credenciais** → **Criar credenciais** →
   **ID do cliente OAuth**.
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Nome: `Plataforma de aulas`.
   - **Origens JavaScript autorizadas**:
     - `http://localhost:3002`
     - `https://SEU-DOMINIO` (produção)
   - **URIs de redirecionamento autorizados**:
     - `http://localhost:3002/api/auth/callback/google`
     - `https://SEU-DOMINIO/api/auth/callback/google`
   - Clique em **Criar**. Copie o **ID do cliente** e a **Chave secreta do
     cliente**.
5. Cole os dois no `plataforma/.env.local` (nunca no repositório):

   ```
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
   ```

6. Reinicie a plataforma (`npm run plataforma:dev`). O botão **Continuar com
   Google** aparece em `/entrar` e `/cadastrar`.
7. Em produção (Vercel): Project → **Settings** → **Environment Variables**,
   adicione as duas variáveis e confira `BETTER_AUTH_URL` e
   `NEXT_PUBLIC_SITE_URL` com o domínio `https://`. Faça um novo deploy.
8. Quando tudo estiver testado, volte em **Tela de consentimento** e clique em
   **Publicar app** para qualquer pessoa poder entrar (sem a lista de teste).
   Com só os escopos básicos, o Google não pede verificação demorada.

## Cuidados

- O endereço de retorno precisa ser **idêntico**: mesmo `http`/`https`, mesma
  porta, sem barra no fim. Erro `redirect_uri_mismatch` = endereço diferente do
  cadastrado.
- O Google **não aceita IP da rede local** (ex.: `http://192.168.0.4:3002`)
  como endereço de retorno. Pelo celular na Wi-Fi, use e-mail e senha; o Google
  funciona no `localhost` e no domínio de produção.
- Se o aluno já tem conta com e-mail e senha, entrar com o Google usando o
  mesmo e-mail vincula as duas formas à mesma conta (`accountLinking` em
  `lib/auth.ts`).
- Os tokens do Google ficam criptografados no banco com `BETTER_AUTH_SECRET`.
