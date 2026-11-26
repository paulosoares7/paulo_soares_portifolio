-- =====================================================================
-- Vagas configuráveis: o plano define de 1 a 10 vagas (padrão 3) e cada
-- assinatura pode ter uma exceção (max_courses_override).
--   * Os CHECKs que limitavam a 3 passam a aceitar até 10.
--   * Reduzir o limite não apaga disciplinas: a vaga a mais sai na
--     renovação (regra no código).
-- =====================================================================

ALTER TABLE `plans` DROP CHECK `ck_plans_max_courses`;
ALTER TABLE `plans` ADD CONSTRAINT `ck_plans_max_courses` CHECK (`max_courses` BETWEEN 1 AND 10);

ALTER TABLE `subscription_courses` DROP CHECK `ck_subscription_slot`;
ALTER TABLE `subscription_courses` ADD CONSTRAINT `ck_subscription_slot` CHECK (`slot_number` BETWEEN 1 AND 10);

ALTER TABLE `subscription_course_changes` DROP CHECK `ck_changes_slot`;
ALTER TABLE `subscription_course_changes` ADD CONSTRAINT `ck_changes_slot` CHECK (`slot_number` BETWEEN 1 AND 10);

-- Exceção por aluno (NULL = vale o número do plano).
ALTER TABLE `subscriptions` ADD COLUMN `max_courses_override` TINYINT UNSIGNED NULL AFTER `price_cents`;
ALTER TABLE `subscriptions` ADD CONSTRAINT `ck_subscriptions_max_courses`
  CHECK (`max_courses_override` IS NULL OR `max_courses_override` BETWEEN 1 AND 10);
