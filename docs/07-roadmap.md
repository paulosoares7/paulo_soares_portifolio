# 07 — Roadmap

Ordem pelas dependências: banco → painel → site. Assim o site já nasce
exibindo dados reais. Cada fase é um pedido separado ao Claude Code. Só passe
para a próxima quando o critério de avanço for cumprido.

| Fase | Projeto | Entregas | Critério para avançar |
| --- | --- | --- | --- |
| 1 | `database` | Workspace npm, `schema.prisma` equivalente ao `001_schema.sql`, migração inicial, seed em TypeScript, script `create-admin`, `docker-compose` com MySQL local, script de backup | O banco sobe do zero com um comando, já com o seed de Física I |
| 2 | `admin` | Login; perfil e portfólio; publicações (XML Lattes e ORCID com prévia); categorias, disciplinas, módulos, temas e aulas; vídeos (Bunny e links); materiais; atividades; plano, assinaturas, cortesias e códigos | Física I inteira cadastrada pelo painel, sem SQL manual |
| 3 | `site` (público) | Home, Sobre, Publicações, Contato, catálogo por seção, página da disciplina, aulas grátis com YouTube, player | Aula grátis tocando no celular e no computador |
| 4 | `site` (assinatura) | Assinatura no Asaas, webhook, código por e-mail, entrada com código, vagas e troca, token do player Bunny, marca d'água, visualizador de PDF, cancelamento, Vercel Cron, política LGPD | Assinatura de teste aprovada no sandbox do Asaas e troca de disciplina aplicada na renovação |
| 5 | `site` + `admin` (comunidade) | Fórum com aprovação, avisos com reações, progresso, minha área completa, conquistas, resumo do admin | Post de aluno aprovado no painel e visível na aula |

Antes da primeira cobrança real: passar a Vercel para o plano Pro e publicar
a política de privacidade.

Os vídeos reais podem entrar a qualquer momento depois da fase 2, sem mudar
código.

## Melhorias futuras

Depois do lançamento:

- Modo offline dos PDFs enviados (estilo Spotify) — docs/prompts/futuro-pdf-offline.md
