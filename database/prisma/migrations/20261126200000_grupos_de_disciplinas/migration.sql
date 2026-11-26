-- =====================================================================
-- Grupos de disciplinas: nível obrigatório entre a categoria e a disciplina.
--   Categoria → Grupo → Disciplina → Módulo → Tema → Aula
--   Ex.: Vestibulares → PSC (UFAM) → Física 1 → Cinemática → MRU → aula
--   * Nova tabela course_groups (slug único dentro da categoria).
--   * courses.category_id sai: a categoria passa a vir do grupo.
--   * Dados: cada categoria que já tem disciplinas ganha um grupo, e as
--     disciplinas dela entram nele. Slugs das disciplinas não mudam.
-- =====================================================================

-- CreateTable
CREATE TABLE `course_groups` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER UNSIGNED NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(300) NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    UNIQUE INDEX `uq_course_groups_category_slug`(`category_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_groups` ADD CONSTRAINT `fk_course_groups_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Coluna nova, ainda opcional, para receber os dados.
ALTER TABLE `courses` ADD COLUMN `group_id` INTEGER UNSIGNED NULL AFTER `id`;

-- Um grupo por categoria que já tem disciplinas (nomes combinados na
-- reestruturação; categoria desconhecida ganha o grupo "Geral").
INSERT INTO `course_groups` (`category_id`, `slug`, `name`, `sort_order`)
SELECT c.`id`,
       CASE c.`slug`
         WHEN 'vestibulares'    THEN 'psc-ufam'
         WHEN 'concursos'       THEN 'esa'
         WHEN 'ensino-superior' THEN 'fisica'
         ELSE 'geral'
       END,
       CASE c.`slug`
         WHEN 'vestibulares'    THEN 'PSC (UFAM)'
         WHEN 'concursos'       THEN 'ESA'
         WHEN 'ensino-superior' THEN 'Física'
         ELSE 'Geral'
       END,
       1
FROM `categories` c
WHERE EXISTS (SELECT 1 FROM `courses` co WHERE co.`category_id` = c.`id`);

UPDATE `courses` co
JOIN `course_groups` g ON g.`category_id` = co.`category_id`
SET co.`group_id` = g.`id`;

-- Com o grupo, o nome da disciplina não precisa repetir o vestibular.
UPDATE `courses` SET `title` = 'Física 1' WHERE `slug` = 'psc-1' AND `title` = 'PSC 1 - Física';
UPDATE `courses` SET `title` = 'Física'   WHERE `slug` = 'esa'   AND `title` = 'ESA - Física';

-- Agora obrigatório; a ligação antiga com a categoria sai.
ALTER TABLE `courses` MODIFY `group_id` INTEGER UNSIGNED NOT NULL;
ALTER TABLE `courses` DROP FOREIGN KEY `fk_courses_category`;
DROP INDEX `ix_courses_category` ON `courses`;
ALTER TABLE `courses` DROP COLUMN `category_id`;

-- CreateIndex
CREATE INDEX `ix_courses_group` ON `courses`(`group_id`);

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `fk_courses_group` FOREIGN KEY (`group_id`) REFERENCES `course_groups`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
