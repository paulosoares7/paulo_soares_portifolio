# 06 — Interface

Tema escuro com a paleta do modelo Jacob (azul-marinho e ciano) em todo o
site. A home segue o Jacob; os números seguem o modelo do UI designer; a área
de aulas segue os cartões de matérias e a lista de aulas e exercícios,
adaptados ao tema escuro. As imagens estão em [`inspiracoes/`](inspiracoes/).

| Arquivo | Usar como referência para |
| --- | --- |
| `01-home-jacob-paleta.png` | Home e **paleta de cores** do site inteiro |
| `02-constelacao-tecnologias.png` | Seção de ferramentas na página Sobre |
| `03-numeros-ui-designer.png` | Faixa de números de destaque (anos, publicações, alunos) |
| `04-mobile-moustafa.png` | Versão celular, com menu inferior |
| `05-feed-avisos-reacoes.png` | Avisos e fórum com reações |
| `06-tela-videoaula.png` | Página da aula (player grande) |
| `07-cartoes-materias.png` | Cartões de disciplina com progresso |
| `08-lista-aulas.png` | Aba **Aulas** (no lugar de "Lições") |
| `09-cartoes-atividades.png` | Aba Atividades (selo Fácil/Médio/Difícil, % de acerto) |

## Mapa de páginas — site

| Página | Rota | O que mostra |
| --- | --- | --- |
| Home | `/` | Foto com recorte em degradê, nome, título em ciano, bio curta, botões, ícones sociais, números de destaque, publicações em destaque e chamada para as aulas |
| Sobre | `/sobre` | Formação e atuação em linha do tempo, áreas de pesquisa, órbita de ferramentas |
| Publicações | `/publicacoes` | Filtros por tipo e ano, busca, cartão por publicação com selo do tipo e DOI |
| Contato | `/contato` | Formulário |
| Catálogo | `/aulas` | Abas ou seções Vestibulares, Ensino Médio, Ensino Superior, Concursos; cartões de disciplina com selo "3 aulas grátis" |
| Seção | `/aulas/[categorySlug]` | Disciplinas da seção |
| Disciplina | `/disciplina/[courseSlug]` | Abas Aulas, Atividades, Materiais e Fórum; aulas grátis com selo "Grátis"; aulas pagas com cadeado para quem não assina |
| Aula | `/disciplina/[courseSlug]/[moduleSlug]/[lessonSlug]` | Player com marca d'água, lista do módulo ao lado, materiais e comentários abaixo |
| Assinar | `/assinar` | Preço, o que inclui, formulário (nome, e-mail, CPF) e forma de pagamento |
| Sucesso | `/assinar/sucesso` | Código exibido uma vez + escolha das até 3 disciplinas |
| Entrar | `/entrar` | Campo único com máscara `XXXX-XXXX-XXXX-XXXX` e link "perdi meu código" |
| Painel do aluno | `/minha-area` | Tela de início depois do login: avisos da assinatura, números de desempenho, dias de estudo na semana, continuar de onde parou, últimas aulas, disciplinas com progresso, atividades, assinatura, conquistas e conta. Aluno novo: boas-vindas com aulas grátis. Sem assinatura: convite para assinar |
| Convite para assinar | aula | Modal ao abrir a última aula grátis da disciplina (uma vez por visita) e cartão fixo abaixo do vídeo; o cadeado mostra o preço do plano |
| Celular | todas | Menu inferior fixo: Início, Aulas, Professor, Painel |

## Mapa de páginas — admin

| Página | O que faz |
| --- | --- |
| Login | E-mail e senha |
| Resumo | Assinantes ativos, receita do mês, posts aguardando aprovação |
| Perfil | Dados, foto, números, redes, formação, atuação, áreas |
| Publicações | Lista, edição, importação (XML Lattes e ORCID) com prévia |
| Categorias, grupos e disciplinas | Árvore categoria → grupo → disciplina → módulo → tema → aula, com arrastar para ordenar |
| Vídeos | Envio ao Bunny com progresso, ou link; status |
| Materiais | Envio de PDF, marcação de grátis |
| Atividades | Questões com LaTeX, gabarito, tolerância, correção de abertas |
| Assinaturas e alunos | Plano e preço, assinaturas, cobranças, cortesia, códigos, sessões |
| Fórum | Fila de aprovação, avisos, resposta oficial |
| Mensagens | Contato |

