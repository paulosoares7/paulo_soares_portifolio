-- =====================================================================
-- Projeto: database  (Portfólio Acadêmico + Plataforma de Aulas)
-- Arquivo: 001_schema.sql
-- Banco:   MySQL 8.0.16+ (InnoDB, utf8mb4)
--
-- Convenções:
--   * Tabelas no plural, snake_case, em inglês; comentários em português.
--   * Chave primária: id INT UNSIGNED AUTO_INCREMENT.
--   * Datas em DATETIME(3) (milissegundos), padrão do Prisma.
--   * Dinheiro em centavos (INT), nunca em FLOAT.
--   * Segredos (senhas, tokens) guardados só como hash. Exceção: o token
--     da sessão do aluno, que o Better Auth guarda e o cookie leva assinado
--     com HMAC (sem o segredo, o valor do banco não abre sessão).
--   * Colunas usadas em CHECK não podem ter ON DELETE CASCADE/SET NULL
--     (regra do MySQL). Nessas FKs vale o padrão RESTRICT: disciplinas e
--     módulos são ARQUIVADOS (status), e alunos são ANONIMIZADOS (LGPD),
--     em vez de apagados.
--
-- Ordem dos blocos:
--   1. Administração      2. Perfil e portfólio    3. Publicações
--   4. Categorias, disciplinas e aulas              5. Vídeos e materiais
--   6. Atividades         7. Alunos e login        8. Assinaturas e pagamentos
--   9. Progresso e logs  10. Fórum e avisos      11. Site
--
-- Modelo de venda: assinatura mensal (Asaas). O aluno escolhe as disciplinas
-- das vagas do plano (padrão 3, até 10; exceção por aluno na assinatura).
-- Pode trocar UMA disciplina por ciclo; a troca vale a partir da próxima
-- renovação.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS portfolio
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio;

SET NAMES utf8mb4;

-- =====================================================================
-- 1. ADMINISTRAÇÃO
-- =====================================================================

-- Usuários do painel administrativo (você e, se houver, monitores).
CREATE TABLE admin_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL COMMENT 'bcrypt',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME(3) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB COMMENT='Conta do painel (hoje só o professor)';

-- Sessões do painel (cookie httpOnly guarda o token; aqui fica só o hash).
CREATE TABLE admin_sessions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL COMMENT 'SHA-256 do token da sessão',
  ip_address    VARCHAR(45) NULL,
  user_agent    VARCHAR(255) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at    DATETIME(3) NOT NULL,
  revoked_at    DATETIME(3) NULL,
  UNIQUE KEY uq_admin_sessions_token (token_hash),
  KEY ix_admin_sessions_user (admin_user_id),
  CONSTRAINT fk_admin_sessions_user FOREIGN KEY (admin_user_id)
    REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- "Esqueci a senha" do painel. O e-mail leva o token; aqui só o SHA-256.
