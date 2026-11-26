// Tipos de arquivo aceitos no envio (usado no cliente e no servidor).

/** Categoria do arquivo enviado: define pasta, tipos aceitos, tamanho e privacidade. */
export type UploadKind =
  "profile-photo" | "profile-cv" | "course-cover" | "material" | "question-image";

type UploadRule = {
  folder: string;
  accept: string[];
  maxBytes: number;
  /** Privado = servido só por URL assinada de curta duração. */
  isPrivate: boolean;
  label: string;
};

const MB = 1024 * 1024;
const IMAGES = ["image/jpeg", "image/png", "image/webp"];

/** Regras por tipo de envio. */
export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  "profile-photo": {
    folder: "profile",
    accept: IMAGES,
    maxBytes: 5 * MB,
    isPrivate: false,
    label: "Foto (JPG, PNG ou WebP, até 5 MB)",
  },
  // O currículo é público: alimenta o botão "Baixar currículo" do site.
  "profile-cv": {
    folder: "profile",
    accept: ["application/pdf"],
    maxBytes: 10 * MB,
    isPrivate: false,
    label: "PDF até 10 MB",
  },
  "course-cover": {
    folder: "courses",
    accept: IMAGES,
    maxBytes: 5 * MB,
    isPrivate: false,
    label: "Imagem até 5 MB",
  },
  // Materiais pagos: nunca públicos (RN12, PDF só visualizado na plataforma).
  material: {
    folder: "materials",
    accept: ["application/pdf"],
    maxBytes: 50 * MB,
    isPrivate: true,
    label: "PDF até 50 MB",
  },
  "question-image": {
    folder: "questions",
    accept: IMAGES,
    maxBytes: 5 * MB,
    isPrivate: true,
    label: "Imagem até 5 MB",
  },
};

/** Lista dos tipos para validação com Zod. */
export const UPLOAD_KINDS = Object.keys(UPLOAD_RULES) as [UploadKind, ...UploadKind[]];
