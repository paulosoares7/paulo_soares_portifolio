-- =====================================================================
-- Migração inicial gerada a partir de prisma/schema.prisma
-- (prisma migrate diff --from-empty). Equivale a sql/001_schema.sql.
-- O bloco "PARTE MANUAL" no final foi escrito à mão.
-- =====================================================================

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_admin_users_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_sessions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_user_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_admin_sessions_token`(`token_hash`),
    INDEX `ix_admin_sessions_user`(`admin_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media_files` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `storage_key` VARCHAR(255) NOT NULL,
    `public_url` VARCHAR(500) NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size_bytes` INTEGER UNSIGNED NOT NULL,
    `is_private` BOOLEAN NOT NULL DEFAULT true,
    `uploaded_by` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_media_files_key`(`storage_key`),
    INDEX `fk_media_files_admin`(`uploaded_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile` (
    `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `full_name` VARCHAR(150) NOT NULL,
    `display_name` VARCHAR(80) NOT NULL,
    `headline` VARCHAR(150) NOT NULL,
    `short_bio` VARCHAR(400) NOT NULL,
    `long_bio` TEXT NULL,
    `photo_file_id` INTEGER UNSIGNED NULL,
    `cv_file_id` INTEGER UNSIGNED NULL,
    `public_email` VARCHAR(190) NULL,
    `city` VARCHAR(100) NULL,
    `lattes_id` VARCHAR(20) NULL,
    `lattes_url` VARCHAR(255) NULL,
    `orcid_id` CHAR(19) NULL,
    `scholar_url` VARCHAR(255) NULL,
    `lattes_updated_at` DATE NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_profile_photo`(`photo_file_id`),
    INDEX `fk_profile_cv`(`cv_file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_highlights` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(20) NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `social_links` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `network` ENUM('instagram', 'linkedin', 'youtube', 'github', 'x', 'facebook', 'tiktok', 'whatsapp', 'email', 'other') NOT NULL,
    `label` VARCHAR(60) NULL,
    `url` VARCHAR(255) NOT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_degrees` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `level` ENUM('technical', 'undergraduate', 'specialization', 'masters', 'doctorate', 'postdoc') NOT NULL,
    `course` VARCHAR(200) NOT NULL,
    `institution` VARCHAR(200) NOT NULL,
    `start_year` SMALLINT UNSIGNED NULL,
    `end_year` SMALLINT UNSIGNED NULL,
    `status` ENUM('completed', 'in_progress', 'incomplete') NOT NULL DEFAULT 'completed',
    `thesis_title` VARCHAR(500) NULL,
    `advisor` VARCHAR(150) NULL,
    `source` ENUM('manual', 'lattes') NOT NULL DEFAULT 'manual',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experiences` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `institution` VARCHAR(200) NOT NULL,
    `role` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `source` ENUM('manual', 'lattes') NOT NULL DEFAULT 'manual',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `research_areas` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(400) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` ENUM('journal_article', 'conference_paper', 'book', 'book_chapter', 'thesis', 'dissertation', 'abstract', 'technical_report', 'other') NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `authors` VARCHAR(1000) NOT NULL,
    `venue` VARCHAR(300) NULL,
    `year` SMALLINT UNSIGNED NOT NULL,
    `volume` VARCHAR(20) NULL,
    `issue` VARCHAR(20) NULL,
    `pages` VARCHAR(30) NULL,
    `doi` VARCHAR(150) NULL,
    `url` VARCHAR(500) NULL,
    `abstract` TEXT NULL,
    `keywords` VARCHAR(500) NULL,
    `source` ENUM('manual', 'lattes', 'orcid') NOT NULL DEFAULT 'manual',
    `external_id` VARCHAR(100) NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_publications_year`(`year`),
    INDEX `ix_publications_doi`(`doi`),
    UNIQUE INDEX `uq_publications_source_ext`(`source`, `external_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_jobs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `source` ENUM('lattes_xml', 'orcid_api') NOT NULL,
    `status` ENUM('running', 'success', 'failed') NOT NULL DEFAULT 'running',
    `file_name` VARCHAR(255) NULL,
    `items_created` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `items_updated` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `items_skipped` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `message` TEXT NULL,
    `started_by` INTEGER UNSIGNED NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finished_at` DATETIME(3) NULL,

    INDEX `fk_import_jobs_admin`(`started_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(300) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    UNIQUE INDEX `uq_categories_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER UNSIGNED NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `short_description` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `cover_file_id` INTEGER UNSIGNED NULL,
    `icon` VARCHAR(40) NULL,
    `color` CHAR(7) NULL,
    `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_courses_slug`(`slug`),
    INDEX `ix_courses_category`(`category_id`),
    INDEX `fk_courses_cover`(`cover_file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER UNSIGNED NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_modules_course_slug`(`course_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(400) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `ix_topics_module`(`module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `origin` ENUM('hosted', 'external') NOT NULL,
    `provider` ENUM('bunny', 'panda', 'youtube', 'vimeo', 'mp4') NOT NULL,
    `provider_video_id` VARCHAR(100) NULL,
    `external_url` VARCHAR(500) NULL,
    `duration_seconds` INTEGER UNSIGNED NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `status` ENUM('uploading', 'processing', 'ready', 'failed') NOT NULL DEFAULT 'ready',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_videos_provider`(`provider`, `provider_video_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `topic_id` INTEGER UNSIGNED NOT NULL,
    `video_id` INTEGER UNSIGNED NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(400) NULL,
    `content` TEXT NULL,
    `is_preview` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_lessons_video`(`video_id`),
    UNIQUE INDEX `uq_lessons_topic_slug`(`topic_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materials` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER UNSIGNED NULL,
    `module_id` INTEGER UNSIGNED NULL,
    `lesson_id` INTEGER UNSIGNED NULL,
    `type` ENUM('lecture_notes', 'study_material', 'exercise_list', 'slides', 'formula_sheet', 'link') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` VARCHAR(400) NULL,
    `file_id` INTEGER UNSIGNED NULL,
    `external_url` VARCHAR(500) NULL,
    `is_preview` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_materials_course`(`course_id`),
    INDEX `fk_materials_module`(`module_id`),
    INDEX `fk_materials_lesson`(`lesson_id`),
    INDEX `fk_materials_file`(`file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `instructions` TEXT NULL,
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    `max_attempts` TINYINT UNSIGNED NULL,
    `show_answers` ENUM('never', 'after_submit', 'after_last_attempt') NOT NULL DEFAULT 'after_submit',
    `is_preview` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_activities_module`(`module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_questions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('multiple_choice', 'numeric', 'open') NOT NULL,
    `statement` TEXT NOT NULL,
    `image_file_id` INTEGER UNSIGNED NULL,
    `points` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    `numeric_answer` DECIMAL(14, 4) NULL,
    `tolerance_pct` DECIMAL(5, 2) NULL,
    `unit` VARCHAR(20) NULL,
    `explanation` TEXT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `ix_questions_activity`(`activity_id`),
    INDEX `fk_questions_image`(`image_file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `question_id` INTEGER UNSIGNED NOT NULL,
    `text` VARCHAR(1000) NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT false,
    `feedback` VARCHAR(500) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `ix_options_question`(`question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `display_name` VARCHAR(60) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_students_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_codes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `code_hint` CHAR(4) NOT NULL,
    `status` ENUM('active', 'suspended', 'revoked') NOT NULL DEFAULT 'active',
    `max_devices` TINYINT UNSIGNED NOT NULL DEFAULT 2,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_access_codes_hash`(`code_hash`),
    INDEX `ix_access_codes_student`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_sessions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `access_code_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `device_label` VARCHAR(100) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_student_sessions_token`(`token_hash`),
    INDEX `ix_student_sessions_code`(`access_code_id`, `revoked_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(400) NULL,
    `price_cents` INTEGER UNSIGNED NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'BRL',
    `billing_cycle` ENUM('monthly', 'quarterly', 'semiannual', 'yearly') NOT NULL DEFAULT 'monthly',
    `max_courses` TINYINT UNSIGNED NOT NULL DEFAULT 3,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `plan_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('pending', 'active', 'past_due', 'canceled', 'expired') NOT NULL DEFAULT 'pending',
    `gateway` ENUM('asaas', 'manual') NOT NULL DEFAULT 'asaas',
    `gateway_customer_id` VARCHAR(100) NULL,
    `gateway_subscription_id` VARCHAR(100) NULL,
    `billing_type` ENUM('pix', 'pix_automatic', 'credit_card', 'boleto') NULL,
    `price_cents` INTEGER UNSIGNED NOT NULL,
    `current_period_start` DATETIME(3) NULL,
    `current_period_end` DATETIME(3) NULL,
    `canceled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_subscriptions_student`(`student_id`, `status`),
    INDEX `fk_subscriptions_plan`(`plan_id`),
    UNIQUE INDEX `uq_subscriptions_gateway`(`gateway`, `gateway_subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_courses` (
    `subscription_id` INTEGER UNSIGNED NOT NULL,
    `slot_number` TINYINT UNSIGNED NOT NULL,
    `course_id` INTEGER UNSIGNED NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_sub_courses_course`(`course_id`),
    UNIQUE INDEX `uq_subscription_course`(`subscription_id`, `course_id`),
    PRIMARY KEY (`subscription_id`, `slot_number`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_course_changes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `subscription_id` INTEGER UNSIGNED NOT NULL,
    `slot_number` TINYINT UNSIGNED NOT NULL,
    `from_course_id` INTEGER UNSIGNED NULL,
    `to_course_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('scheduled', 'applied', 'canceled') NOT NULL DEFAULT 'scheduled',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effective_at` DATETIME(3) NOT NULL,
    `applied_at` DATETIME(3) NULL,

    INDEX `ix_changes_subscription`(`subscription_id`, `status`),
    INDEX `fk_changes_from`(`from_course_id`),
    INDEX `fk_changes_to`(`to_course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `subscription_id` INTEGER UNSIGNED NOT NULL,
    `gateway_payment_id` VARCHAR(100) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'received', 'overdue', 'refunded', 'canceled') NOT NULL DEFAULT 'pending',
    `billing_type` ENUM('pix', 'pix_automatic', 'credit_card', 'boleto') NULL,
    `amount_cents` INTEGER UNSIGNED NOT NULL,
    `net_amount_cents` INTEGER UNSIGNED NULL,
    `due_date` DATE NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `invoice_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_payments_gateway`(`gateway_payment_id`),
    INDEX `ix_payments_subscription`(`subscription_id`, `due_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_events` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `gateway` ENUM('asaas') NOT NULL DEFAULT 'asaas',
    `event_id` VARCHAR(100) NOT NULL,
    `event_type` VARCHAR(60) NOT NULL,
    `payment_id` INTEGER UNSIGNED NULL,
    `payload` JSON NOT NULL,
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,
    `error` VARCHAR(500) NULL,

    INDEX `fk_payment_events_payment`(`payment_id`),
    UNIQUE INDEX `uq_payment_events`(`gateway`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_progress` (
    `student_id` INTEGER UNSIGNED NOT NULL,
    `lesson_id` INTEGER UNSIGNED NOT NULL,
    `seconds_watched` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `last_position` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `completed_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_progress_lesson`(`lesson_id`),
    PRIMARY KEY (`student_id`, `lesson_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_attempts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `activity_id` INTEGER UNSIGNED NOT NULL,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `score` DECIMAL(6, 2) NULL,
    `max_score` DECIMAL(6, 2) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submitted_at` DATETIME(3) NULL,

    INDEX `ix_attempts_student`(`student_id`, `activity_id`),
    INDEX `fk_attempts_activity`(`activity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attempt_answers` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `attempt_id` INTEGER UNSIGNED NOT NULL,
    `question_id` INTEGER UNSIGNED NOT NULL,
    `selected_option_id` INTEGER UNSIGNED NULL,
    `numeric_value` DECIMAL(14, 4) NULL,
    `text_value` TEXT NULL,
    `is_correct` BOOLEAN NULL,
    `points_awarded` DECIMAL(5, 2) NULL,

    INDEX `fk_answers_question`(`question_id`),
    INDEX `fk_answers_option`(`selected_option_id`),
    UNIQUE INDEX `uq_answers_attempt_question`(`attempt_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `access_code_id` INTEGER UNSIGNED NOT NULL,
    `session_id` INTEGER UNSIGNED NULL,
    `event` ENUM('login', 'login_denied', 'play', 'material_view', 'logout') NOT NULL,
    `lesson_id` INTEGER UNSIGNED NULL,
    `material_id` INTEGER UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_access_logs_code_time`(`access_code_id`, `created_at`),
    INDEX `fk_access_logs_session`(`session_id`),
    INDEX `fk_access_logs_lesson`(`lesson_id`),
    INDEX `fk_access_logs_material`(`material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_threads` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER UNSIGNED NOT NULL,
    `lesson_id` INTEGER UNSIGNED NULL,
    `type` ENUM('discussion', 'question', 'announcement') NOT NULL DEFAULT 'discussion',
    `title` VARCHAR(200) NOT NULL,
    `student_id` INTEGER UNSIGNED NULL,
    `admin_user_id` INTEGER UNSIGNED NULL,
    `status` ENUM('visible', 'pending', 'hidden') NOT NULL DEFAULT 'pending',
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `is_resolved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_post_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_threads_course`(`course_id`, `type`, `last_post_at`),
    INDEX `ix_threads_lesson`(`lesson_id`),
    INDEX `fk_threads_student`(`student_id`),
    INDEX `fk_threads_admin`(`admin_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forum_posts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `thread_id` INTEGER UNSIGNED NOT NULL,
    `student_id` INTEGER UNSIGNED NULL,
    `admin_user_id` INTEGER UNSIGNED NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('visible', 'pending', 'hidden') NOT NULL DEFAULT 'pending',
    `is_answer` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `edited_at` DATETIME(3) NULL,

    INDEX `ix_posts_thread`(`thread_id`, `created_at`),
    INDEX `fk_posts_student`(`student_id`),
    INDEX `fk_posts_admin`(`admin_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_reactions` (
    `post_id` INTEGER UNSIGNED NOT NULL,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('like', 'love', 'celebrate') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_reactions_student`(`student_id`),
    PRIMARY KEY (`post_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `setting_key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`setting_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `subject` VARCHAR(200) NULL,
    `message` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read_at` DATETIME(3) NULL,

    INDEX `ix_contact_read`(`read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_sessions` ADD CONSTRAINT `fk_admin_sessions_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `media_files` ADD CONSTRAINT `fk_media_files_admin` FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `fk_profile_photo` FOREIGN KEY (`photo_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `fk_profile_cv` FOREIGN KEY (`cv_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_jobs` ADD CONSTRAINT `fk_import_jobs_admin` FOREIGN KEY (`started_by`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `fk_courses_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `fk_courses_cover` FOREIGN KEY (`cover_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `modules` ADD CONSTRAINT `fk_modules_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `fk_topics_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `fk_lessons_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `fk_lessons_video` FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `fk_materials_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `fk_materials_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `fk_materials_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `fk_materials_file` FOREIGN KEY (`file_id`) REFERENCES `media_files`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `fk_activities_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activity_questions` ADD CONSTRAINT `fk_questions_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activity_questions` ADD CONSTRAINT `fk_questions_image` FOREIGN KEY (`image_file_id`) REFERENCES `media_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `activity_questions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `access_codes` ADD CONSTRAINT `fk_access_codes_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `student_sessions` ADD CONSTRAINT `fk_student_sessions_code` FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_subscriptions_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscription_courses` ADD CONSTRAINT `fk_sub_courses_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscription_courses` ADD CONSTRAINT `fk_sub_courses_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscription_course_changes` ADD CONSTRAINT `fk_changes_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscription_course_changes` ADD CONSTRAINT `fk_changes_from` FOREIGN KEY (`from_course_id`) REFERENCES `courses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `subscription_course_changes` ADD CONSTRAINT `fk_changes_to` FOREIGN KEY (`to_course_id`) REFERENCES `courses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_events` ADD CONSTRAINT `fk_payment_events_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lesson_progress` ADD CONSTRAINT `fk_progress_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activity_attempts` ADD CONSTRAINT `fk_attempts_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activity_attempts` ADD CONSTRAINT `fk_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `fk_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `activity_attempts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `activity_questions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `attempt_answers` ADD CONSTRAINT `fk_answers_option` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `fk_access_logs_code` FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `fk_access_logs_session` FOREIGN KEY (`session_id`) REFERENCES `student_sessions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `fk_access_logs_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `fk_access_logs_material` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_threads` ADD CONSTRAINT `fk_threads_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_threads` ADD CONSTRAINT `fk_threads_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_threads` ADD CONSTRAINT `fk_threads_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_threads` ADD CONSTRAINT `fk_threads_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_posts` ADD CONSTRAINT `fk_posts_thread` FOREIGN KEY (`thread_id`) REFERENCES `forum_threads`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_posts` ADD CONSTRAINT `fk_posts_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `forum_posts` ADD CONSTRAINT `fk_posts_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `post_reactions` ADD CONSTRAINT `fk_reactions_post` FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `post_reactions` ADD CONSTRAINT `fk_reactions_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- =====================================================================
-- PARTE MANUAL: o que o Prisma não gera a partir do schema.
-- Mantenha igual ao sql/001_schema.sql.
-- =====================================================================

-- ON UPDATE CURRENT_TIMESTAMP(3): o @updatedAt do Prisma só vale para
-- gravações feitas pelo Prisma Client; isto cobre SQL manual também.
ALTER TABLE `admin_users`     MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `profile`         MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `publications`    MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `courses`         MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `modules`         MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `videos`          MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `lessons`         MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `students`        MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `plans`           MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `subscriptions`   MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `payments`        MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `lesson_progress` MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `site_settings`   MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CHECK: regras garantidas pelo próprio banco.
-- Perfil é tabela de linha única.
ALTER TABLE `profile` ADD CONSTRAINT `ck_profile_single_row` CHECK (`id` = 1);

-- Vídeo hospedado precisa do ID no provedor; link externo precisa da URL.
ALTER TABLE `videos` ADD CONSTRAINT `ck_videos_origin` CHECK (
  (`origin` = 'hosted'   AND `provider` IN ('bunny','panda') AND `provider_video_id` IS NOT NULL) OR
  (`origin` = 'external' AND `provider` IN ('youtube','vimeo','mp4') AND `external_url` IS NOT NULL)
);

-- Material pertence a exatamente um dono e tem arquivo ou link.
ALTER TABLE `materials` ADD CONSTRAINT `ck_materials_one_owner` CHECK (
  (`course_id` IS NOT NULL) + (`module_id` IS NOT NULL) + (`lesson_id` IS NOT NULL) = 1
);
ALTER TABLE `materials` ADD CONSTRAINT `ck_materials_content` CHECK (`file_id` IS NOT NULL OR `external_url` IS NOT NULL);

-- Plano com 1 a 3 vagas; vagas numeradas de 1 a 3.
ALTER TABLE `plans` ADD CONSTRAINT `ck_plans_max_courses` CHECK (`max_courses` BETWEEN 1 AND 3);
ALTER TABLE `subscription_courses` ADD CONSTRAINT `ck_subscription_slot` CHECK (`slot_number` BETWEEN 1 AND 3);
ALTER TABLE `subscription_course_changes` ADD CONSTRAINT `ck_changes_slot` CHECK (`slot_number` BETWEEN 1 AND 3);

-- Tópico e post têm um autor: aluno ou admin, nunca os dois.
ALTER TABLE `forum_threads` ADD CONSTRAINT `ck_threads_author` CHECK ((`student_id` IS NULL) <> (`admin_user_id` IS NULL));
ALTER TABLE `forum_posts`   ADD CONSTRAINT `ck_posts_author`   CHECK ((`student_id` IS NULL) <> (`admin_user_id` IS NULL));

-- Visão: disciplinas que cada aluno pode abrir AGORA. Vale enquanto a
-- assinatura está ativa, ou cancelada/atrasada mas dentro do período pago.
CREATE VIEW `v_student_course_access` AS
SELECT s.student_id, sc.course_id, s.id AS subscription_id, s.current_period_end
FROM subscriptions s
JOIN subscription_courses sc ON sc.subscription_id = s.id
WHERE s.status IN ('active','past_due','canceled')
  AND s.current_period_end > CURRENT_TIMESTAMP(3);
