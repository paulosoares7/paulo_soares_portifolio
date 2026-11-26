# admin — Projeto 2 (painel gerencial)

Next.js 16 (App Router) + TypeScript strict + Tailwind 4. Cadastra tudo que o
site exibe. Uso exclusivo do professor. Acesso ao banco só pelo pacote
`@portfolio/database`.

Requisitos: RF22 a RF32 em [`../docs/02-requisitos.md`](../docs/02-requisitos.md).
Páginas: [`../docs/06-interface.md`](../docs/06-interface.md#mapa-de-páginas--admin).

## Rodar

Pré-requisito: o banco ligado (`npm run db:up` na raiz; veja `database/README.md`).

```bash
cp admin/.env.example admin/.env.local   # e preencha DATABASE_URL
npm install                               # na raiz do repositório
npm run admin:dev                         # http://localhost:3001
```

Outros comandos (dentro de `admin/`):

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento na porta 3001 |
| `npm run build` / `npm start` | Build e servidor de produção (porta 3001) |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Primeiro acesso

O administrador é criado pelo script do projeto `database`:

```bash
npm run create-admin -w @portfolio/database -- --email voce@dominio.com --name "Seu Nome"
```

Na primeira vez ele assume a conta de exemplo do seed (`admin@exemplo.com`).
Para trocar a senha depois, rode o mesmo comando com o mesmo e-mail.

## O que o painel faz

| Página | Requisito | Recursos |
| --- | --- | --- |
| Login | RF22 | E-mail e senha (bcrypt), sessão de 12 h, 5 tentativas a cada 15 min por IP (contador no banco) |
| Esqueci a senha | RF22 | Link por e-mail (SHA-256 no banco, 1 h, uso único), mensagem igual com e sem conta, 5 pedidos a cada 15 min por IP e por e-mail; trocar a senha encerra todas as sessões |
| Resumo | RF32 | Assinantes ativos, receita do mês (fuso de Manaus), posts pendentes, mensagens, aulas sem vídeo |
| **Portfólio** | | |
| Perfil | RF23 | Dados, foto, currículo e números de destaque |
| Formação e atuação | RF23 | Formação acadêmica e atuação profissional (arrastar para ordenar) |
| Áreas de pesquisa | RF23 | Áreas (arrastar para ordenar) |
| Redes sociais | RF23 | LinkedIn, Currículo Lattes, Instagram, Facebook, GitHub e E-mail: adicionar, editar, ordenar, ocultar e remover |
| Publicações | RF24 | Cadastro, filtros; importação do XML/ZIP do Lattes e do ORCID **com prévia** (nova, alterada, igual, duplicata por DOI) e histórico em `import_jobs` |
| Categorias, grupos e disciplinas | RF25 | Árvore categoria → grupo → disciplina → módulo → tema → aula, arrastar para ordenar em todos os níveis, LaTeX com prévia |
| Vídeos | RF26 | Envio direto ao Bunny (TUS, barra de progresso, status), links YouTube/Vimeo/MP4, vínculo com aulas |
| Materiais | RF27 | PDF (privado) ou link, por disciplina/módulo/aula, marcação de grátis |
| Atividades | RF28 | Múltipla escolha, numérica com tolerância e aberta; LaTeX; correção manual das abertas |
| **Plataforma de aulas** | | |
| Assinaturas | RF29 | Plano e preço, assinaturas, cobranças e cortesias |
| Alunos | RF29 | Como entra (Google, e-mail ou os dois), e-mail verificado, assinatura, disciplinas nas vagas, sessões (encerrar), link de senha e anonimização (LGPD) |
| Fórum | RF30 | Fila de aprovação, avisos, resposta oficial, fixar, ocultar, responder |
| Mensagens | RF31 | Caixa do formulário de contato |

### Regras aplicadas pelo painel

- **RN10:** até 2 aulas grátis (vídeo do YouTube) e 1 atividade grátis por disciplina.
- **RN14:** disciplina que já esteve em assinatura não é apagada (só arquivada); aluno é anonimizado.
- **RN15:** importação sempre com prévia; nada é gravado antes da escolha.
- Endereço da aula único dentro do módulo (a URL do site é `/disciplina/[curso]/[módulo]/[aula]`).
- Link de senha do aluno: gerado por uma instância mínima do Better Auth
  (`lib/student-auth.ts`) com o mesmo `BETTER_AUTH_SECRET` e o mesmo mapeamento
  da plataforma; o aluno abre o link na plataforma.

## Contas externas (opcionais)

Sem as variáveis abaixo o painel funciona e avisa o que está desativado.

| Serviço | Variáveis | Sem ele |
| --- | --- | --- |
| Storage S3 (R2, B2, S3) | `STORAGE_*` | Sem envio de foto, currículo, capas, PDFs e figuras (links continuam) |
| Bunny Stream | `BUNNY_LIBRARY_ID`, `BUNNY_API_KEY` | Sem envio de vídeo pago (links continuam) |
| Asaas | `ASAAS_API_URL`, `ASAAS_API_KEY` | Sem sincronizar cobranças pelo botão |
| Resend | `RESEND_API_KEY`, `MAIL_FROM` | Links de senha (admin e alunos) aparecem só no terminal em desenvolvimento; em produção não são enviados |
| Plataforma | `PLATAFORMA_URL`, `BETTER_AUTH_SECRET` | Sem o segredo igual ao da plataforma, o link de senha do aluno não funciona |
| ORCID | iD no Perfil (ou `ORCID_ID`) | Botão "Buscar no ORCID" desativado |

**Storage:** o navegador envia o arquivo direto ao bucket. Configure o CORS do
bucket para aceitar `PUT` da origem do painel (ex.: `http://localhost:3001` e o
domínio de produção) com o cabeçalho `Content-Type`. Para a foto do perfil
aparecer no site sem URL assinada, preencha `STORAGE_PUBLIC_URL`.

**Bunny:** a chave da API nunca vai ao navegador; `api/videos/upload-url` cria o
vídeo e devolve só a assinatura do envio (válida por 6 h).

## Estrutura

```text
src/
├── app/
│   ├── (auth)/login/  esqueci-a-senha/  redefinir-senha/
│   ├── (panel)/                # layout exige sessão de admin
│   │   ├── page.tsx            # resumo
│   │   ├── perfil/  formacao-e-atuacao/  areas-de-pesquisa/  redes-sociais/
│   │   ├── publicacoes/(nova|[id]|importar)  mensagens/  categorias/
│   │   ├── disciplinas/(nova|[id]/aulas/[lessonId])
│   │   ├── videos/  materiais/  atividades/(nova|[id]|correcao)
│   │   ├── assinaturas/  alunos/[id]  forum/(aviso|[id])
│   └── api/
│       ├── uploads/presign/    # URL assinada para o storage
│       └── videos/upload-url/  # envio direto ao Bunny
├── actions/      # server actions por domínio (todas chamam requireAdmin)
├── components/   # ui/ (genéricos), layout/, forms/ (um por entidade)
├── lib/          # auth, regras, bunny, asaas, orcid, lattes-parser, storage, mail
├── validators/   # schemas Zod usados no cliente e no servidor
├── types/
└── proxy.ts      # sem cookie, manda para /login (login e senha ficam abertos)
```
