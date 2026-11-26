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
| Login | RF22 | E-mail e senha (bcrypt), sessão de 12 h, 5 tentativas a cada 15 min por IP |
| Resumo | RF32 | Assinantes ativos, receita do mês (fuso de Manaus), posts pendentes, mensagens, aulas sem vídeo |
| Perfil | RF23 | Dados, foto, currículo, números, redes, formação, atuação e áreas (arrastar para ordenar) |
| Publicações | RF24 | Cadastro, filtros; importação do XML/ZIP do Lattes e do ORCID **com prévia** (nova, alterada, igual, duplicata por DOI) e histórico em `import_jobs` |
| Categorias e Disciplinas | RF25 | Árvore categoria → disciplina → módulo → tema → aula, arrastar para ordenar em todos os níveis, LaTeX com prévia |
| Vídeos | RF26 | Envio direto ao Bunny (TUS, barra de progresso, status), links YouTube/Vimeo/MP4, vínculo com aulas |
| Materiais | RF27 | PDF (privado) ou link, por disciplina/módulo/aula, marcação de grátis |
| Atividades | RF28 | Múltipla escolha, numérica com tolerância e aberta; LaTeX; correção manual das abertas |
| Assinaturas e Alunos | RF29 | Plano e preço, assinaturas, cobranças, cortesias, códigos (gerar, suspender, revogar), sessões, anonimização (LGPD) |
| Fórum | RF30 | Fila de aprovação, avisos, resposta oficial, fixar, ocultar, responder |
| Mensagens | RF31 | Caixa do formulário de contato |

### Regras aplicadas pelo painel

- **RN10:** até 2 aulas grátis (vídeo do YouTube) e 1 atividade grátis por disciplina.
- **RN14:** disciplina que já esteve em assinatura não é apagada (só arquivada); aluno é anonimizado.
- **RN01:** um código ativo por aluno; gerar outro revoga o anterior e encerra as sessões dele.
- **RN15:** importação sempre com prévia; nada é gravado antes da escolha.
- Endereço da aula único dentro do módulo (a URL do site é `/disciplina/[curso]/[módulo]/[aula]`).
- Código de acesso mostrado **uma única vez**; o banco guarda só o SHA-256.

## Contas externas (opcionais)

Sem as variáveis abaixo o painel funciona e avisa o que está desativado.

| Serviço | Variáveis | Sem ele |
| --- | --- | --- |
| Storage S3 (R2, B2, S3) | `STORAGE_*` | Sem envio de foto, currículo, capas, PDFs e figuras (links continuam) |
| Bunny Stream | `BUNNY_LIBRARY_ID`, `BUNNY_API_KEY` | Sem envio de vídeo pago (links continuam) |
| Asaas | `ASAAS_API_URL`, `ASAAS_API_KEY` | Sem sincronizar cobranças pelo botão |
| Resend | `RESEND_API_KEY`, `MAIL_FROM` | O código da cortesia só aparece na tela |
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
│   ├── (auth)/login/
│   ├── (panel)/                # layout exige sessão de admin
│   │   ├── page.tsx            # resumo
│   │   ├── perfil/  publicacoes/(nova|[id]|importar)  categorias/
│   │   ├── disciplinas/(nova|[id]/aulas/[lessonId])
│   │   ├── videos/  materiais/  atividades/(nova|[id]|correcao)
│   │   ├── assinaturas/  alunos/[id]  forum/(aviso|[id])  mensagens/
│   └── api/
│       ├── uploads/presign/    # URL assinada para o storage
│       └── videos/upload-url/  # envio direto ao Bunny
├── actions/      # server actions por domínio (todas chamam requireAdmin)
├── components/   # ui/ (genéricos), layout/, forms/ (um por entidade)
├── lib/          # auth, regras, bunny, asaas, orcid, lattes-parser, storage, mail
├── validators/   # schemas Zod usados no cliente e no servidor
├── types/
└── proxy.ts      # redireciona para /login sem cookie (Next 16)
```
