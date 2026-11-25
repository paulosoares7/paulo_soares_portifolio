-- =====================================================================
-- Projeto: database
-- Arquivo: 002_seed.sql
-- Dados de exemplo: perfil, categorias, Física I (módulos, temas, aulas,
-- atividades), o plano mensal e um aluno de demonstração.
-- Valores marcados com [EXEMPLO] devem ser trocados pelo painel.
-- =====================================================================
USE portfolio;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Administrador inicial
-- A senha real é definida no primeiro acesso pelo script do projeto
-- database (npm run create-admin). O hash abaixo NÃO corresponde a
-- nenhuma senha válida.
-- ---------------------------------------------------------------------
INSERT INTO admin_users (name, email, password_hash) VALUES
('Paulo', 'admin@exemplo.com', '$2b$12$TROQUE.ESTE.HASH.NO.PRIMEIRO.ACESSO.....................');

-- ---------------------------------------------------------------------
-- Perfil e portfólio
-- ---------------------------------------------------------------------
-- lattes_id e orcid_id genéricos: troque pelo painel quando tiver os dados.
INSERT INTO profile (id, full_name, display_name, headline, short_bio, city, lattes_id, orcid_id) VALUES
(1, 'Paulo [Sobrenome]', 'Paulo.', 'Professor de Física e pesquisador em Ensino de Ciências',
 'Professor na SEDUC e na FAMETRO, mestrando no PPGECIM/UFAM. Pesquiso o uso de IA generativa no ensino de Física. [EXEMPLO]',
 'Manaus, AM', '0000000000000000', '0000-0000-0000-0000');

INSERT INTO profile_highlights (value, label, sort_order) VALUES
('10+', 'anos de docência [EXEMPLO]', 1),
('20+', 'publicações [EXEMPLO]', 2),
('500+', 'alunos [EXEMPLO]', 3);

INSERT INTO social_links (network, url, sort_order) VALUES
('instagram', 'https://instagram.com/[usuario]', 1),
('linkedin',  'https://linkedin.com/in/[usuario]', 2),
('youtube',   'https://youtube.com/@[canal]', 3);

INSERT INTO academic_degrees (level, course, institution, start_year, end_year, status, sort_order) VALUES
('masters', 'Mestrado em Ensino de Ciências e Matemática (PPGECIM)', 'Universidade Federal do Amazonas', 2025, NULL, 'in_progress', 1),
('undergraduate', 'Licenciatura em Física [EXEMPLO]', '[Instituição]', NULL, NULL, 'completed', 2);

INSERT INTO experiences (institution, role, start_date, sort_order) VALUES
('SEDUC-AM', 'Professor de Física', NULL, 1),
('FAMETRO',  'Professor (Física Geral II e Fenômenos de Transportes)', NULL, 2);

INSERT INTO research_areas (name, sort_order) VALUES
('Ensino de Física e obstáculos epistemológicos', 1),
('Inteligência artificial generativa na educação', 2),
('Tecnologias digitais e simulações interativas', 3);

INSERT INTO publications (type, title, authors, venue, year, source, is_featured) VALUES
('journal_article', 'Título do artigo [EXEMPLO]', 'SOBRENOME, P.; COAUTOR, A.', 'Revista [Exemplo]', 2026, 'manual', TRUE);

-- ---------------------------------------------------------------------
-- Disciplina de exemplo: Física I
-- ---------------------------------------------------------------------
INSERT INTO categories (id, slug, name, sort_order) VALUES
(1, 'vestibulares',    'Vestibulares',    1),
(2, 'ensino-medio',    'Ensino Médio',    2),
(3, 'ensino-superior', 'Ensino Superior', 3),
(4, 'concursos',       'Concursos',       4);

-- Física I tem conteúdo completo de exemplo. ESA e PSC 1 ficam em rascunho
-- só para mostrar as outras seções do catálogo.
INSERT INTO courses (id, category_id, slug, title, short_description, icon, color, status, sort_order) VALUES
(1, 3, 'fisica-1', 'Física I', 'Cinemática, Leis de Newton e Energia, com vídeos, notas de aula e atividades.', 'atom', '#0EA5E9', 'published', 1),
(2, 4, 'esa',      'ESA - Física', 'Física para o concurso da Escola de Sargentos das Armas. [EXEMPLO]', 'shield', '#22C55E', 'draft', 2),
(3, 1, 'psc-1',    'PSC 1 - Física', 'Física da 1ª etapa do PSC/UFAM. [EXEMPLO]', 'graduation-cap', '#EAB308', 'draft', 3);

