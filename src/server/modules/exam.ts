/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export const examRoutes = new Elysia({ prefix: '/exams' })

  // =========================================
  // 1. GET EXAM LIST (User & Admin)
  // =========================================
  .get('/', async ({ query }) => {
    try {
      const { cid, mode } = query;
      if (mode !== 'admin' && !cid) {
        return { status: 'error', message: 'CID required' }
      }

      const user = cid ? await prisma.user.findUnique({ where: { cid } }) : null;

      const exams = await prisma.exam.findMany({
        where: mode === 'admin' ? {} : {
          // Logic Filter Seleksi:
          // Tampilkan jika BUKAN seleksi, ATAU jika seleksi tapi rating user <= minRating
          OR: [
            { isSelection: false },
            { isSelection: true, minRating: { gte: user?.ratingId || 0 } } // Logic: Exam minRating (e.g. 1) >= User Rating
          ]
        },
        include: {
          module: { include: { course: true } },
          prerequisite: true,
          _count: { select: { questions: true } }, // Total Bank Soal
          submissions: user ? {
            where: { userId: user.id },
            orderBy: { startedAt: 'desc' },
            take: 1, // Ambil status terakhir
            select: {
              status: true, score: true, startedAt: true, completedAt: true,
              generatedCode: true
            }
          } : false
        },
        orderBy: { title: 'asc' }
      })

      const mappedExams = await Promise.all(exams.map(async (exam) => {
        let isLocked = false;

        // Cek Prerequisite (Kunci Gembok Course)
        if (user && exam.prerequisiteId) {
          const progress = await prisma.courseProgress.findUnique({
            where: { userId_courseId: { userId: user.id, courseId: exam.prerequisiteId } }
          })
          if (!progress?.isCompleted) isLocked = true;
        }

        // Cek Cooldown (Khusus Seleksi)
        const lastSub = exam.submissions?.[0];
        let cooldownRemaining = 0;
        if (exam.isSelection && lastSub && lastSub.status === 'FAILED') {
          const failTime = new Date(lastSub.completedAt || lastSub.startedAt).getTime();
          const now = new Date().getTime();
          const diffMinutes = (now - failTime) / 60000;
          if (diffMinutes < 30) {
            isLocked = true;
            cooldownRemaining = Math.ceil(30 - diffMinutes);
          }
        }

        // Logic Display Question Count
        const totalBank = exam._count.questions;
        const limit = exam.questionCount;
        const displayCount = (limit > 0 && limit < totalBank) ? limit : totalBank;

        return {
          id: exam.id,
          title: exam.title,
          isSelection: exam.isSelection,
          passingScore: exam.passingScore,
          context: exam.module ? `Module: ${exam.module.title}` : "Selection / Standalone",
          questionCount: displayCount,
          lastAttempt: lastSub || null,
          isLocked,
          cooldownRemaining,
          prerequisiteTitle: exam.prerequisite?.title
        }
      }))

      return { status: 'success', data: mappedExams }

    } catch (e) {
      console.error(e)
      return { status: 'error', message: "Failed to fetch exams" }
    }
  }, {
    query: t.Object({
      cid: t.Optional(t.String()),
      mode: t.Optional(t.String())
    })
  })

  // =========================================
  // 2. START EXAM (Resume & Randomizer)
  // =========================================
  .post('/:id/start', async ({ params, body, status }) => {
    try {
      const { userId } = body;
      const examId = params.id;

      // A. CEK RESUME (Apakah ada sesi IN_PROGRESS?)
      const activeSubmission = await prisma.examSubmission.findFirst({
        where: { examId, userId, status: 'IN_PROGRESS' }
      });

      if (activeSubmission) {
        return {
          status: 'success',
          data: { submissionId: activeSubmission.id, resumed: true }
        };
      }

      // B. Cek Cooldown (Double Check Server Side)
      const lastFail = await prisma.examSubmission.findFirst({
        where: { examId, userId, status: 'FAILED' },
        orderBy: { completedAt: 'desc' }
      });
      if (lastFail) {
        const failTime = new Date(lastFail.completedAt!).getTime()
        const cooldownDuration = 30 * 60 * 1000
        const unlockTime = failTime + cooldownDuration
        if (Date.now() < unlockTime) {
          const timeString = new Date(unlockTime).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
          return status(429, { status: 'error', message: `Cooldown active. Please wait until ${timeString}` });
        }
      }

      // C. BUAT BARU: Ambil Soal dari Bank
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { questions: true }
      });

      if (!exam) return status(404, { status: 'error', message: 'Exam not found' });
      if (exam.questions.length === 0) return status(400, { status: 'error', message: 'Exam has no questions' });

      // D. Randomizer Logic (Fisher-Yates)
      let selectedQuestions = exam.questions;
      if (exam.questionCount > 0 && exam.questionCount < exam.questions.length) {
        const shuffled = [...selectedQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        selectedQuestions = shuffled.slice(0, exam.questionCount);
      }

      // E. Simpan Submission & Snapshot Soal
      const submission = await prisma.examSubmission.create({
        data: {
          examId,
          userId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          answers: {
            create: selectedQuestions.map(q => ({
              questionId: q.id
              // Jawaban user masih kosong
            }))
          }
        }
      });

      return { status: 'success', data: { submissionId: submission.id, resumed: false } };

    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to start exam' });
    }
  }, {
    body: t.Object({ userId: t.String() })
  })

  // =========================================
  // 3. GET SUBMISSION (Untuk Halaman Ujian)
  // =========================================
  .get('/submission/:id', async ({ params, status }) => {
    try {
      const submission = await prisma.examSubmission.findUnique({
        where: { id: params.id },
        include: {
          exam: { include: { module: true } },
          answers: {
            include: {
              // PENTING: Include Detail Question agar tidak blank di frontend
              question: {
                include: {
                  // Include Options (Tanpa isCorrect)
                  options: { select: { id: true, text: true } }
                }
              }
            },
            orderBy: { question: { order: 'asc' } } // Optional: urutkan by order asli
          }
        }
      });

      if (!submission) return status(404, { status: 'error', message: 'Submission not found' });
      return { status: 'success', data: submission };
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Error fetching session' });
    }
  })

  // =========================================
  // 4. SUBMIT EXAM (Grading)
  // =========================================
  .post('/submit', async ({ body, status }) => {
    try {
      const { submissionId, answers, appReason, appExpectation } = body;

      const submission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
          exam: { select: { passingScore: true, isSelection: true } },
          answers: {
            include: {
              question: { include: { options: true } } // Kunci Jawaban
            }
          }
        }
      });

      if (!submission) return status(404, { status: 'error', message: 'Submission not found' })
      if (submission.status !== 'IN_PROGRESS') return status(400, { status: 'error', message: 'Exam already submitted' })

      let totalPointsPossible = 0;
      let totalPointsEarned = 0;
      let hasEssay = false;
      const updatePromises = [];

      // Loop berdasarkan SOAL YANG ADA DI LEMBAR JAWABAN (Snapshot)
      for (const ansRecord of submission.answers) {
        const masterQuestion = ansRecord.question;
        if (!masterQuestion) continue;

        // Hitung penyebut (Max score dari soal terpilih)
        totalPointsPossible += masterQuestion.points;

        const userAnswerInput = answers.find((a: any) => a.questionId === masterQuestion.id);
        const userValue = userAnswerInput?.value || null;

        let isCorrect = false;
        let pointsAwarded = 0;

        if (masterQuestion.type === 'ESSAY') {
          hasEssay = true;
          updatePromises.push(prisma.examAnswer.update({
            where: { id: ansRecord.id },
            data: { textAnswer: userValue, isCorrect: null, pointsAwarded: 0 }
          }));
        } else {
          const correctOption = masterQuestion.options.find(o => o.isCorrect);

          if (userValue && correctOption && userValue === correctOption.id) {
            isCorrect = true;
            pointsAwarded = masterQuestion.points;
          }
          totalPointsEarned += pointsAwarded;

          updatePromises.push(prisma.examAnswer.update({
            where: { id: ansRecord.id },
            data: { selectedOptionId: userValue, isCorrect, pointsAwarded }
          }));
        }
      }

      // Hitung Skor
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

      // Generate Code (Seleksi)
      let generatedCode = null;
      if (submission.exam.isSelection && finalStatus === 'PASSED') {
        const user = await prisma.user.findUnique({ where: { id: submission.userId } });
        const suffix = randomBytes(2).toString('hex').toUpperCase();
        generatedCode = `IDvACC-SEL-${user?.cid || 'UNK'}-${suffix}`;
      }

      // Execute Updates
      await prisma.$transaction([
        ...updatePromises,
        prisma.examSubmission.update({
          where: { id: submissionId },
          data: {
            score: roundedScore,
            status: finalStatus as any,
            completedAt: new Date(),
            appReason: appReason || null,
            appExpectation: appExpectation || null,
            generatedCode
          }
        })
      ]);

      return {
        status: 'success',
        data: { submissionId, result: finalStatus, score: roundedScore, generatedCode }
      };

    } catch (err) {
      console.error("Submit Error:", err);
      return status(500, { status: 'error', message: 'Failed to submit exam' });
    }
  }, {
    body: t.Object({
      submissionId: t.String(),
      answers: t.Array(t.Object({ questionId: t.String(), value: t.String() })),
      appReason: t.Optional(t.String()),
      appExpectation: t.Optional(t.String())
    })
  })

  // =========================================
  // 5. ADMIN CRUD EXAM (Full Edit Features)
  // =========================================

  // Create Exam
  .post('/create', async ({ body, status }) => {
    try {
      const { title, passingScore, prerequisiteId, questions, questionCount, isSelection, minRating } = body;
      const newExam = await prisma.exam.create({
        data: {
          title,
          passingScore,
          prerequisiteId: prerequisiteId || null,
          questionCount: questionCount || 0,
          isSelection: isSelection || false,
          minRating: minRating || 1,
          questions: {
            create: questions.map((q: any, index: number) => ({
              text: q.text,
              type: q.type,
              points: q.points,
              order: index + 1,
              options: {
                create: q.options?.map((opt: any) => ({
                  text: opt.text, isCorrect: opt.isCorrect
                })) || []
              }
            }))
          }
        }
      })
      return { status: 'success', data: newExam }
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to create exam' })
    }
  }, {
    body: t.Object({
      title: t.String(),
      passingScore: t.Number(),
      prerequisiteId: t.Optional(t.String()),
      questionCount: t.Number(),
      isSelection: t.Optional(t.Boolean()),
      minRating: t.Optional(t.Number()),
      questions: t.Array(t.Any())
    })
  })

  // Update Exam Settings
  .put('/:id', async ({ params, body, status }) => {
    try {
      const updated = await prisma.exam.update({
        where: { id: params.id },
        data: {
          title: body.title,
          passingScore: body.passingScore,
          questionCount: body.questionCount,
        }
      })
      return { status: 'success', data: updated }
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to update exam' })
    }
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      passingScore: t.Optional(t.Number()),
      questionCount: t.Optional(t.Number())
    })
  })

  // Delete Exam
  .delete('/:id', async ({ params }) => {
    await prisma.exam.delete({ where: { id: params.id } })
    return { status: 'success' }
  })

  // =========================================
  // 6. ADMIN QUESTION CRUD
  // =========================================

  // Add Question
  .post('/question', async ({ body }) => {
    const newQ = await prisma.question.create({
      data: {
        examId: body.examId,
        text: body.text,
        type: body.type as any,
        points: body.points,
        order: body.order,
        options: {
          create: body.options?.map((opt: any) => ({
            text: opt.text, isCorrect: opt.isCorrect
          }))
        }
      },
      include: { options: true }
    })
    return { status: 'success', data: newQ }
  }, {
    body: t.Object({
      examId: t.String(),
      text: t.String(),
      type: t.String(),
      points: t.Number(),
      order: t.Number(),
      options: t.Optional(t.Array(t.Object({ text: t.String(), isCorrect: t.Boolean() })))
    })
  })

  // Update Question
  .put('/question/:id', async ({ params, body, status }) => {
    try {
      const updatedQ = await prisma.$transaction(async (tx) => {
        const q = await tx.question.update({
          where: { id: params.id },
          data: {
            text: body.text,
            type: body.type as any,
            points: body.points
          }
        })
        if (body.type !== 'ESSAY' && body.options) {
          await tx.questionOption.deleteMany({ where: { questionId: params.id } })
          await tx.questionOption.createMany({
            data: body.options.map((opt: any) => ({
              questionId: params.id,
              text: opt.text,
              isCorrect: opt.isCorrect
            }))
          })
        }
        return q
      })
      return { status: 'success', data: updatedQ }
    } catch (e) {
      console.error(e)
      
      return status(500, { status: 'error', message: 'Failed to update question' })
    }
  }, {
    body: t.Object({
      text: t.String(),
      type: t.String(),
      points: t.Number(),
      options: t.Optional(t.Array(t.Object({
        text: t.String(),
        isCorrect: t.Boolean()
      })))
    })
  })

  // Delete Question
  .delete('/question/:id', async ({ params }) => {
    await prisma.question.delete({ where: { id: params.id } })
    return { status: 'success' }
  })