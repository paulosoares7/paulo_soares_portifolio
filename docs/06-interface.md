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
| Minha área | `/minha-area` | Disciplinas da assinatura, vagas livres, troca agendada, próxima cobrança, progresso, conquistas, cancelar |
| Celular | todas | Menu inferior fixo: Início, Aulas, Publicações, Minha área |

## Mapa de páginas — admin

| Página | O que faz |
| --- | --- |
| Login | E-mail e senha |
| Resumo | Assinantes ativos, receita do mês, posts aguardando aprovação |
| Perfil | Dados, foto, números, redes, formação, atuação, áreas |
| Publicações | Lista, edição, importação (XML Lattes e ORCID) com prévia |
| Categorias e disciplinas | Árvore categoria → disciplina → módulo → tema → aula, com arrastar para ordenar |
| Vídeos | Envio ao Bunny com progresso, ou link; status |
| Materiais | Envio de PDF, marcação de grátis |
| Atividades | Questões com LaTeX, gabarito, tolerância, correção de abertas |
| Assinaturas e alunos | Plano e preço, assinaturas, cobranças, cortesia, códigos, sessões |
| Fórum | Fila de aprovação, avisos, resposta oficial |
| Mensagens | Contato |

## Tokens visuais (Tailwind)

| Token | Valor | Uso |
| --- | --- | --- |
| `bg` | `#0B1622` | Fundo das páginas |
| `surface` | `#112233` | Cartões e menus |
| `border` | `#1E3A52` | Bordas e divisórias |
| `accent` | `#0EA5E9` | Botões, links, título em destaque, barra de progresso |
| `text` | `#F1F5F9` | Texto principal |
| `muted` | `#94A3B8` | Texto secundário |
| `success` / `warning` / `danger` | `#22C55E` / `#EAB308` / `#EF4444` | Selos Concluído/Fácil, Médio, Difícil |
| Fonte | Poppins | Títulos e texto |
| Raio | 8 px (botões), 12 px (cartões) | — |

As cores foram aproximadas a partir da imagem do Jacob e podem ser ajustadas
em `site_settings`.
