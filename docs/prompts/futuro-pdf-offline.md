# Futuro — Modo offline dos PDFs (estilo Spotify)

> **Status:** guardado para o futuro. Não executar antes do lançamento.
> **Fase:** melhoria posterior à Fase 5 (Comunidade).
> **Como chamar:** *Execute o pedido de docs/prompts/futuro-pdf-offline.md.*

## O que é

O aluno toca em **"Salvar para estudar offline"** e o PDF fica guardado **dentro da plataforma (PWA)**, criptografado, como as músicas baixadas no Spotify. Ele abre só pela plataforma, com marca d'água, e é apagado quando a assinatura acaba ou o aluno sai da conta.

**Vale só para PDFs enviados (R2).** Materiais por link externo (Google Drive, Dropbox etc.) não entram no modo offline: eles continuam abrindo pelo link, que já é público.

**Por que fazer:** o aluno estuda sem internet (ônibus, escola, sinal fraco), e cada PDF é lido do R2 uma vez só.

**Limite honesto:** por ser um site instalável (PWA), e não um app nativo, quem entende de programação consegue extrair o arquivo com esforço. O objetivo é dificultar e identificar (marca d'água), não tornar impossível.

## Antes de usar este pedido

- [ ] Fases 4 (assinatura) e 5 (comunidade) concluídas
- [ ] Plataforma publicada e PWA funcionando
- [ ] R2 configurado e visualizador de PDF com marca d'água funcionando
- [ ] PDFs reais enviados ao R2 (não por link)

## Pedido

```
Vamos implementar o modo offline dos PDFs na `plataforma`, parecido com o do Spotify. Siga o CLAUDE.md, o plataforma/CLAUDE.md e o docs/06-interface.md (tema, transições e PWA). Nas etapas com ⛔ PARE, espere a minha aprovação.

## REGRAS
- Crie e trabalhe no branch `pdf-offline`.
- Reaproveite o visualizador de PDF (pdf.js) e a marca d'água que já existem.
- O modo offline vale só para PDFs enviados ao R2. Materiais por link externo não mostram o botão de salvar offline (mostrar a dica "Disponível só online").
- Ao fim de cada etapa: typecheck, build e testes sem erros; um commit por etapa (Conventional Commits em português).
- Nada de chaves no repositório; atualize o .env.example.
- Mudanças no banco só por migração do Prisma, atualizando o 001_schema.sql e o docs/04-banco-de-dados.md.

## ETAPA 1 — PLANO ⛔ PARE
Me mostre o plano: como será a criptografia, onde a chave fica, como a validade é controlada, o que muda no banco, no service worker e no admin, e os riscos de segurança que continuam existindo. Não altere nada.

## ETAPA 2 — SALVAR E ABRIR OFFLINE
1. Botão "Salvar para estudar offline" em cada PDF enviado, disponível só para alunos com assinatura ativa e com acesso àquela disciplina.
2. O PDF é baixado por URL assinada, criptografado no aparelho com AES-GCM (Web Crypto) e guardado no IndexedDB. Nunca como arquivo comum, nunca no Cache Storage público e nunca na pasta de downloads.
3. A chave de cada aluno vem do servidor, é importada como não exportável e tem validade de 30 dias.
4. O PDF salvo só abre no visualizador da plataforma, com a marca d'água (nome e e-mail do aluno), sem botão de baixar, imprimir ou copiar texto.
5. Sem internet, o aluno abre os PDFs salvos normalmente enquanto a chave for válida.

## ETAPA 3 — VALIDADE E LIMPEZA AUTOMÁTICA
1. Ao voltar a ficar online, renovar a chave se a assinatura e o acesso à disciplina continuarem ativos.
2. Apagar todos os PDFs salvos quando: o aluno sair da conta, a chave vencer sem renovação, a assinatura acabar ou a disciplina sair das vagas.
3. Se o PDF for atualizado no admin, avisar o aluno e oferecer baixar a versão nova.

## ETAPA 4 — MEUS DOWNLOADS
1. Página "Meus downloads" na minha área: lista dos PDFs salvos (disciplina, data, tamanho), espaço total usado, validade restante e botão para remover um ou todos.
2. Indicador nos PDFs já salvos (ícone de "disponível offline").
3. Seguir o tema (claro e escuro) e as transições do projeto.

## ETAPA 5 — ADMIN
1. Configuração do limite por aluno (padrão: 50 PDFs ou 500 MB) e da validade da chave (padrão: 30 dias).
2. Opção de liberar ou bloquear o offline por PDF.
3. No relatório de uso: quantos PDFs foram salvos offline e por quantos alunos.

## ETAPA 6 — TESTES E ENTREGA ⛔ PARE
1. Playwright:
   - aluno com assinatura salva um PDF e o abre com a rede desligada;
   - aluno sem assinatura não vê o botão;
   - material por link externo não mostra o botão de salvar offline;
   - ao sair da conta, os PDFs salvos são apagados;
   - com a chave vencida, o PDF não abre até renovar.
2. Atualize o docs/02-requisitos.md, o docs/05-fluxos.md e o docs/07-roadmap.md.
3. Me mostre o resumo, os riscos que continuam existindo e um checklist para eu testar no celular.
Espere o meu teste e a minha aprovação antes de juntar ao main.
```

## Checklist do seu teste (no celular, com o app instalado)

- [ ] Salvar um PDF enviado de uma disciplina da assinatura
- [ ] Conferir que um material por link não mostra o botão de salvar
- [ ] Ligar o modo avião e abrir o PDF salvo
- [ ] Conferir a marca d'água e que não há botão de baixar ou imprimir
- [ ] Procurar o PDF nos arquivos do celular (não deve aparecer)
- [ ] Ver "Meus downloads" com o espaço usado
- [ ] Sair da conta e conferir que os PDFs sumiram
