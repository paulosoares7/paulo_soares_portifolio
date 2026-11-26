// =====================================================================
// Seed em TypeScript: os mesmos dados do sql/002_seed.sql.
// Perfil, categorias, Física I (módulos, temas, aulas, atividades),
// o plano mensal e um aluno de demonstração.
// Valores marcados com [EXEMPLO] devem ser trocados pelo painel.
//
// Rodar: npm run seed   (só popula um banco vazio; não duplica dados)
// =====================================================================
import "dotenv/config";
import { prisma } from "../src/index";

/**
 * Hash bcrypt (custo 12) da senha de teste do aluno de demonstração:
 * AlunoDemo2026. Fixo para ser igual ao do sql/002_seed.sql.
 * Só para desenvolvimento: nunca rode o seed em produção.
 */
const DEMO_STUDENT_PASSWORD_HASH = "$2b$12$w8eGovXtvzwwJ1WlRpgQ5./4JGzA.yNoqwELO2xMX13M0sm.X30zG";

/** Insere todos os dados de exemplo numa única transação. */
async function main(): Promise<void> {
  // Seed idempotente: se já existem categorias, o banco já foi populado.
  if ((await prisma.category.count()) > 0) {
    console.log("Seed ignorado: o banco já tem dados.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // -----------------------------------------------------------------
    // Administrador inicial
    // A senha real é definida pelo `npm run create-admin`. O hash abaixo
    // NÃO corresponde a nenhuma senha válida.
    // -----------------------------------------------------------------
    await tx.adminUser.create({
      data: {
        id: 1,
        name: "Paulo",
        email: "admin@exemplo.com",
        passwordHash:
          "$2b$12$TROQUE.ESTE.HASH.NO.PRIMEIRO.ACESSO.....................",
      },
    });

    // -----------------------------------------------------------------
    // Perfil e portfólio
    // lattes_id e orcid_id genéricos: troque pelo painel.
    // -----------------------------------------------------------------
    await tx.profile.create({
      data: {
        id: 1,
        fullName: "Paulo [Sobrenome]",
        displayName: "Paulo.",
        headline: "Professor de Física e pesquisador em Ensino de Ciências",
        shortBio:
          "Professor na SEDUC e na FAMETRO, mestrando no PPGECIM/UFAM. Pesquiso o uso de IA generativa no ensino de Física. [EXEMPLO]",
        city: "Manaus, AM",
        lattesId: "0000000000000000",
        orcidId: "0000-0000-0000-0000",
      },
    });

    await tx.profileHighlight.createMany({
      data: [
        { value: "10+", label: "anos de docência [EXEMPLO]", sortOrder: 1 },
        { value: "20+", label: "publicações [EXEMPLO]", sortOrder: 2 },
        { value: "500+", label: "alunos [EXEMPLO]", sortOrder: 3 },
      ],
    });

    await tx.socialLink.createMany({
      // Links genéricos [EXEMPLO]: troque pelos seus em Redes sociais no painel.
      data: [
        { network: "linkedin", url: "https://www.linkedin.com/in/seu-usuario", sortOrder: 1 },
        { network: "lattes", url: "http://lattes.cnpq.br/0000000000000000", sortOrder: 2 },
        { network: "instagram", url: "https://www.instagram.com/seu-usuario", sortOrder: 3 },
        { network: "facebook", url: "https://www.facebook.com/seu-usuario", sortOrder: 4 },
        { network: "github", url: "https://github.com/seu-usuario", sortOrder: 5 },
        { network: "email", url: "mailto:contato@exemplo.com", sortOrder: 6 },
      ],
    });

    await tx.academicDegree.createMany({
      data: [
        {
          level: "masters",
          course: "Mestrado em Ensino de Ciências e Matemática (PPGECIM)",
          institution: "Universidade Federal do Amazonas",
          startYear: 2025,
          endYear: null,
          status: "in_progress",
          sortOrder: 1,
        },
        {
          level: "undergraduate",
          course: "Licenciatura em Física [EXEMPLO]",
          institution: "[Instituição]",
          status: "completed",
          sortOrder: 2,
        },
      ],
    });

    await tx.experience.createMany({
      data: [
        { institution: "SEDUC-AM", role: "Professor de Física", sortOrder: 1 },
        {
          institution: "FAMETRO",
          role: "Professor (Física Geral II e Fenômenos de Transportes)",
          sortOrder: 2,
        },
      ],
    });

    await tx.researchArea.createMany({
      data: [
        { name: "Ensino de Física e obstáculos epistemológicos", sortOrder: 1 },
        {
          name: "Inteligência artificial generativa na educação",
          sortOrder: 2,
        },
        { name: "Tecnologias digitais e simulações interativas", sortOrder: 3 },
      ],
    });

    await tx.publication.create({
      data: {
        type: "journal_article",
        title: "Título do artigo [EXEMPLO]",
        authors: "SOBRENOME, P.; COAUTOR, A.",
        venue: "Revista [Exemplo]",
        year: 2026,
        source: "manual",
        isFeatured: true,
      },
    });

    // -----------------------------------------------------------------
    // Catálogo e a disciplina de exemplo: Física I
    // -----------------------------------------------------------------
    await tx.category.createMany({
      data: [
        { id: 1, slug: "vestibulares", name: "Vestibulares", sortOrder: 1 },
        { id: 2, slug: "ensino-medio", name: "Ensino Médio", sortOrder: 2 },
        {
          id: 3,
          slug: "ensino-superior",
          name: "Ensino Superior",
          sortOrder: 3,
        },
        { id: 4, slug: "concursos", name: "Concursos", sortOrder: 4 },
      ],
    });

    // Física I tem conteúdo completo. ESA e PSC 1 ficam em rascunho só para
    // mostrar as outras seções do catálogo.
    await tx.course.createMany({
      data: [
        {
          id: 1,
          categoryId: 3,
          slug: "fisica-1",
          title: "Física I",
          shortDescription:
            "Cinemática, Leis de Newton e Energia, com vídeos, notas de aula e atividades.",
          icon: "atom",
          color: "#0EA5E9",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 2,
          categoryId: 4,
          slug: "esa",
          title: "ESA - Física",
          shortDescription:
            "Física para o concurso da Escola de Sargentos das Armas. [EXEMPLO]",
          icon: "shield",
          color: "#22C55E",
          status: "draft",
          sortOrder: 2,
        },
        {
          id: 3,
          categoryId: 1,
          slug: "psc-1",
          title: "PSC 1 - Física",
          shortDescription: "Física da 1ª etapa do PSC/UFAM. [EXEMPLO]",
          icon: "graduation-cap",
          color: "#EAB308",
          status: "draft",
          sortOrder: 3,
        },
      ],
    });

    await tx.module.createMany({
      data: [
        {
          id: 1,
          courseId: 1,
          slug: "cinematica",
          title: "Cinemática",
          description:
            "Descrição do movimento: posição, velocidade, aceleração e gráficos.",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 2,
          courseId: 1,
          slug: "dinamica",
          title: "Dinâmica",
          description: "As três Leis de Newton e suas aplicações.",
          status: "published",
          sortOrder: 2,
        },
        {
          id: 3,
          courseId: 1,
          slug: "energia",
          title: "Trabalho e Energia",
          description: "Trabalho, energia cinética, potencial e conservação.",
          status: "published",
          sortOrder: 3,
        },
      ],
    });

    await tx.topic.createMany({
      data: [
        {
          id: 1,
          moduleId: 1,
          title: "Movimento retilíneo uniforme",
          sortOrder: 1,
        },
        {
          id: 2,
          moduleId: 1,
          title: "Movimento uniformemente variado",
          sortOrder: 2,
        },
        { id: 3, moduleId: 1, title: "Gráficos da Cinemática", sortOrder: 3 },
        { id: 4, moduleId: 2, title: "Leis de Newton", sortOrder: 1 },
        { id: 5, moduleId: 2, title: "Atrito e plano inclinado", sortOrder: 2 },
        {
          id: 6,
          moduleId: 3,
          title: "Trabalho e energia cinética",
          sortOrder: 1,
        },
        {
          id: 7,
          moduleId: 3,
          title: "Conservação da energia mecânica",
          sortOrder: 2,
        },
      ],
    });

    // Vídeos de exemplo:
    //  1 e 2) aulas grátis de MRU no YouTube (troque SEU_VIDEO_ID pelo ID real).
    //  3) MP4 de teste (Big Buck Bunny, Blender Foundation, CC BY) numa aula
    //     paga, só para testar o player com um vídeo de verdade.
    //  4) vídeo hospedado no Bunny ainda em processamento (ID fictício).
    await tx.video.createMany({
      data: [
        {
          id: 1,
          title: "MRU - conceito, parte 1 (grátis)",
          origin: "external",
          provider: "youtube",
          externalUrl: "https://www.youtube.com/watch?v=SEU_VIDEO_ID_1",
          status: "ready",
        },
        {
          id: 2,
          title: "MRU - conceito, parte 2 (grátis)",
          origin: "external",
          provider: "youtube",
          externalUrl: "https://www.youtube.com/watch?v=SEU_VIDEO_ID_2",
          status: "ready",
        },
        {
          id: 3,
          title: "Vídeo de teste (Big Buck Bunny)",
          origin: "external",
          provider: "mp4",
          externalUrl:
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          durationSeconds: 596,
          status: "ready",
        },
        {
          id: 4,
          title: "MRUV - aceleração [EXEMPLO]",
          origin: "hosted",
          provider: "bunny",
          providerVideoId: "ID-DO-VIDEO-NO-BUNNY",
          status: "processing",
        },
      ],
    });

    // Aulas: MRU tem 2 aulas grátis (YouTube) + a Atividade 1 grátis.
    // Aulas com videoId null aguardam vídeo ("vídeo em breve").
    await tx.lesson.createMany({
      data: [
        {
          id: 1,
          topicId: 1,
          videoId: 1,
          slug: "o-que-e-movimento",
          title: "MRU: o que é movimento?",
          summary: "Referencial, posição e trajetória.",
          isPreview: true,
          status: "published",
          sortOrder: 1,
        },
        {
          id: 2,
          topicId: 1,
          videoId: 2,
          slug: "velocidade-constante",
          title: "MRU: velocidade constante",
          summary: "Função horária s = s0 + v·t.",
          isPreview: true,
          status: "published",
          sortOrder: 2,
        },
        {
          id: 3,
          topicId: 2,
          videoId: 4,
          slug: "aceleracao",
          title: "Aceleração",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 4,
          topicId: 2,
          videoId: 3,
          slug: "equacao-de-torricelli",
          title: "Equação de Torricelli",
          summary: "Aula com vídeo de teste.",
          status: "published",
          sortOrder: 2,
        },
        {
          id: 5,
          topicId: 3,
          slug: "grafico-posicao-tempo",
          title: "Gráfico posição × tempo",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 6,
          topicId: 3,
          slug: "grafico-velocidade-tempo",
          title: "Gráfico velocidade × tempo e área",
          status: "published",
          sortOrder: 2,
        },
        {
          id: 7,
          topicId: 4,
          slug: "primeira-lei",
          title: "Primeira Lei: inércia",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 8,
          topicId: 4,
          slug: "segunda-lei",
          title: "Segunda Lei: F = m·a",
          status: "published",
          sortOrder: 2,
        },
        {
          id: 9,
          topicId: 5,
          slug: "forca-de-atrito",
          title: "Força de atrito",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 10,
          topicId: 6,
          slug: "trabalho-de-uma-forca",
          title: "Trabalho de uma força",
          status: "published",
          sortOrder: 1,
        },
        {
          id: 11,
          topicId: 7,
          slug: "energia-mecanica",
          title: "Energia mecânica",
          status: "published",
          sortOrder: 1,
        },
      ],
    });

    // Materiais (links fictícios até o upload real pelo painel).
    // Sempre só visualização na plataforma (sem download).
    await tx.material.createMany({
      data: [
        {
          courseId: 1,
          type: "formula_sheet",
          title: "Formulário de Física I [EXEMPLO]",
          externalUrl: "https://exemplo.com/formulario.pdf",
          isPreview: true,
          sortOrder: 1,
        },
        {
          moduleId: 1,
          type: "lecture_notes",
          title: "Notas de aula: Cinemática [EXEMPLO]",
          externalUrl: "https://exemplo.com/notas-cinematica.pdf",
          sortOrder: 1,
        },
        {
          moduleId: 1,
          type: "exercise_list",
          title: "Lista 1: MRU e MRUV [EXEMPLO]",
          externalUrl: "https://exemplo.com/lista-1.pdf",
          sortOrder: 2,
        },
        {
          lessonId: 1,
          type: "study_material",
          title: "Resumo da aula: referencial [EXEMPLO]",
          externalUrl: "https://exemplo.com/resumo-1.pdf",
          isPreview: true,
          sortOrder: 1,
        },
      ],
    });

    // Atividade do módulo Cinemática com duas questões.
    await tx.activity.create({
      data: {
        id: 1,
        moduleId: 1,
        title: "Atividade 1: MRU (grátis)",
        instructions: "Resolva as questões. Você verá a resolução após enviar.",
        difficulty: "easy",
        isPreview: true,
        status: "published",
        sortOrder: 1,
      },
    });

    await tx.activityQuestion.createMany({
      data: [
        {
          id: 1,
          activityId: 1,
          type: "multiple_choice",
          statement:
            "No gráfico posição × tempo de um MRU, o que representa a inclinação da reta?",
          points: "1.00",
          explanation: "A inclinação é Δs/Δt, ou seja, a velocidade.",
          sortOrder: 1,
        },
        {
          id: 2,
          activityId: 1,
          type: "numeric",
          statement:
            "Um carro percorre 180 km em 2 h com velocidade constante. Qual é a velocidade em m/s?",
          points: "1.00",
          numericAnswer: "25.0000",
          tolerancePct: "1.00",
          unit: "m/s",
          explanation: "180 km / 2 h = 90 km/h = 25 m/s.",
          sortOrder: 2,
        },
      ],
    });

    await tx.questionOption.createMany({
      data: [
        {
          questionId: 1,
          text: "A velocidade",
          isCorrect: true,
          feedback: "Correto: Δs/Δt.",
          sortOrder: 1,
        },
        {
          questionId: 1,
          text: "A aceleração",
          isCorrect: false,
          feedback: "A aceleração é a inclinação do gráfico v × t.",
          sortOrder: 2,
        },
        {
          questionId: 1,
          text: "A distância percorrida",
          isCorrect: false,
          feedback: "A distância é lida no eixo da posição.",
          sortOrder: 3,
        },
        {
          questionId: 1,
          text: "O tempo total",
          isCorrect: false,
          feedback: "O tempo é o eixo horizontal.",
          sortOrder: 4,
        },
      ],
    });

    // -----------------------------------------------------------------
    // Plano: assinatura mensal com até 3 disciplinas (R$ 19,90 em centavos)
    // -----------------------------------------------------------------
    await tx.plan.create({
      data: {
        id: 1,
        name: "Assinatura mensal",
        description:
          "Até 3 disciplinas. Troca de 1 disciplina por ciclo, valendo na renovação.",
        priceCents: 1990,
        billingCycle: "monthly",
        maxCourses: 3,
      },
    });

    // -----------------------------------------------------------------
    // Aluno de demonstração com assinatura de cortesia (gateway manual).
    // Entra com e-mail e senha: aluno.demo@exemplo.com / AlunoDemo2026.
    // E-mail já verificado; a senha fica em student_accounts ('credential').
    // -----------------------------------------------------------------
    await tx.student.create({
      data: {
        id: 1,
        name: "Aluno Demonstração",
        displayName: "Aluno Demo",
        email: "aluno.demo@exemplo.com",
        emailVerified: true,
      },
    });

    await tx.studentAccount.create({
      data: {
        studentId: 1,
        providerId: "credential",
        // No 'credential' o Better Auth usa o próprio ID do aluno.
        accountId: "1",
        password: DEMO_STUDENT_PASSWORD_HASH,
      },
    });

    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setUTCMonth(oneMonthLater.getUTCMonth() + 1);

    await tx.subscription.create({
      data: {
        id: 1,
        studentId: 1,
        planId: 1,
        status: "active",
        gateway: "manual",
        priceCents: 0,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
      },
    });

    // Vaga 1 ocupada por Física I; vagas 2 e 3 livres.
    await tx.subscriptionCourse.create({
      data: { subscriptionId: 1, slotNumber: 1, courseId: 1 },
    });

    // -----------------------------------------------------------------
    // Fórum: um aviso do professor (visível) e uma dúvida de aluno
    // (aguardando aprovação).
    // -----------------------------------------------------------------
    await tx.forumThread.create({
      data: {
        id: 1,
        courseId: 1,
        type: "announcement",
        title: "Bem-vindos à Física I!",
        adminUserId: 1,
        status: "visible",
        isPinned: true,
        posts: {
          create: {
            id: 1,
            adminUserId: 1,
            status: "visible",
            body: "Comecem pelo módulo de Cinemática. As duas aulas de MRU e a Atividade 1 são grátis.",
          },
        },
      },
    });

    await tx.forumThread.create({
      data: {
        id: 2,
        courseId: 1,
        lessonId: 1,
        type: "question",
        title: "Referencial muda a trajetória?",
        studentId: 1,
        posts: {
          create: {
            id: 2,
            studentId: 1,
            body: "Se eu mudar o referencial, a trajetória do objeto também muda?",
          },
        },
      },
    });

    await tx.postReaction.create({
      data: { postId: 1, studentId: 1, type: "like" },
    });

    await tx.siteSetting.createMany({
      data: [
        {
          settingKey: "theme",
          value: { background: "#0B1622", accent: "#0EA5E9" },
        },
        {
          settingKey: "seo",
          value: {
            title: "Paulo | Física",
            description: "Portfólio acadêmico e aulas de Física",
          },
        },
      ],
    });
  });

  console.log("Seed aplicado: Física I com 3 módulos, 7 temas e 11 aulas.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