INSERT INTO modules (id, course_id, slug, title, description, status, sort_order) VALUES
(1, 1, 'cinematica', 'Cinemática', 'Descrição do movimento: posição, velocidade, aceleração e gráficos.', 'published', 1),
(2, 1, 'dinamica',   'Dinâmica',   'As três Leis de Newton e suas aplicações.', 'published', 2),
(3, 1, 'energia',    'Trabalho e Energia', 'Trabalho, energia cinética, potencial e conservação.', 'published', 3);

INSERT INTO topics (id, module_id, title, sort_order) VALUES
(1, 1, 'Movimento retilíneo uniforme', 1),
(2, 1, 'Movimento uniformemente variado', 2),
(3, 1, 'Gráficos da Cinemática', 3),
(4, 2, 'Leis de Newton', 1),
(5, 2, 'Atrito e plano inclinado', 2),
(6, 3, 'Trabalho e energia cinética', 1),
(7, 3, 'Conservação da energia mecânica', 2);

-- Vídeos de exemplo:
--  1 e 2) aulas grátis de MRU no YouTube (troque SEU_VIDEO_ID pelo ID real).
--  3) MP4 de teste (Big Buck Bunny, Blender Foundation, licença CC BY) numa
--     aula paga, só para testar o player com um vídeo de verdade.
--  4) vídeo hospedado no Bunny ainda em processamento (ID fictício).
INSERT INTO videos (id, title, origin, provider, provider_video_id, external_url, duration_seconds, status) VALUES
(1, 'MRU - conceito, parte 1 (grátis)', 'external', 'youtube', NULL, 'https://www.youtube.com/watch?v=SEU_VIDEO_ID_1', NULL, 'ready'),
(2, 'MRU - conceito, parte 2 (grátis)', 'external', 'youtube', NULL, 'https://www.youtube.com/watch?v=SEU_VIDEO_ID_2', NULL, 'ready'),
(3, 'Vídeo de teste (Big Buck Bunny)', 'external', 'mp4', NULL,
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'ready'),
(4, 'MRUV - aceleração [EXEMPLO]', 'hosted', 'bunny', 'ID-DO-VIDEO-NO-BUNNY', NULL, NULL, 'processing');

-- Aulas: MRU tem 2 aulas grátis (YouTube) + a Atividade 1 grátis.
-- Aulas com video_id NULL aguardam vídeo ("vídeo em breve").
INSERT INTO lessons (topic_id, video_id, slug, title, summary, is_preview, status, sort_order) VALUES
(1, 1,    'o-que-e-movimento',        'MRU: o que é movimento?',          'Referencial, posição e trajetória.', TRUE,  'published', 1),
(1, 2,    'velocidade-constante',     'MRU: velocidade constante',        'Função horária s = s0 + v·t.',       TRUE,  'published', 2),
(2, 4,    'aceleracao',               'Aceleração',                       NULL, FALSE, 'published', 1),
(2, 3,    'equacao-de-torricelli',    'Equação de Torricelli',            'Aula com vídeo de teste.', FALSE, 'published', 2),
(3, NULL, 'grafico-posicao-tempo',    'Gráfico posição × tempo',          NULL, FALSE, 'published', 1),
(3, NULL, 'grafico-velocidade-tempo', 'Gráfico velocidade × tempo e área', NULL, FALSE, 'published', 2),
(4, NULL, 'primeira-lei',             'Primeira Lei: inércia',            NULL, FALSE, 'published', 1),
(4, NULL, 'segunda-lei',              'Segunda Lei: F = m·a',             NULL, FALSE, 'published', 2),
(5, NULL, 'forca-de-atrito',          'Força de atrito',                  NULL, FALSE, 'published', 1),
(6, NULL, 'trabalho-de-uma-forca',    'Trabalho de uma força',            NULL, FALSE, 'published', 1),
(7, NULL, 'energia-mecanica',         'Energia mecânica',                 NULL, FALSE, 'published', 1);

-- Materiais (links fictícios até o upload real pelo painel).
-- Materiais: sempre só visualização na plataforma (sem download).
INSERT INTO materials (course_id, module_id, lesson_id, type, title, external_url, is_preview, sort_order) VALUES
(1, NULL, NULL, 'formula_sheet',  'Formulário de Física I [EXEMPLO]',          'https://exemplo.com/formulario.pdf', TRUE,  1),
(NULL, 1, NULL, 'lecture_notes',  'Notas de aula: Cinemática [EXEMPLO]',       'https://exemplo.com/notas-cinematica.pdf', FALSE, 1),
(NULL, 1, NULL, 'exercise_list',  'Lista 1: MRU e MRUV [EXEMPLO]',             'https://exemplo.com/lista-1.pdf', FALSE, 2),
(NULL, NULL, 1, 'study_material', 'Resumo da aula: referencial [EXEMPLO]',     'https://exemplo.com/resumo-1.pdf', TRUE, 1);

