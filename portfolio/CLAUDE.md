# CLAUDE.md — portfolio

Leia também o `CLAUDE.md` da raiz.

- Portfólio acadêmico: home (modelo Jacob), Sobre, Publicações, Contato e a
  seção que leva às aulas. **Sem login e sem pagamento.**
- Acesso ao banco só via `@portfolio/database`, só leitura (a única escrita é
  a mensagem de contato em `contact_messages`). Não crie tabelas aqui.
- A plataforma de aulas é outro projeto: links para ela usam `<a>` com
  `plataformaUrl()` de `lib/links.ts` (`NEXT_PUBLIC_PLATAFORMA_URL`), nunca
  `<Link>` nem rotas `/aulas` locais.
- Tema e componentes visuais comuns (Button, Badge, Container, Markdown,
  SocialIcon) ficam em `@portfolio/ui` (`packages/ui`). Mudou o visual comum?
  Mude lá, e confira o portfolio e a plataforma.
- Redes sociais vêm de `social_links` (editadas no admin). Links externos
  abrem em nova aba; `mailto:` e o atalho "Aulas" abrem na mesma aba.
- Páginas são Server Components (SEO), com `revalidate` para o conteúdo do
  painel aparecer sem novo deploy. Interatividade em componentes cliente
  pequenos.