## Tokens visuais (Tailwind)

Os tokens ficam num único arquivo, `packages/ui/src/tokens.css`, usado pelos
três apps (o admin importa `@portfolio/ui/tokens.css`; o portfolio e a
plataforma, `@portfolio/ui/theme.css`, que já o inclui). Os componentes usam
só as classes dos tokens (`bg-surface`, `text-muted`, `border-border`...),
nunca cores fixas. O Tailwind gera cada token como variável CSS, então um
tema novo só redefine as variáveis.

| Token | Valor | Uso |
| --- | --- | --- |
| `bg` | `#0B1622` | Fundo das páginas |
| `surface` | `#112233` | Cartões e menus |
| `surface-2` | `#0E1C2B` | Campos, blocos internos e fundo do visualizador embutido |
| `border` | `#1E3A52` | Bordas e divisórias |
| `accent` | `#0EA5E9` | Botões, links, título em destaque, barra de progresso |
| `text` | `#F1F5F9` | Texto principal |
| `muted` | `#94A3B8` | Texto secundário |
| `success` / `warning` / `danger` | `#22C55E` / `#EAB308` / `#EF4444` | Selos Concluído/Fácil, Médio, Difícil |
| `accent-strong` | `#0284C7` | Destaque ao passar o mouse |
| `overlay` | preto 60% | Fundo escurecido atrás dos modais |
| `chart-1` / `chart-2` / `chart-3` | `#338CED` / `#E76624` / `#00A888` | Séries dos gráficos do admin, sempre nessa ordem |
| `shadow-glow` / `shadow-glow-strong` | brilho de 30% / 45% do `accent` | Círculos com iniciais e órbitas |
| Fonte | Poppins | Títulos e texto |
| Raio | 8 px (botões), 12 px (cartões) | — |

As cores foram aproximadas a partir da imagem do Jacob.

A cor da barra do navegador (meta `theme-color`) não aceita variável CSS: ela
fica em `packages/ui/src/theme-color.ts` e deve mudar junto com o `bg`.

Exceções que continuam com cor fixa, de propósito: o logo do Google (cores da
marca), os e-mails (os programas de e-mail só aceitam cor escrita no HTML), a
cor de cada disciplina (é um dado cadastrado no painel), o fundo preto do
player de vídeo e a página de impressão dos relatórios (papel branco; vai usar
o tema claro quando ele existir).

## PWA (instalar como app)

Os três apps (admin, portfolio e plataforma) podem ser instalados no celular
e no computador ("Adicionar à tela inicial" / "Instalar app"). O código é
comum, em `packages/ui/src/pwa.ts`:

| Peça | Onde | O que faz |
| --- | --- | --- |
| Manifesto | `app/manifest.ts` de cada app | Nome, ícones, cor do tema escuro, abre em tela cheia (`standalone`) |
| Ícones | `public/icons/` e `app/apple-icon.png` de cada app | 192 px, 512 px e 512 px "maskable" (recortável pelo sistema); provisórios, com o "P." do favicon |
| Service worker | `app/sw.js/route.ts` | Só guarda a página "Sem conexão"; todo o resto vem sempre da rede |
| Sem conexão | `app/offline.html/route.ts` | Aviso com o botão "Tentar de novo" quando a internet cai |
| Registro | `ServiceWorkerRegister` no layout raiz | Liga o service worker depois que a página carrega |

**Segurança:** nenhum conteúdo pago nem dado do aluno fica guardado no
aparelho (páginas, PDFs, vídeos, imagens e respostas da API). O modo offline
dos PDFs é uma melhoria futura, com criptografia
(`docs/prompts/futuro-pdf-offline.md`). No admin, os arquivos do PWA abrem
sem login (`proxy.ts`) para o "Instalar app" aparecer já na tela de login.

Para trocar os ícones pelo logo definitivo: substitua os PNGs de
`public/icons/` e o `app/apple-icon.png` de cada app, com os mesmos nomes e
tamanhos. A página "Sem conexão" repete as cores do tema escuro porque abre
sem internet e não carrega o Tailwind.