-- Atividade do módulo Cinemática com duas questões.
INSERT INTO activities (id, module_id, title, instructions, difficulty, is_preview, status, sort_order) VALUES
(1, 1, 'Atividade 1: MRU (grátis)', 'Resolva as questões. Você verá a resolução após enviar.', 'easy', TRUE, 'published', 1);

INSERT INTO activity_questions (id, activity_id, type, statement, points, numeric_answer, tolerance_pct, unit, explanation, sort_order) VALUES
(1, 1, 'multiple_choice', 'No gráfico posição × tempo de um MRU, o que representa a inclinação da reta?', 1.00, NULL, NULL, NULL,
   'A inclinação é Δs/Δt, ou seja, a velocidade.', 1),
(2, 1, 'numeric', 'Um carro percorre 180 km em 2 h com velocidade constante. Qual é a velocidade em m/s?', 1.00, 25.0000, 1.00, 'm/s',
   '180 km / 2 h = 90 km/h = 25 m/s.', 2);

INSERT INTO question_options (question_id, text, is_correct, feedback, sort_order) VALUES
(1, 'A velocidade',   TRUE,  'Correto: Δs/Δt.', 1),
(1, 'A aceleração',   FALSE, 'A aceleração é a inclinação do gráfico v × t.', 2),
(1, 'A distância percorrida', FALSE, 'A distância é lida no eixo da posição.', 3),
(1, 'O tempo total',  FALSE, 'O tempo é o eixo horizontal.', 4);

-- ---------------------------------------------------------------------
-- Plano: assinatura mensal com até 3 disciplinas
-- ---------------------------------------------------------------------
INSERT INTO plans (id, name, description, price_cents, billing_cycle, max_courses) VALUES
(1, 'Assinatura mensal', 'Até 3 disciplinas. Troca de 1 disciplina por ciclo, valendo na renovação.', 1990, 'monthly', 3);

-- ---------------------------------------------------------------------
-- Aluno de demonstração com assinatura de cortesia (gateway manual)
-- Código: FIS1-DEMO-2026-TEST  (guardado só como SHA-256 sem hífens)
-- ---------------------------------------------------------------------
INSERT INTO students (id, name, display_name, email) VALUES
(1, 'Aluno Demonstração', 'Aluno Demo', 'aluno.demo@exemplo.com');

INSERT INTO access_codes (id, student_id, code_hash, code_hint) VALUES
(1, 1, SHA2('FIS1DEMO2026TEST', 256), 'TEST');

INSERT INTO subscriptions (id, student_id, plan_id, status, gateway, price_cents, current_period_start, current_period_end) VALUES
(1, 1, 1, 'active', 'manual', 0, CURRENT_TIMESTAMP(3), DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 1 MONTH));

-- Vaga 1 ocupada por Física I; vagas 2 e 3 livres.
INSERT INTO subscription_courses (subscription_id, slot_number, course_id) VALUES (1, 1, 1);

-- ---------------------------------------------------------------------
-- Fórum: um aviso do professor (visível) e uma dúvida de aluno (aguardando aprovação)
-- ---------------------------------------------------------------------
INSERT INTO forum_threads (id, course_id, lesson_id, type, title, admin_user_id, status, is_pinned) VALUES
(1, 1, NULL, 'announcement', 'Bem-vindos à Física I!', 1, 'visible', TRUE);
INSERT INTO forum_posts (thread_id, admin_user_id, status, body) VALUES
(1, 1, 'visible', 'Comecem pelo módulo de Cinemática. As duas aulas de MRU e a Atividade 1 são grátis.');

INSERT INTO forum_threads (id, course_id, lesson_id, type, title, student_id) VALUES
(2, 1, 1, 'question', 'Referencial muda a trajetória?', 1);
INSERT INTO forum_posts (thread_id, student_id, body) VALUES
(2, 1, 'Se eu mudar o referencial, a trajetória do objeto também muda?');

INSERT INTO post_reactions (post_id, student_id, type) VALUES (1, 1, 'like');

INSERT INTO site_settings (setting_key, value) VALUES
('theme', JSON_OBJECT('background', '#0B1622', 'accent', '#0EA5E9')),
('seo',   JSON_OBJECT('title', 'Paulo | Física', 'description', 'Portfólio acadêmico e aulas de Física'));
