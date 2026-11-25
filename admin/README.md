# admin — Projeto 2 (painel gerencial)

Next.js + TypeScript + Tailwind. Cadastra tudo que o site exibe: perfil,
publicações, categorias, disciplinas, aulas, vídeos, materiais, atividades,
plano, assinaturas e fórum. Uso exclusivo do professor.

Requisitos: RF22 a RF32 em [`../docs/02-requisitos.md`](../docs/02-requisitos.md).
Páginas: [`../docs/06-interface.md`](../docs/06-interface.md#mapa-de-páginas--admin).

## Estrutura

```text
src/
├── app/
│   ├── (auth)/login/
│   ├── (panel)/                # layout com menu lateral
│   │   ├── page.tsx            # resumo
│   │   ├── perfil/
│   │   ├── publicacoes/importar/
│   │   ├── categorias/
│   │   ├── disciplinas/        # árvore disciplina > módulo > tema > aula
│   │   ├── videos/
│   │   ├── materiais/
│   │   ├── atividades/
│   │   ├── assinaturas/        # plano, assinaturas, cobranças, cortesias
│   │   ├── alunos/             # códigos e sessões
│   │   ├── forum/              # fila de aprovação e avisos
│   │   └── mensagens/
│   └── api/videos/upload-url/  # URL de envio direto ao Bunny
├── actions/                    # server actions por domínio
├── components/
│   ├── ui/                     # Button, Input, Modal, DataTable
│   ├── layout/                 # Sidebar, Topbar
│   └── forms/                  # um formulário por entidade
├── lib/                        # auth, bunny, asaas, orcid, lattes-parser, storage
├── validators/                 # schemas Zod
└── types/
```
