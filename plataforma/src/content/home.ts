// Textos da página inicial da plataforma. RASCUNHO: troque à vontade.
// Preço, limite de disciplinas e grupos NÃO ficam aqui: vêm do banco.

/** Abertura (hero). */
export const HERO = {
  eyebrow: "Plataforma de aulas de Física",
  title: "Física explicada passo a passo, do conceito à prova",
  text: "Videoaulas, notas de aula e atividades com correção automática para Vestibulares, Ensino Médio, Ensino Superior e Concursos. Comece pelas aulas grátis.",
};

/** Como funciona, em 3 passos. {max} vira o limite de disciplinas do plano. */
export const STEPS = [
  {
    title: "Crie a sua conta",
    text: "Entre com o Google ou com e-mail e senha. As aulas grátis já ficam abertas.",
  },
  {
    title: "Escolha até {max} disciplinas",
    text: "Assine e monte o seu plano com as disciplinas que você precisa agora.",
  },
  {
    title: "Estude no seu ritmo",
    text: "Assista às aulas, resolva as atividades e acompanhe o seu progresso.",
  },
];

/** O que está incluído na assinatura. */
export const INCLUDED = [
  {
    icon: "video",
    title: "Videoaulas",
    text: "Aulas curtas e organizadas por módulo e tema, para assistir quando quiser.",
  },
  {
    icon: "activity",
    title: "Atividades com correção",
    text: "Múltipla escolha e questões numéricas corrigidas na hora, com resolução.",
  },
  {
    icon: "material",
    title: "Materiais em PDF",
    text: "Notas de aula e listas de exercícios para ler dentro da plataforma.",
  },
  {
    icon: "forum",
    title: "Fórum com o professor",
    text: "Tire dúvidas na própria aula e acompanhe os avisos de cada disciplina.",
  },
] as const;

/** Chamada final. */
export const FINAL_CTA = {
  title: "Pronto para começar?",
  text: "Assista às aulas grátis agora ou assine para liberar todas as aulas das suas disciplinas.",
};
