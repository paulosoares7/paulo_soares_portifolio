// Rótulos em português para os valores ENUM do banco (seguros para o cliente).

export const SOCIAL_NETWORKS = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
  x: "X (Twitter)",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  email: "E-mail",
  other: "Outro",
  lattes: "Currículo Lattes",
} as const;

/**
 * Redes que podem ser cadastradas, na ordem do formulário. As demais do enum
 * (YouTube, X...) só aparecem em links antigos, que podem ser removidos.
 */
export const SOCIAL_NETWORK_OPTIONS = [
  "linkedin",
  "lattes",
  "instagram",
  "facebook",
  "github",
  "email",
] as const;

export const DEGREE_LEVELS = {
  technical: "Técnico",
  undergraduate: "Graduação",
  specialization: "Especialização",
  masters: "Mestrado",
  doctorate: "Doutorado",
  postdoc: "Pós-doutorado",
} as const;

export const DEGREE_STATUSES = {
  completed: "Concluído",
  in_progress: "Em andamento",
  incomplete: "Incompleto",
} as const;

export const PUBLICATION_TYPES = {
  journal_article: "Artigo em periódico",
  conference_paper: "Trabalho em evento",
  book: "Livro",
  book_chapter: "Capítulo de livro",
  thesis: "Tese",
  dissertation: "Dissertação",
  abstract: "Resumo",
  technical_report: "Relatório técnico",
  other: "Outro",
} as const;

export const PUBLICATION_SOURCES = { manual: "Manual", lattes: "Lattes", orcid: "ORCID" } as const;

export const COURSE_STATUSES = {
  draft: "Rascunho",
  published: "Publicada",
  archived: "Arquivada",
} as const;

export const CONTENT_STATUSES = { draft: "Rascunho", published: "Publicado" } as const;

export const VIDEO_PROVIDERS = {
  bunny: "Bunny Stream",
  panda: "Panda Video",
  youtube: "YouTube",
  vimeo: "Vimeo",
  mp4: "MP4 (link)",
} as const;

export const VIDEO_STATUSES = {
  uploading: "Enviando",
  processing: "Processando",
  ready: "Pronto",
  failed: "Falhou",
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

export const SHOW_ANSWERS = {
  never: "Nunca",
  after_submit: "Após enviar",
  after_last_attempt: "Após a última tentativa",
} as const;

export const QUESTION_TYPES = {
  multiple_choice: "Múltipla escolha",
  numeric: "Numérica",
  open: "Aberta (correção manual)",
} as const;

export const SUBSCRIPTION_STATUSES = {
  pending: "Pendente",
  active: "Ativa",
  past_due: "Em atraso",
  canceled: "Cancelada",
  expired: "Expirada",
} as const;

export const PAYMENT_STATUSES = {
  pending: "Pendente",
  confirmed: "Confirmado",
  received: "Recebido",
  overdue: "Vencido",
  refunded: "Estornado",
  canceled: "Cancelado",
} as const;

export const BILLING_TYPES = {
  pix: "Pix",
  pix_automatic: "Pix Automático",
  credit_card: "Cartão",
  boleto: "Boleto",
} as const;

export const BILLING_CYCLES = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  yearly: "Anual",
} as const;

export const THREAD_TYPES = {
  discussion: "Discussão",
  question: "Dúvida",
  announcement: "Aviso",
} as const;

export const MODERATION_STATUSES = {
  visible: "Visível",
  pending: "Aguardando",
  hidden: "Oculto",
} as const;

/**
 * Chaves de um mapa de rótulos como tupla, para z.enum().
 * @param labels Mapa valor → rótulo.
 * @returns Lista de valores.
 */
export function enumValues<T extends Record<string, string>>(
  labels: T,
): [keyof T & string, ...(keyof T & string)[]] {
  return Object.keys(labels) as [keyof T & string, ...(keyof T & string)[]];
}

/**
 * Como o aluno entra na plataforma, a partir das contas dele (student_accounts).
 * @param providers provider_id de cada conta ("google", "credential").
 * @returns Texto curto para o painel.
 */
export function signInMethodsLabel(providers: string[]): string {
  const google = providers.includes("google");
  const password = providers.includes("credential");
  if (google && password) return "Google e e-mail";
  if (google) return "Google";
  if (password) return "E-mail e senha";
  // Ex.: aluno de cortesia que ainda não entrou nem criou senha.
  return "Ainda sem acesso";
}
