# Rotas do `site` antes da separação

Retrato do projeto `site` em 26/11/2026 (commit `f329c7f`, fim da fase 3),
antes de dividi-lo em `portfolio` e `plataforma`. Serve de referência para
conferir que nenhuma página se perdeu na reestruturação.

## Páginas

| Rota | Arquivo | O que mostra | Destino previsto |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | Home (hero, números, publicações em destaque) | portfolio |
| `/sobre` | `app/sobre/page.tsx` | Bio longa, formação, atuação, áreas, ferramentas | portfolio |
| `/publicacoes` | `app/publicacoes/page.tsx` | Publicações com busca e filtros (`?q`, `?type`, `?year`) | portfolio |
| `/contato` | `app/contato/page.tsx` | Formulário de contato | portfolio |
| `/aulas` | `app/aulas/page.tsx` | Catálogo por categoria | plataforma |
| `/aulas/[categorySlug]` | `app/aulas/[categorySlug]/page.tsx` | Disciplinas de uma categoria | plataforma |
| `/disciplina/[courseSlug]` | `app/disciplina/[courseSlug]/page.tsx` | Página da disciplina (`?aba=` aulas, atividades, materiais, avisos) | plataforma |
| `/disciplina/[courseSlug]/[moduleSlug]/[lessonSlug]` | `app/disciplina/.../page.tsx` | Aula (player, cadeado nas pagas) | plataforma |
| `/atividades/[activityId]` | `app/atividades/[activityId]/page.tsx` | Atividade (grátis corrigida no servidor) | plataforma |
| `/assinar` | `app/assinar/page.tsx` | Provisória: "assinaturas abrem em breve" | plataforma |
| `/entrar` | `app/entrar/page.tsx` | Provisória: entrada com código (fase 4) | plataforma (refeita com login) |
| 404 | `app/not-found.tsx` | Página não encontrada | os dois |

## Rotas especiais

| Rota | Arquivo | Destino previsto |
| --- | --- | --- |
| `/sitemap.xml` | `app/sitemap.ts` | os dois (cada um com as suas páginas) |
| `/robots.txt` | `app/robots.ts` | os dois |
| `/icon.svg` | `app/icon.svg` | os dois |

## Pastas reservadas (vazias, sem arquivos)

- `app/minha-area/disciplinas/`
- `app/api/materials/view/`, `app/api/player-token/`, `app/api/progress/`,
  `app/api/webhooks/asaas/`

## Server Actions

| Arquivo | Função | Destino previsto |
| --- | --- | --- |
| `actions/contact.ts` | Envia a mensagem do formulário de contato | portfolio |
| `actions/activity.ts` | `submitActivity` (corrige a atividade grátis) | plataforma |

## Links do menu

- Menu do topo: Início, Sobre, Publicações, Aulas, Contato.
- Menu de baixo (celular): Início, Aulas, Publicações, Minha área (`/entrar`).
