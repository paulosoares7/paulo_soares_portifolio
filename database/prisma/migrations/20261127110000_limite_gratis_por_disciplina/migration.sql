-- RN10 ajustável: o professor define no painel quantas aulas e quantas
-- atividades grátis cada disciplina pode ter. NULL = sem limite. O padrão
-- (2 aulas e 1 atividade) mantém a regra antiga nas disciplinas existentes.
ALTER TABLE `courses`
  ADD COLUMN `max_free_lessons` SMALLINT UNSIGNED NULL DEFAULT 2 AFTER `status`,
  ADD COLUMN `max_free_activities` SMALLINT UNSIGNED NULL DEFAULT 1 AFTER `max_free_lessons`;
