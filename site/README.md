# site — Projeto 3 (site principal)

Next.js + TypeScript + Tailwind. Portfólio acadêmico + plataforma de aulas
por assinatura.

Requisitos: RF01 a RF21 em [`../docs/02-requisitos.md`](../docs/02-requisitos.md).
Páginas: [`../docs/06-interface.md`](../docs/06-interface.md). Fluxos:
[`../docs/05-fluxos.md`](../docs/05-fluxos.md).

## Estrutura

```text
src/
├── app/
│   ├── page.tsx                      # home (estilo Jacob)
│   ├── sobre/  publicacoes/  contato/
│   ├── aulas/                        # catálogo por seção
│   │   └── [categorySlug]/
│   ├── disciplina/[courseSlug]/      # abas Aulas | Atividades | Materiais | Fórum
│   │   └── [moduleSlug]/[lessonSlug]/  # página da aula (player)
│   ├── assinar/  assinar/sucesso/
│   ├── entrar/
│   ├── minha-area/  minha-area/disciplinas/   # vagas e troca
│   └── api/
│       ├── webhooks/asaas/route.ts
│       ├── player-token/route.ts
│       ├── materials/view/route.ts
│       └── progress/route.ts
├── components/
│   ├── home/           # Hero, Highlights, SocialLinks
│   ├── publications/   # PublicationList, Filters
│   ├── catalog/        # CategoryTabs, CourseCard
│   ├── course/         # ModuleAccordion, LessonRow, CourseTabs
│   ├── player/         # VideoPlayer, BunnyPlayer, YouTubePlayer, Mp4Player, Watermark
│   ├── materials/      # PdfViewer (sem download, com marca d'água)
│   ├── activities/     # ActivityCard, QuestionView
│   ├── forum/          # ThreadCard, PostReactions, Composer
│   ├── subscription/   # PlanCard, SlotPicker, SwapDialog
│   └── ui/
├── lib/                # access, access-code, asaas, bunny, mail, rate-limit
├── validators/
└── types/
```
