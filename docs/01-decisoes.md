# 01 — Decisões

Atualizado em 25/11/2026.

## Resumo

Assinatura mensal de **R$ 19,90** cobrada pelo **Asaas**, com até
**3 disciplinas** por aluno e troca de uma disciplina por ciclo. O aluno entra
com **Google** ou com **e-mail e senha** (Better Auth). O portfólio e a
plataforma de aulas são projetos separados. Os vídeos pagos ficam no **Bunny
Stream** e as aulas grátis no **YouTube**. Os dois apps ficam na **Vercel**.

## Tabela de decisões

| Tema | Decisão | Motivo |
| --- | --- | --- |
| Gateway | **Asaas**, conta MEI (PJ) | O Mercado Pago está fora (problema na conta). O Asaas não cobra mensalidade, tem assinatura recorrente com Pix, boleto e cartão, e oferece **Pix Automático** para clientes PJ (o pagador autoriza uma vez e o débito se repete). |
| Tarifas Asaas (consulta em 11/2026) | Pix: R$ 1,99 por cobrança (R$ 0,99 nos 3 primeiros meses). Cartão à vista: R$ 0,49 + 2,99%. | Tarifa fixa pesa mais em valores baixos. A tarifa do Pix Automático deve ser confirmada na conta. |
| Preço | **R$ 19,90/mês** (configurável no painel) | No Pix, a tarifa é 10% de R$ 19,90, contra 20% de R$ 9,99. Com R$ 9,99, cada 10 assinantes pagariam quase 2 de tarifa. R$ 19,90 por 3 disciplinas (~R$ 6,60 cada) continua competitivo. |
| Modelo de cobrança | Assinatura mensal, renova até o aluno cancelar | Pedido do professor. Cancelada, o acesso vai até o fim do mês já pago. |
| Vagas | **3 disciplinas** por assinatura no padrão (ex.: Física I, ESA, PSC 1); configurável no plano (1 a 10) e por aluno, como exceção | Vagas vazias são preenchidas na hora. Trocar uma disciplina ocupada: **uma troca por ciclo**, agendada para valer na renovação. |
| Catálogo | 4 seções: Vestibulares, Ensino Médio, Ensino Superior, Concursos | Tabela `categories`; cada disciplina pertence a uma seção. |
| Aulas grátis | Até 3 itens por disciplina: 2 vídeos de conceito no **YouTube** + 1 atividade (ex.: MRU) | Funciona como degustação; não exige assinatura. |
| Login do aluno | **Google** ou **e-mail e senha** (Better Auth), com confirmação do e-mail e "esqueci a senha" (link de 1 h, uso único). Mesmo e-mail = mesma conta. Senha em bcrypt; token de redefinição só em SHA-256 | Decidido em 26/11/2026, substituindo o código de acesso. A cortesia é uma assinatura com gateway `manual`. O token da sessão fica no banco e o cookie o leva assinado com HMAC. |
| Dispositivos | Até 2 sessões por aluno; a mais antiga cai | Dificulta compartilhar a conta. |
| Anti-pirataria | URL de vídeo com token de 2 h, marca d'água com nome do aluno, player sem download, log de acessos, DRM opcional | Nenhum site impede 100% a gravação de tela (gravador do sistema ou celular apontado para o monitor). A marca d'água identifica quem vazou. |
| Vídeos pagos | **Bunny Stream** (HLS, token, DRM básico MediaCage sem custo). O MySQL guarda só o registro do vídeo | Vídeo dentro do banco incha o MySQL e impede streaming adaptativo. Panda Video é a alternativa se a pirataria virar problema. |
| Link alternativo | Toda aula aceita link externo: YouTube, Vimeo ou MP4 | Mecanismo pedido para quando não houver vídeo no provedor. |
| Materiais (PDF) | **Só visualização** na plataforma, com marca d'água; nunca baixável | Decisão do professor. |
| Fórum | Post de aluno só aparece **após aprovação** no painel | Decisão do professor; evita spam e respostas erradas visíveis. |
| Administração | Um único administrador (o professor) | Sem perfis de moderador/editor. |
| Lattes | Importação do **arquivo XML** do Lattes pelo painel | Não há API aberta: o Extrator Lattes é só para instituições e o captcha bloqueia raspagem. |
| ORCID | Sincronização pela API pública do ORCID | Leitura de dados públicos. A API pública é para uso não comercial: usar só na vitrine de publicações. |
| Lattes e ORCID no seed | Genéricos (`0000000000000000` e `0000-0000-0000-0000`) | O professor preenche no painel quando tiver os dados. |
| Redes sociais | Apenas links com ícones | APIs de Instagram/LinkedIn exigem aprovação de app. |
| Hospedagem | **Vercel** para `portfolio`, `plataforma` e `admin` + MySQL gerenciado externo | O plano Hobby é só para uso pessoal e não comercial. Pode desenvolver no Hobby, mas é preciso passar para o **Pro** antes da primeira cobrança real. A Vercel não hospeda MySQL. |
| Prisma | ORM para acessar o MySQL (não é gateway de pagamento) | Tipagem automática em TypeScript. |
| Organização | Três projetos no mesmo repositório (npm workspaces) | Cada um com build e deploy próprios. |

## Fontes consultadas

- Tarifas Asaas: <https://www.asaas.com/precos-e-taxas> e <https://quasa.io/pt/media/asaas-ou-iugu-tarifa-publicada-vence-ate-o-volume-pedir-proposta>
- Pix Automático no Asaas: <https://blog.asaas.com/?p=279314> e <https://docs.asaas.com/docs/diferen%C3%A7a-entre-pix-autom%C3%A1tico-e-assinaturas-1>
- Vercel Hobby (uso não comercial): <https://vercel.com/docs/plans/hobby> e <https://community.vercel.com/t/is-hobby-plan-suitable-for-a-saas-prototype/7205>
- Bunny MediaCage: <https://docs.bunny.net/stream/mediacage-basic-guide>
- Panda Video (marca d'água DRM): <https://www.pandavideo.com/blog/drm-digital-rights-management>
- Extrator Lattes: <https://www.gov.br/pt-br/servicos/obter-acesso-ao-extrator-da-plataforma-lattes>
- ORCID API: <https://info.orcid.org/documentation/api-tutorials/api-tutorial-read-data-on-a-record>

## Pendências

- [ ] Abrir a conta MEI no Asaas e confirmar se o Pix Automático aparece na tela de assinatura.
- [ ] Escolher o provedor de MySQL gerenciado (compatível com a Vercel).
- [ ] Domínio próprio.
- [ ] Política de privacidade (LGPD) antes da primeira venda.
- [ ] ORCID iD e XML do Lattes para testar a importação.
