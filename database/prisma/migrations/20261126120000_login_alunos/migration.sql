-- =====================================================================
-- Login dos alunos (Better Auth): Google e/ou e-mail e senha.
--   * Sai o acesso por código (access_codes). A cortesia continua sendo
--     uma assinatura com gateway 'manual'.
--   * student_sessions passa a pertencer ao aluno (máx. 2, regra no app).
--   * Novas: student_accounts, auth_verifications, auth_rate_limits e
--     admin_password_resets.
--   * access_logs passa a apontar para o aluno (dados convertidos abaixo).
--   * social_links ganha a opção 'lattes'.
-- =====================================================================

-- Sessões antigas eram de código: não valem mais (todos entram de novo).
DELETE FROM `student_sessions`;

-- DropForeignKey
ALTER TABLE `access_codes` DROP FOREIGN KEY `fk_access_codes_student`;

-- DropForeignKey
ALTER TABLE `access_logs` DROP FOREIGN KEY `fk_access_logs_code`;

-- DropForeignKey
ALTER TABLE `student_sessions` DROP FOREIGN KEY `fk_student_sessions_code`;

-- DropIndex
DROP INDEX `ix_access_logs_code_time` ON `access_logs`;

-- DropIndex
DROP INDEX `ix_student_sessions_code` ON `student_sessions`;

-- DropIndex
DROP INDEX `uq_student_sessions_token` ON `student_sessions`;

-- AlterTable: access_logs passa de código para aluno, sem perder o histórico.
ALTER TABLE `access_logs` ADD COLUMN `student_id` INTEGER UNSIGNED NULL;
UPDATE `access_logs` l JOIN `access_codes` c ON c.id = l.access_code_id SET l.student_id = c.student_id;
ALTER TABLE `access_logs` DROP COLUMN `access_code_id`,
    MODIFY `student_id` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `social_links` MODIFY `network` ENUM('instagram', 'linkedin', 'youtube', 'github', 'x', 'facebook', 'tiktok', 'whatsapp', 'email', 'other', 'lattes') NOT NULL;

-- AlterTable
ALTER TABLE `student_sessions` DROP COLUMN `access_code_id`,
    DROP COLUMN `device_label`,
    DROP COLUMN `last_seen_at`,
    DROP COLUMN `revoked_at`,
    DROP COLUMN `token_hash`,
    ADD COLUMN `student_id` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `token` VARCHAR(64) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `students` ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `image` VARCHAR(500) NULL;

-- DropTable
DROP TABLE `access_codes`;

-- CreateTable
CREATE TABLE `admin_password_resets` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_user_id` INTEGER UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,

    UNIQUE INDEX `uq_admin_password_resets_token`(`token_hash`),
    INDEX `ix_admin_password_resets_user`(`admin_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_accounts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER UNSIGNED NOT NULL,
    `provider_id` VARCHAR(50) NOT NULL,
    `account_id` VARCHAR(255) NOT NULL,
    `access_token` TEXT NULL,
    `refresh_token` TEXT NULL,
    `id_token` TEXT NULL,
    `access_token_expires_at` DATETIME(3) NULL,
    `refresh_token_expires_at` DATETIME(3) NULL,
    `scope` VARCHAR(500) NULL,
    `password` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_student_accounts_student`(`student_id`),
    UNIQUE INDEX `uq_student_accounts_provider`(`provider_id`, `account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_verifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_auth_verifications_identifier`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_rate_limits` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    `count` INTEGER UNSIGNED NOT NULL,
    `last_request` BIGINT NOT NULL,

    UNIQUE INDEX `uq_auth_rate_limits_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ix_access_logs_student_time` ON `access_logs`(`student_id`, `created_at`);

-- CreateIndex
CREATE UNIQUE INDEX `uq_student_sessions_token` ON `student_sessions`(`token`);

-- CreateIndex
CREATE INDEX `ix_student_sessions_student` ON `student_sessions`(`student_id`, `created_at`);

-- AddForeignKey
ALTER TABLE `admin_password_resets` ADD CONSTRAINT `fk_admin_password_resets_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `student_accounts` ADD CONSTRAINT `fk_student_accounts_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `student_sessions` ADD CONSTRAINT `fk_student_sessions_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `fk_access_logs_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- ON UPDATE CURRENT_TIMESTAMP(3) nas tabelas novas (o Prisma não gera).
ALTER TABLE `student_accounts`   MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `student_sessions`   MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
ALTER TABLE `auth_verifications` MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
