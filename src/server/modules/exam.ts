/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma'

export const examRoutes = new Elysia({ prefix: '/exams' })
  // 1. GET LIST (Biarkan sama)
  .get('/', async ({ query }) => {
    try {
      const { cid, mode } = query;
      if (mode !== 'admin' && !cid) return { status: 'error', message: 'CID required' }

      const user = cid ? await prisma.user.findUnique({ where: { cid } }) : null;

      const exams = await prisma.exam.findMany({
        where: mode === 'admin' ? {} : {}, // Tambah filter published jika perlu
        include: {
          module: { include: { course: true } },
          prerequisite: true,
          _count: { select: { questions: true } },
          submissions: user ? {
            where: { userId: user.id },
            orderBy: { startedAt: 'desc' },
            take: 1,
            select: { status: true, score: true }
          } : false
        },
        orderBy: { title: 'asc' }
      })

      const mappedExams = await Promise.all(exams.map(async (exam) => {
        let isLocked = false;
        if (user && exam.prerequisiteId) {
          const progress = await prisma.courseProgress.findUnique({
            where: { userId_courseId: { userId: user.id, courseId: exam.prerequisiteId } }
          })
          if (!progress?.isCompleted) isLocked = true;
        }

        // Total Bank Soal
        const totalBankQuestions = exam._count.questions;

        // Limit yang disetting Admin
        const limitSetting = exam.questionCount;

        // Tentukan angka yang ditampilkan ke user
        // Jika limit diset (>0) DAN limit lebih kecil dari bank soal -> Pakai Limit
        // Jika tidak -> Pakai Total Bank Soal
        const displayQuestionCount = (limitSetting > 0 && limitSetting < totalBankQuestions)
          ? limitSetting
          : totalBankQuestions;

        return {
          id: exam.id,
          title: exam.title,
          passingScore: exam.passingScore,
          context: exam.module ? `Module: ${exam.module.title}` : "Standalone",

          // Gunakan variabel baru ini
          questionCount: displayQuestionCount,

          lastAttempt: exam.submissions?.[0] || null,
          isLocked,
          prerequisiteTitle: exam.prerequisite?.title
        }
      }))

      return { status: 'success', data: mappedExams }
    } catch (error) {
      return { status: 'error', message: "Failed to fetch exams" }
    }
  }, {
    query: t.Object({
      cid: t.Optional(t.String()),
      mode: t.Optional(t.String())
    })
  })

  // 2. START EXAM (FIX: Resume Logic)
  .post('/:id/start', async ({ params, body, status }) => {
    try {
      const { userId } = body;
      const examId = params.id;

      // --- LOGIC BARU: CEK RESUME ---
      // Cek apakah user punya ujian yang belum selesai (IN_PROGRESS) untuk exam ini?
      const activeSubmission = await prisma.examSubmission.findFirst({
        where: {
          examId: examId,
          userId: userId,
          status: 'IN_PROGRESS'
        }
      });

      // Jika ada, jangan buat baru! Kembalikan yang lama.
      if (activeSubmission) {
        console.log(`🔄 Resuming existing session: ${activeSubmission.id}`);
        return { status: 'success', data: { submissionId: activeSubmission.id } };
      }
      // ------------------------------

      // Jika tidak ada, buat baru (Randomize Soal)
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { questions: true }
      });

      if (!exam) return status(404, { status: 'error', message: 'Exam not found' });

      // Randomizer Logic
      let selectedQuestions = exam.questions;
      if (exam.questionCount > 0 && exam.questionCount < exam.questions.length) {
        // Fisher-Yates Shuffle
        for (let i = selectedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
        }
        selectedQuestions = selectedQuestions.slice(0, exam.questionCount);
      }

      const submission = await prisma.examSubmission.create({
        data: {
          examId,
          userId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          answers: {
            create: selectedQuestions.map(q => ({
              questionId: q.id
            }))
          }
        }
      });

      return { status: 'success', data: { submissionId: submission.id } };

    } catch (e) {
      console.error(e);
      return status(500, { status: 'error', message: 'Failed to start exam' });
    }
  }, {
    body: t.Object({ userId: t.String() })
  })

  // 3. SUBMIT EXAM (FIX: Logic Grading User)
  .post('/submit', async ({ body, status }) => {
    try {
      const { submissionId, answers } = body; // answers = [{ questionId, value }]

      // Ambil Submission beserta soal yang SUDAH DITENTUKAN untuk user ini
      const submission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
          exam: true, // Butuh passingScore
          answers: {
            include: {
              question: {
                include: { options: true } // Butuh kunci jawaban
              }
            }
          }
        }
      });

      if (!submission) return status(404, { status: 'error', message: 'Submission not found' });

      // Safety check: Jangan izinkan submit ulang jika sudah selesai
      if (submission.status !== 'IN_PROGRESS') {
        return status(400, { status: 'error', message: 'Exam already completed' });
      }

      let totalPointsPossible = 0;
      let totalPointsEarned = 0;
      let hasEssay = false;

      const updatePromises = [];

      // Loop berdasarkan SOAL YANG ADA DI LEMBAR JAWABAN (Snapshot)
      for (const ansRecord of submission.answers) {
        const masterQuestion = ansRecord.question;
        if (!masterQuestion) continue;

        // Hitung total poin maksimal (Penyebut)
        totalPointsPossible += masterQuestion.points;

        // Cari jawaban user dari payload frontend
        const userAnswerInput = answers.find((a: any) => a.questionId === masterQuestion.id);
        const userValue = userAnswerInput?.value || null;

        let isCorrect = false;
        let pointsAwarded = 0;

        // --- LOGIKA PENILAIAN ---
        if (masterQuestion.type === 'ESSAY') {
          hasEssay = true;
          // Essay nilainya 0 dulu, status Pending
          isCorrect = false;
          pointsAwarded = 0;

          updatePromises.push(
            prisma.examAnswer.update({
              where: { id: ansRecord.id },
              data: {
                textAnswer: userValue,
                isCorrect: null, // Null = Pending Review
                pointsAwarded: 0
              }
            })
          );
        } else {
          // Pilihan Ganda / True False
          const correctOption = masterQuestion.options.find(o => o.isCorrect);

          // Cek Jawaban (Pastikan value tidak null)
          if (userValue && correctOption && userValue === correctOption.id) {
            isCorrect = true;
            pointsAwarded = masterQuestion.points;
          }

          // Tambahkan ke Pembilang
          totalPointsEarned += pointsAwarded;

          updatePromises.push(
            prisma.examAnswer.update({
              where: { id: ansRecord.id },
              data: {
                selectedOptionId: userValue,
                isCorrect: isCorrect,
                pointsAwarded: pointsAwarded
              }
            })
          );
        }
      }

      // Hitung Skor Akhir
      // Jika totalPointsPossible 0 (misal soal 0), skor 0.
      const finalScore = totalPointsPossible > 0
        ? (totalPointsEarned / totalPointsPossible) * 100
        : 0;

      const roundedScore = parseFloat(finalScore.toFixed(2));

      // Tentukan Status
      let finalStatus = 'FAILED';
      if (hasEssay) {
        finalStatus = 'PENDING_REVIEW';
      } else if (roundedScore >= submission.exam.passingScore) {
        finalStatus = 'PASSED';
      }

      // Eksekusi Database (Parallel)
      await prisma.$transaction([
        ...updatePromises,
        prisma.examSubmission.update({
          where: { id: submissionId },
          data: {
            score: roundedScore,
            status: finalStatus as any,
            completedAt: new Date()
          }
        })
      ]);

      console.log(`✅ USER SUBMIT: Score ${roundedScore} (${finalStatus}) | Essay: ${hasEssay}`);

      return {
        status: 'success',
        data: {
          submissionId,
          result: finalStatus,
          score: roundedScore
        }
      };

    } catch (err) {
      console.error("Submit Error:", err);
      return status(500, { status: 'error', message: 'Failed to submit exam' });
    }
  }, {
    body: t.Object({
      submissionId: t.String(),
      answers: t.Array(t.Object({
        questionId: t.String(),
        value: t.String()
      }))
    })
  })

  // ... (Endpoint lainnya seperti GET submission/:id, Create, dll biarkan sama) ...
  // Pastikan endpoint GET submission/:id ada di file ini ya
  .get('/submission/:id', async ({ params, status }) => {
    try {
      const submission = await prisma.examSubmission.findUnique({
        where: { id: params.id },
        include: {
          exam: { include: { module: true } },
          answers: {
            include: {
              question: {
                include: {
                  options: { select: { id: true, text: true } }
                }
              }
            }
          }
        }
      });
      if (!submission) return status(404, { status: 'error', message: 'Not found' });
      return { status: 'success', data: submission };
    } catch (e) { return status(500, { status: 'error', message: 'Error' }) }
  })