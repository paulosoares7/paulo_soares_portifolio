# portfolio — portfólio acadêmico

Next.js 16 (App Router) + TypeScript strict + Tailwind 4. Home no estilo do
modelo Jacob, Sobre, Publicações, Contato e a seção que leva à plataforma de
aulas. Sem login e sem pagamento. Acesso ao banco só por `@portfolio/database`;
tema e componentes comuns em `@portfolio/ui` (`packages/ui`).

Requisitos: RF01 a RF04 em [`../docs/02-requisitos.md`](../docs/02-requisitos.md).
Visual: [`../docs/06-interface.md`](../docs/06-interface.md).

## Rodar

Pré-requisito: o banco ligado (`npm run db:up` na raiz; veja `database/README.md`).

```bash
cp portfolio/.env.example portfolio/.env.local   # e preencha DATABASE_URL
npm install                                       # na raiz do repositório
npm run portfolio:dev                             # http://localhost:3000
```

| Comando (dentro de `portfolio/`) | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento na porta 3000 |
| `npm run build` / `npm start` | Build e servidor de produção (porta 3000) |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## Páginas

| Rota | Requisito | O que mostra |
| --- | --- | --- |
| `/` | RF01 | Apresentação (Fale comigo, Baixar currículo, Currículo Lattes), redes sociais, números, publicações em destaque e a seção Aulas |
| `/sobre` | RF02 | Bio, áreas de pesquisa, formação e atuação em linha do tempo, ferramentas, currículo e Lattes |
| `/publicacoes` | RF03 | Busca por título, filtros por tipo e ano, destaques, DOI |
| `/contato` | RF04 | Formulário salvo em `contact_messages` (aparece no painel), aviso por e-mail via Resend |

O menu "Aulas", o ícone "Aulas" e a seção Aulas da home levam à plataforma
(`NEXT_PUBLIC_PLATAFORMA_URL`, porta 3002 em desenvolvimento).

## Conteúdo que vem do painel

- **Redes sociais:** `social_links` (LinkedIn, Currículo Lattes, Instagram,
  Facebook, GitHub e E-mail). Aparecem abaixo dos botões da home e no rodapé,
  com o atalho "Aulas" no fim.
- **Currículo Lattes:** botão da home e link do Sobre usam o Lattes do Perfil;
  sem ele, a home usa a rede `lattes` de `social_links`.
- **Seção Aulas:** os grupos vêm de `categories`, com a contagem de
  disciplinas publicadas.
- **Ferramentas (Sobre):** `site_settings`, chave `tools`, no formato
  `["GeoGebra", "PhET"]`. Sem a chave, a seção não aparece.
- **Foto e currículo:** precisam do storage configurado no painel e de
  `STORAGE_PUBLIC_URL` (sem foto, a home mostra uma órbita com as iniciais).
