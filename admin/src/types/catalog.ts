/** Árvore enxuta disciplina → módulos → aulas, para seletores em cascata. */
export type CourseTree = {
  id: number;
  title: string;
  modules: { id: number; title: string; lessons: { id: number; title: string }[] }[];
};
