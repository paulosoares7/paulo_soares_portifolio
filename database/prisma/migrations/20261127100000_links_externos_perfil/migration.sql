-- Foto e currículo do perfil também por link externo (Google Drive,
-- OneDrive, Dropbox ou site). Prioridade na exibição: arquivo enviado
-- (photo_file_id/cv_file_id) → link → arquivo da pasta public do portfólio.
-- Dois comandos (e não um só): o TiDB não aceita AFTER apontando para uma
-- coluna criada no mesmo ALTER. A estrutura final é a mesma.
ALTER TABLE `profile` ADD COLUMN `photo_url` VARCHAR(500) NULL AFTER `cv_file_id`;
ALTER TABLE `profile` ADD COLUMN `cv_url` VARCHAR(500) NULL AFTER `photo_url`;
