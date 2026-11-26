// Rótulos em português para os valores ENUM do banco.

export const PUBLICATION_TYPES = {
  journal_article: "Artigo",
  conference_paper: "Trabalho em evento",
  book: "Livro",
  book_chapter: "Capítulo de livro",
  thesis: "Tese",
  dissertation: "Dissertação",
  abstract: "Resumo",
  technical_report: "Relatório técnico",
  other: "Outro",
} as const;

export const DEGREE_LEVELS = {
  technical: "Técnico",
  undergraduate: "Graduação",
  specialization: "Especialização",
  masters: "Mestrado",
  doctorate: "Doutorado",
  postdoc: "Pós-doutorado",
} as const;

export const MATERIAL_TYPES = {
  lecture_notes: "Notas de aula",
  study_material: "Material de estudo",
  exercise_list: "Lista de exercícios",
  slides: "Slides",
  formula_sheet: "Formulário",
  link: "Link",
} as const;

export const DIFFICULTIES = { easy: "Fácil", medium: "Médio", hard: "Difícil" } as const;

/** Cor do selo de dificuldade (docs/06-interface.md: Fácil, Médio, Difícil). */
export const DIFFICULTY_TONES = { easy: "success", medium: "warning", hard: "danger" } as const;
