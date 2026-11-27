-- Foto e currículo do perfil também por link externo (Google Drive,
-- OneDrive, Dropbox ou site). Prioridade na exibição: arquivo enviado
-- (photo_file_id/cv_file_id) → link → arquivo da pasta public do portfólio.
ALTER TABLE `profile`
  ADD COLUMN `photo_url` VARCHAR(500) NULL AFTER `cv_file_id`,
  ADD COLUMN `cv_url` VARCHAR(500) NULL AFTER `photo_url`;