-- Vale 1 hora e uma única vez (used_at preenchido no uso).
CREATE TABLE admin_password_resets (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT UNSIGNED NOT NULL,
  token_hash    CHAR(64) NOT NULL COMMENT 'SHA-256 do token enviado por e-mail',
  ip_address    VARCHAR(45) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at    DATETIME(3) NOT NULL,
  used_at       DATETIME(3) NULL,
  UNIQUE KEY uq_admin_password_resets_token (token_hash),
  KEY ix_admin_password_resets_user (admin_user_id),
  CONSTRAINT fk_admin_password_resets_user FOREIGN KEY (admin_user_id)
    REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Arquivos enviados pelo painel (fotos, PDFs). O arquivo fica no storage;
-- aqui fica só a referência.
CREATE TABLE media_files (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  storage_key   VARCHAR(255) NOT NULL COMMENT 'Caminho no bucket (ex.: materials/2026/lista-1.pdf)',
  public_url    VARCHAR(500) NULL COMMENT 'Preenchido só para arquivos públicos (ex.: foto do perfil)',
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  size_bytes    INT UNSIGNED NOT NULL,
  is_private    BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Privado = servido por URL assinada',
  uploaded_by   INT UNSIGNED NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_media_files_key (storage_key),
  CONSTRAINT fk_media_files_admin FOREIGN KEY (uploaded_by)
    REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 2. PERFIL E PORTFÓLIO
-- =====================================================================

-- Perfil acadêmico. Tabela de linha única (id = 1).
CREATE TABLE profile (
  id               TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  full_name        VARCHAR(150) NOT NULL,
  display_name     VARCHAR(80)  NOT NULL COMMENT 'Nome curto do cabeçalho (ex.: Paulo.)',
  headline         VARCHAR(150) NOT NULL COMMENT 'Ex.: Professor de Física e pesquisador',
  short_bio        VARCHAR(400) NOT NULL COMMENT 'Texto da tela inicial',
  long_bio         TEXT NULL COMMENT 'Texto da página Sobre (Markdown)',
  photo_file_id    INT UNSIGNED NULL,
  cv_file_id       INT UNSIGNED NULL COMMENT 'PDF do botão Baixar currículo',
  photo_url        VARCHAR(500) NULL COMMENT 'Foto por link externo (vale sem arquivo enviado)',
  cv_url           VARCHAR(500) NULL COMMENT 'Currículo por link externo (vale sem arquivo enviado)',
  public_email     VARCHAR(190) NULL,
  city             VARCHAR(100) NULL,
  lattes_id        VARCHAR(20)  NULL COMMENT 'Número do currículo Lattes',
  lattes_url       VARCHAR(255) NULL,
  orcid_id         CHAR(19)     NULL COMMENT 'Formato 0000-0000-0000-0000',
  scholar_url      VARCHAR(255) NULL,
  lattes_updated_at DATE NULL COMMENT 'Data de atualização lida do XML do Lattes',
  updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT ck_profile_single_row CHECK (id = 1),
  CONSTRAINT fk_profile_photo FOREIGN KEY (photo_file_id) REFERENCES media_files(id) ON DELETE SET NULL,
  CONSTRAINT fk_profile_cv    FOREIGN KEY (cv_file_id)    REFERENCES media_files(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Dados do dono do portfólio';

-- Números de destaque da tela inicial (ex.: "10+ anos de docência").
CREATE TABLE profile_highlights (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  value      VARCHAR(20) NOT NULL COMMENT 'Ex.: 10+',
  label      VARCHAR(60) NOT NULL COMMENT 'Ex.: anos de docência',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Links das redes sociais (apenas links, sem API).
CREATE TABLE social_links (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  network    ENUM('instagram','linkedin','youtube','github','x','facebook','tiktok','whatsapp','email','other','lattes') NOT NULL,
  label      VARCHAR(60) NULL,
  url        VARCHAR(255) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- Formação acadêmica (graduação, especialização, mestrado...).
CREATE TABLE academic_degrees (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  level        ENUM('technical','undergraduate','specialization','masters','doctorate','postdoc') NOT NULL,
  course       VARCHAR(200) NOT NULL,
  institution  VARCHAR(200) NOT NULL,
  start_year   SMALLINT UNSIGNED NULL,
  end_year     SMALLINT UNSIGNED NULL COMMENT 'NULL = em andamento',
  status       ENUM('completed','in_progress','incomplete') NOT NULL DEFAULT 'completed',
  thesis_title VARCHAR(500) NULL,
  advisor      VARCHAR(150) NULL,
  source       ENUM('manual','lattes') NOT NULL DEFAULT 'manual',
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Atuação profissional (SEDUC, FAMETRO...).
CREATE TABLE experiences (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution VARCHAR(200) NOT NULL,
  role        VARCHAR(150) NOT NULL,
  description TEXT NULL,
  start_date  DATE NULL,
  end_date    DATE NULL COMMENT 'NULL = atual',
  source      ENUM('manual','lattes') NOT NULL DEFAULT 'manual',
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Áreas e linhas de pesquisa.
CREATE TABLE research_areas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description VARCHAR(400) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- =====================================================================
-- 3. PUBLICAÇÕES (manual, XML do Lattes ou API do ORCID)
-- =====================================================================

CREATE TABLE publications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type         ENUM('journal_article','conference_paper','book','book_chapter',
                    'thesis','dissertation','abstract','technical_report','other') NOT NULL,
  title        VARCHAR(500) NOT NULL,
  authors      VARCHAR(1000) NOT NULL COMMENT 'Como deve aparecer: SOBRENOME, N.; ...',
  venue        VARCHAR(300) NULL COMMENT 'Periódico, evento ou editora',
  year         SMALLINT UNSIGNED NOT NULL,
  volume       VARCHAR(20) NULL,
  issue        VARCHAR(20) NULL,
  pages        VARCHAR(30) NULL,
  doi          VARCHAR(150) NULL,
  url          VARCHAR(500) NULL,
  abstract     TEXT NULL,
  keywords     VARCHAR(500) NULL COMMENT 'Separadas por ponto e vírgula',
  source       ENUM('manual','lattes','orcid') NOT NULL DEFAULT 'manual',
  external_id  VARCHAR(100) NULL COMMENT 'put-code do ORCID ou sequência do Lattes',
  is_featured  BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Aparece no destaque da home',
  is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_publications_source_ext (source, external_id),
  KEY ix_publications_year (year),
  KEY ix_publications_doi (doi)
) ENGINE=InnoDB;

-- Histórico das importações (para saber o que cada importação mudou).
CREATE TABLE import_jobs (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source         ENUM('lattes_xml','orcid_api') NOT NULL,
  status         ENUM('running','success','failed') NOT NULL DEFAULT 'running',
  file_name      VARCHAR(255) NULL,
  items_created  INT UNSIGNED NOT NULL DEFAULT 0,
  items_updated  INT UNSIGNED NOT NULL DEFAULT 0,
  items_skipped  INT UNSIGNED NOT NULL DEFAULT 0,
  message        TEXT NULL,
  started_by     INT UNSIGNED NULL,
  started_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at    DATETIME(3) NULL,
  CONSTRAINT fk_import_jobs_admin FOREIGN KEY (started_by)
    REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 4. CATEGORIAS, DISCIPLINAS, MÓDULOS, TEMAS E AULAS
--    Hierarquia: categories > course_groups > courses > modules > topics > lessons
--    Ex.: Vestibulares > PSC (UFAM) > Física 1 > Cinemática > MRU > aula
-- =====================================================================

-- Seções do catálogo: Vestibulares, Ensino Médio, Ensino Superior, Concursos.
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(80)  NOT NULL COMMENT 'Ex.: vestibulares',
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(300) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

-- Grupos de uma categoria (ex.: PSC (UFAM), ENEM, ESA, 1º ano, Física).
-- Nível obrigatório: toda disciplina fica dentro de um grupo.
CREATE TABLE course_groups (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  slug        VARCHAR(80)  NOT NULL COMMENT 'Usado na URL: /aulas/vestibulares/psc-ufam',
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(300) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_course_groups_category_slug (category_id, slug),
  CONSTRAINT fk_course_groups_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- Disciplinas (ex.: Física I, Física 1 do PSC). As vagas da assinatura são
-- por disciplina.
CREATE TABLE courses (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id          INT UNSIGNED NOT NULL,
  slug              VARCHAR(120) NOT NULL COMMENT 'Usado na URL: /disciplina/fisica-1',
  title             VARCHAR(150) NOT NULL,
  short_description VARCHAR(300) NOT NULL,
  description       TEXT NULL COMMENT 'Markdown',
  cover_file_id     INT UNSIGNED NULL,
  icon              VARCHAR(40) NULL COMMENT 'Nome do ícone lucide (ex.: atom)',
  color             CHAR(7) NULL COMMENT 'Cor do cartão em hex (ex.: #0EA5E9)',
  status            ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  max_free_lessons  SMALLINT UNSIGNED NULL DEFAULT 2 COMMENT 'RN10: máximo de aulas grátis (NULL = sem limite)',
  max_free_activities SMALLINT UNSIGNED NULL DEFAULT 1 COMMENT 'RN10: máximo de atividades grátis (NULL = sem limite)',
  sort_order        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_courses_slug (slug),
  KEY ix_courses_group (group_id),
  CONSTRAINT fk_courses_group FOREIGN KEY (group_id) REFERENCES course_groups(id),
  CONSTRAINT fk_courses_cover FOREIGN KEY (cover_file_id) REFERENCES media_files(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Módulos de uma disciplina (ex.: Cinemática).
CREATE TABLE modules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id   INT UNSIGNED NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status      ENUM('draft','published') NOT NULL DEFAULT 'draft',
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_modules_course_slug (course_id, slug),
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Temas dentro de um módulo (ex.: MRU, MRUV, Gráficos).
CREATE TABLE topics (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id   INT UNSIGNED NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description VARCHAR(400) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_topics_module (module_id),
  CONSTRAINT fk_topics_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 5. VÍDEOS E MATERIAIS
-- =====================================================================

-- Vídeos. O ARQUIVO não fica no MySQL: fica no provedor de streaming
-- (origin = 'hosted') ou é um link externo (origin = 'external').
CREATE TABLE videos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200) NOT NULL COMMENT 'Nome interno no painel',
  origin            ENUM('hosted','external') NOT NULL,
  provider          ENUM('bunny','panda','youtube','vimeo','mp4') NOT NULL,
  provider_video_id VARCHAR(100) NULL COMMENT 'ID no Bunny/Panda (origin = hosted)',
  external_url      VARCHAR(500) NULL COMMENT 'URL do YouTube/Vimeo/MP4 (origin = external)',
  duration_seconds  INT UNSIGNED NULL,
  thumbnail_url     VARCHAR(500) NULL,
  status            ENUM('uploading','processing','ready','failed') NOT NULL DEFAULT 'ready',
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_videos_provider (provider, provider_video_id),
  -- Vídeo hospedado precisa do ID no provedor; link externo precisa da URL.
  CONSTRAINT ck_videos_origin CHECK (
    (origin = 'hosted'   AND provider IN ('bunny','panda') AND provider_video_id IS NOT NULL) OR
    (origin = 'external' AND provider IN ('youtube','vimeo','mp4') AND external_url IS NOT NULL)
  )
) ENGINE=InnoDB;

-- Aulas. Cada aula pertence a um tema e pode ainda não ter vídeo
-- (video_id NULL = "vídeo em breve").
CREATE TABLE lessons (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id    INT UNSIGNED NOT NULL,
  video_id    INT UNSIGNED NULL,
  slug        VARCHAR(120) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  summary     VARCHAR(400) NULL,
  content     TEXT NULL COMMENT 'Texto de apoio da aula (Markdown + LaTeX)',
  is_preview  BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Aula gratuita (vídeo no YouTube), aberta sem assinatura',
  status      ENUM('draft','published') NOT NULL DEFAULT 'draft',
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_lessons_topic_slug (topic_id, slug),
  KEY ix_lessons_video (video_id),
  CONSTRAINT fk_lessons_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_lessons_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notas de aula, materiais de estudo, listas e links.
-- PDFs NUNCA são baixáveis: só visualização na plataforma, com marca d'água.
-- Podem pertencer à disciplina inteira, a um módulo ou a uma aula
-- (exatamente um dos três).
CREATE TABLE materials (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id       INT UNSIGNED NULL,
  module_id       INT UNSIGNED NULL,
  lesson_id       INT UNSIGNED NULL,
  type            ENUM('lecture_notes','study_material','exercise_list','slides','formula_sheet','link') NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     VARCHAR(400) NULL,
  file_id         INT UNSIGNED NULL,
  external_url    VARCHAR(500) NULL,
  is_preview      BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Aberto sem assinatura',
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT ck_materials_one_owner CHECK (
    (course_id IS NOT NULL) + (module_id IS NOT NULL) + (lesson_id IS NOT NULL) = 1
  ),
  CONSTRAINT ck_materials_content CHECK (file_id IS NOT NULL OR external_url IS NOT NULL),
  CONSTRAINT fk_materials_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_materials_module FOREIGN KEY (module_id) REFERENCES modules(id),
  CONSTRAINT fk_materials_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  CONSTRAINT fk_materials_file   FOREIGN KEY (file_id)   REFERENCES media_files(id)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. ATIVIDADES (seção de atividades de cada módulo)
-- =====================================================================

CREATE TABLE activities (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id    INT UNSIGNED NOT NULL,
  title        VARCHAR(200) NOT NULL,
  instructions TEXT NULL,
  difficulty   ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  max_attempts TINYINT UNSIGNED NULL COMMENT 'NULL = ilimitado',
  show_answers ENUM('never','after_submit','after_last_attempt') NOT NULL DEFAULT 'after_submit',
  is_preview   BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Atividade gratuita (fecha o trio de aulas grátis)',
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_activities_module (module_id),
  CONSTRAINT fk_activities_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activity_questions (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id    INT UNSIGNED NOT NULL,
  type           ENUM('multiple_choice','numeric','open') NOT NULL,
  statement      TEXT NOT NULL COMMENT 'Markdown + LaTeX',
  image_file_id  INT UNSIGNED NULL COMMENT 'Gráfico ou figura do enunciado',
  points         DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  numeric_answer DECIMAL(14,4) NULL COMMENT 'Resposta das questões numéricas',
  tolerance_pct  DECIMAL(5,2) NULL COMMENT 'Erro aceito em % (ex.: 2.00)',
  unit           VARCHAR(20) NULL COMMENT 'Ex.: m/s',
  explanation    TEXT NULL COMMENT 'Resolução mostrada após a entrega',
  sort_order     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_questions_activity (activity_id),
  CONSTRAINT fk_questions_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_questions_image FOREIGN KEY (image_file_id) REFERENCES media_files(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE question_options (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  text        VARCHAR(1000) NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  feedback    VARCHAR(500) NULL COMMENT 'Por que esta alternativa está certa ou errada',
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_options_question (question_id),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES activity_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 7. ALUNOS E LOGIN (Better Auth na plataforma)
--    O aluno entra com Google e/ou e-mail e senha. Mesmo e-mail = mesma
--    conta. Os nomes das colunas seguem o que o Better Auth espera.
-- =====================================================================

-- Aluno. A cortesia é uma assinatura com gateway 'manual'.
CREATE TABLE students (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  display_name   VARCHAR(60)  NOT NULL COMMENT 'Nome mostrado no fórum',
  email          VARCHAR(190) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Link de confirmação ou login com Google',
  image          VARCHAR(500) NULL COMMENT 'Foto (vem do Google)',
  is_blocked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_students_email (email)
) ENGINE=InnoDB;

-- Formas de entrar: 'google' ou 'credential' (e-mail e senha).
-- O hash bcrypt da senha fica aqui, só na linha 'credential'.
CREATE TABLE student_accounts (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id               INT UNSIGNED NOT NULL,
  provider_id              VARCHAR(50)  NOT NULL COMMENT 'google | credential',
  account_id               VARCHAR(255) NOT NULL COMMENT 'ID no provedor (credential: o ID do aluno)',
  access_token             TEXT NULL,
  refresh_token            TEXT NULL,
  id_token                 TEXT NULL,
  access_token_expires_at  DATETIME(3) NULL,
  refresh_token_expires_at DATETIME(3) NULL,
  scope                    VARCHAR(500) NULL,
  password                 VARCHAR(100) NULL COMMENT 'Hash bcrypt (vazio para quem só usa Google)',
  created_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_student_accounts_provider (provider_id, account_id),
  KEY ix_student_accounts_student (student_id),
  CONSTRAINT fk_student_accounts_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sessões do aluno (no máximo 2; ao abrir a 3ª, a mais antiga é apagada).
-- O cookie leva o token assinado com HMAC (BETTER_AUTH_SECRET).
CREATE TABLE student_sessions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  token      VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_student_sessions_token (token),
  KEY ix_student_sessions_student (student_id, created_at),
  CONSTRAINT fk_student_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tokens de redefinição de senha do aluno. identifier guarda só o SHA-256
-- do token; validade de 1 hora; a linha é apagada no uso.
CREATE TABLE auth_verifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value      TEXT NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_auth_verifications_identifier (identifier)
) ENGINE=InnoDB;

-- Contador de tentativas de login (por IP e por e-mail). No banco porque
-- na Vercel cada instância tem a sua própria memória.
CREATE TABLE auth_rate_limits (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key`        VARCHAR(255) NOT NULL COMMENT 'Ex.: IP + rota ou email:...',
  `count`      INT UNSIGNED NOT NULL,
  last_request BIGINT NOT NULL COMMENT 'Milissegundos desde 1970',
  UNIQUE KEY uq_auth_rate_limits_key (`key`)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. ASSINATURAS E PAGAMENTOS (gateway: Asaas)
-- =====================================================================

-- Planos à venda. Hoje: um plano mensal com 3 vagas de disciplina.
CREATE TABLE plans (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  description   VARCHAR(400) NULL,
  price_cents   INT UNSIGNED NOT NULL,
  currency      CHAR(3) NOT NULL DEFAULT 'BRL',
  billing_cycle ENUM('monthly','quarterly','semiannual','yearly') NOT NULL DEFAULT 'monthly',
  max_courses   TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Vagas de disciplina (1 a 10)',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT ck_plans_max_courses CHECK (max_courses BETWEEN 1 AND 10)
) ENGINE=InnoDB;

-- Assinatura do aluno. Renova sozinha até ser cancelada.
-- Cancelada = continua com acesso até current_period_end.
-- gateway = 'manual' serve para cortesias liberadas pelo painel.
CREATE TABLE subscriptions (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id              INT UNSIGNED NOT NULL,
  plan_id                 INT UNSIGNED NOT NULL,
  status                  ENUM('pending','active','past_due','canceled','expired') NOT NULL DEFAULT 'pending',
  gateway                 ENUM('asaas','manual') NOT NULL DEFAULT 'asaas',
  gateway_customer_id     VARCHAR(100) NULL COMMENT 'cus_... no Asaas',
  gateway_subscription_id VARCHAR(100) NULL COMMENT 'sub_... no Asaas',
  billing_type            ENUM('pix','pix_automatic','credit_card','boleto') NULL,
  price_cents             INT UNSIGNED NOT NULL COMMENT 'Preço contratado (não muda se o plano mudar)',
  max_courses_override    TINYINT UNSIGNED NULL COMMENT 'Vagas só deste aluno (1 a 10); NULL = as do plano',
  current_period_start    DATETIME(3) NULL,
  current_period_end      DATETIME(3) NULL COMMENT 'Acesso vale até aqui',
  canceled_at             DATETIME(3) NULL,
  created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_subscriptions_gateway (gateway, gateway_subscription_id),
  KEY ix_subscriptions_student (student_id, status),
  CONSTRAINT ck_subscriptions_max_courses CHECK (max_courses_override IS NULL OR max_courses_override BETWEEN 1 AND 10),
  CONSTRAINT fk_subscriptions_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_subscriptions_plan    FOREIGN KEY (plan_id)    REFERENCES plans(id)
) ENGINE=InnoDB;

-- Vagas da assinatura: slot de 1 a 10, sem repetir disciplina. O teto de 10
-- fica no banco (CHECK + chave primária); o limite do plano ou do aluno é
-- conferido no código. Reduzir o limite não apaga vagas: a vaga a mais sai
-- na renovação.
CREATE TABLE subscription_courses (
  subscription_id INT UNSIGNED NOT NULL,
  slot_number     TINYINT UNSIGNED NOT NULL,
  course_id       INT UNSIGNED NOT NULL,
  assigned_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (subscription_id, slot_number),
  UNIQUE KEY uq_subscription_course (subscription_id, course_id),
  CONSTRAINT ck_subscription_slot CHECK (slot_number BETWEEN 1 AND 10),
  CONSTRAINT fk_sub_courses_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_courses_course       FOREIGN KEY (course_id)       REFERENCES courses(id)
) ENGINE=InnoDB;

-- Trocas de disciplina. Regra: uma troca por ciclo; ela é agendada e só
-- é aplicada na renovação (effective_at = fim do período atual).
CREATE TABLE subscription_course_changes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT UNSIGNED NOT NULL,
  slot_number     TINYINT UNSIGNED NOT NULL,
  from_course_id  INT UNSIGNED NULL COMMENT 'NULL = vaga estava vazia',
  to_course_id    INT UNSIGNED NOT NULL,
  status          ENUM('scheduled','applied','canceled') NOT NULL DEFAULT 'scheduled',
  requested_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  effective_at    DATETIME(3) NOT NULL,
  applied_at      DATETIME(3) NULL,
  KEY ix_changes_subscription (subscription_id, status),
  CONSTRAINT ck_changes_slot CHECK (slot_number BETWEEN 1 AND 10),
  CONSTRAINT fk_changes_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_changes_from FOREIGN KEY (from_course_id) REFERENCES courses(id),
  CONSTRAINT fk_changes_to   FOREIGN KEY (to_course_id)   REFERENCES courses(id)
) ENGINE=InnoDB;

-- Cobranças mensais geradas pelo Asaas para cada assinatura.
CREATE TABLE payments (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id    INT UNSIGNED NOT NULL,
  gateway_payment_id VARCHAR(100) NOT NULL COMMENT 'pay_... no Asaas',
  status             ENUM('pending','confirmed','received','overdue','refunded','canceled') NOT NULL DEFAULT 'pending',
  billing_type       ENUM('pix','pix_automatic','credit_card','boleto') NULL,
  amount_cents       INT UNSIGNED NOT NULL,
  net_amount_cents   INT UNSIGNED NULL COMMENT 'Valor líquido após a tarifa',
  due_date           DATE NOT NULL,
  paid_at            DATETIME(3) NULL,
  invoice_url        VARCHAR(500) NULL COMMENT 'Link da fatura/QR Code no Asaas',
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_payments_gateway (gateway_payment_id),
  KEY ix_payments_subscription (subscription_id, due_date),
  CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
) ENGINE=InnoDB;

-- Registro bruto de cada notificação do Asaas. A chave única impede
-- processar o mesmo evento duas vezes (idempotência).
CREATE TABLE payment_events (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  gateway      ENUM('asaas') NOT NULL DEFAULT 'asaas',
  event_id     VARCHAR(100) NOT NULL,
  event_type   VARCHAR(60)  NOT NULL COMMENT 'Ex.: PAYMENT_RECEIVED',
  payment_id   INT UNSIGNED NULL,
  payload      JSON NOT NULL,
  received_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at DATETIME(3) NULL,
  error        VARCHAR(500) NULL,
  UNIQUE KEY uq_payment_events (gateway, event_id),
  CONSTRAINT fk_payment_events_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 9. PROGRESSO, TENTATIVAS E LOGS
-- =====================================================================

CREATE TABLE lesson_progress (
  student_id      INT UNSIGNED NOT NULL,
  lesson_id       INT UNSIGNED NOT NULL,
  seconds_watched INT UNSIGNED NOT NULL DEFAULT 0,
  last_position   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Segundo onde o aluno parou',
  completed_at    DATETIME(3) NULL,
  updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (student_id, lesson_id),
  CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson  FOREIGN KEY (lesson_id)  REFERENCES lessons(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE activity_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id  INT UNSIGNED NOT NULL,
  student_id   INT UNSIGNED NOT NULL,
  score        DECIMAL(6,2) NULL,
  max_score    DECIMAL(6,2) NULL,
  started_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  submitted_at DATETIME(3) NULL,
  KEY ix_attempts_student (student_id, activity_id),
  CONSTRAINT fk_attempts_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_student  FOREIGN KEY (student_id)  REFERENCES students(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attempt_answers (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id         INT UNSIGNED NOT NULL,
  question_id        INT UNSIGNED NOT NULL,
  selected_option_id INT UNSIGNED NULL,
  numeric_value      DECIMAL(14,4) NULL,
  text_value         TEXT NULL COMMENT 'Questões abertas, corrigidas no painel',
  is_correct         BOOLEAN NULL COMMENT 'NULL = aguardando correção',
  points_awarded     DECIMAL(5,2) NULL,
  UNIQUE KEY uq_answers_attempt_question (attempt_id, question_id),
  CONSTRAINT fk_answers_attempt  FOREIGN KEY (attempt_id)  REFERENCES activity_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES activity_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_option   FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Log de acessos ao conteúdo pago (ajuda a detectar conta compartilhada).
CREATE TABLE access_logs (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id     INT UNSIGNED NOT NULL,
  session_id     INT UNSIGNED NULL,
  event          ENUM('login','login_denied','play','material_view','logout') NOT NULL,
  lesson_id      INT UNSIGNED NULL,
  material_id    INT UNSIGNED NULL,
  ip_address     VARCHAR(45) NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_access_logs_student_time (student_id, created_at),
  CONSTRAINT fk_access_logs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_access_logs_session FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_access_logs_lesson  FOREIGN KEY (lesson_id)  REFERENCES lessons(id)  ON DELETE SET NULL,
  CONSTRAINT fk_access_logs_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 10. FÓRUM E AVISOS
--     Tópico (thread) -> posts. O 1º post é o corpo do tópico.
--     type = 'announcement' são os avisos do professor (feed).
--     Posts de aluno só aparecem depois da aprovação no painel.
-- =====================================================================

CREATE TABLE forum_threads (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id     INT UNSIGNED NOT NULL,
  lesson_id     INT UNSIGNED NULL COMMENT 'NULL = discussão geral da disciplina',
  type          ENUM('discussion','question','announcement') NOT NULL DEFAULT 'discussion',
  title         VARCHAR(200) NOT NULL,
  student_id    INT UNSIGNED NULL,
  admin_user_id INT UNSIGNED NULL,
  status        ENUM('visible','pending','hidden') NOT NULL DEFAULT 'pending' COMMENT 'Aluno: pending até aprovação; admin grava visible',
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved   BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Para type = question',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_post_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_threads_course (course_id, type, last_post_at),
  KEY ix_threads_lesson (lesson_id),
  CONSTRAINT ck_threads_author CHECK ((student_id IS NULL) <> (admin_user_id IS NULL)),
  CONSTRAINT fk_threads_course  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_threads_lesson  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  CONSTRAINT fk_threads_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_threads_admin   FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
) ENGINE=InnoDB;

CREATE TABLE forum_posts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  thread_id     INT UNSIGNED NOT NULL,
  student_id    INT UNSIGNED NULL,
  admin_user_id INT UNSIGNED NULL,
  body          TEXT NOT NULL COMMENT 'Markdown + LaTeX',
  status        ENUM('visible','pending','hidden') NOT NULL DEFAULT 'pending' COMMENT 'Aluno: pending até aprovação; admin grava visible',
  is_answer     BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Marcado como resposta oficial',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  edited_at     DATETIME(3) NULL,
  KEY ix_posts_thread (thread_id, created_at),
  CONSTRAINT ck_posts_author CHECK ((student_id IS NULL) <> (admin_user_id IS NULL)),
  CONSTRAINT fk_posts_thread  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_posts_admin   FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
) ENGINE=InnoDB;

-- Reações (curtir, amei, comemorar). Uma por aluno por post.
CREATE TABLE post_reactions (
  post_id    INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  type       ENUM('like','love','celebrate') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, student_id),
  CONSTRAINT fk_reactions_post    FOREIGN KEY (post_id)    REFERENCES forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_reactions_student FOREIGN KEY (student_id) REFERENCES students(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 11. SITE
-- =====================================================================

-- Configurações livres do site (cores, textos do rodapé, SEO...).
CREATE TABLE site_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  value       JSON NOT NULL,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Mensagens do formulário de contato.
CREATE TABLE contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  subject    VARCHAR(200) NULL,
  message    TEXT NOT NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  read_at    DATETIME(3) NULL,
  KEY ix_contact_read (read_at)
) ENGINE=InnoDB;

-- =====================================================================
-- VISÃO ÚTIL: disciplinas que cada aluno pode abrir AGORA.
-- Vale enquanto a assinatura está ativa, ou cancelada/atrasada mas ainda
-- dentro do período pago.
-- =====================================================================
CREATE OR REPLACE VIEW v_student_course_access AS
SELECT s.student_id, sc.course_id, s.id AS subscription_id, s.current_period_end
FROM subscriptions s
JOIN subscription_courses sc ON sc.subscription_id = s.id
WHERE s.status IN ('active','past_due','canceled')
  AND s.current_period_end > CURRENT_TIMESTAMP(3);
