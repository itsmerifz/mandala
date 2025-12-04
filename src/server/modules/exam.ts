/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma'

export const examRoutes = new Elysia({ prefix: '/exams' })
  .get('/', async ({ query }) => {
    try {
      // Kita butuh CID user untuk cek progress dia
      // (Nanti di frontend kita kirim ?cid=...)
      const userCid = query.cid as string;

      if (!userCid) {
        return { status: 'error', message: 'CID required' }
      }

      const exams = await prisma.exam.findMany({
        include: {
          module: {
            include: {
              course: true // Ambil info Course (Rating min, judul)
            }
          },
          _count: {
            select: { questions: true } // Hitung jumlah soal
          },
          // Cek history submission user ini
          submissions: {
            where: {
              user: { cid: userCid }
            },
            orderBy: { startedAt: 'desc' },
            take: 1, // Ambil yang terakhir saja
            select: {
              status: true,
              score: true,
              startedAt: true
            }
          }
        }
      })

      // Mapping data biar rapi di frontend
      const mappedExams = exams.map(exam => ({
        id: exam.id,
        title: exam.title,
        courseTitle: exam.module.course.title,
        minRating: exam.module.course.minRating,
        questionCount: exam._count.questions,
        // Status user terhadap ujian ini
        lastAttempt: exam.submissions[0] || null
      }))

      return { status: 'success', data: mappedExams }

    } catch (error) {
      console.error("Exam List Error:", error)
      return { status: 'error', message: "Failed to fetch exams" }
    }
  })
  .get('/:id', async ({ params, status }) => {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: params.id },
        include: {
          module: true, // Ambil materi bacaan
          questions: {
            orderBy: { order: 'asc' },
            include: {
              // PENTING: Ambil opsi jawaban, TAPI JANGAN ambil field 'isCorrect'
              // agar user tidak bisa mengintip jawaban di Inspect Element
              options: {
                select: { id: true, text: true }
              }
            }
          }
        }
      })

      if (!exam) return status(404, { status: 'error', message: 'Exam not found' })

      return { status: 'success', data: exam }
    } catch (err) {
      return status(500, { status: 'error', message: `Server error, ${err}` })
    }
  })
  .post('/submit', async ({ body, status }) => {
    try {
      const { examId, userId, answers } = body

      // Ambil Kunci Jawaban dari Database
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { questions: { include: { options: true } } }
      });
      if (!exam) return status(404, { status: 'error', message: 'Exam not found' })

      let totalPoints = 0;
      let earnedPoints = 0;
      let hasEssay = false;

      // Siapkan data jawaban untuk disimpan
      const answersToSave = [];

      // --- LOGIKA PENILAIAN ---
      for (const question of exam.questions) {
        totalPoints += question.points;
        const userAnswer = answers.find((a: any) => a.questionId === question.id);

        let isCorrect = false;
        let pointsAwarded = 0;

        if (question.type === 'ESSAY') {
          hasEssay = true;
          isCorrect = false; // Essay dianggap salah dulu sampai dinilai admin
          // Simpan jawaban teks
          answersToSave.push({
            questionId: question.id,
            textAnswer: userAnswer?.value || "",
            isCorrect: null, // Null artinya butuh review
            pointsAwarded: 0
          });
        } else {
          // Logika Pilihan Ganda / True False
          // Cari opsi yang benar di database
          const correctOption = question.options.find(o => o.isCorrect);

          // Cek apakah user memilih opsi yang benar
          if (userAnswer && userAnswer.value === correctOption?.id) {
            isCorrect = true;
            pointsAwarded = question.points;
            earnedPoints += pointsAwarded;
          }

          answersToSave.push({
            questionId: question.id,
            selectedOptionId: userAnswer?.value || null,
            isCorrect: isCorrect,
            pointsAwarded: pointsAwarded
          });
        }
      }

      // Hitung Skor Akhir (0-100)
      const finalScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      // Tentukan Status Akhir
      let finalStatus = 'FAILED';
      if (hasEssay) {
        finalStatus = 'PENDING_REVIEW';
      } else if (finalScore >= exam.passingScore) {
        finalStatus = 'PASSED';
      }

      // const finalScore = 100
      // const finalStatus = 'PASSED'
      // const submissionId = "dummy_id"

      // Simpan ke Database
      const submission = await prisma.examSubmission.create({
        data: {
          examId,
          userId, // Pastikan ini User ID (CUID), bukan CID!
          score: parseFloat(finalScore.toFixed(2)),
          status: finalStatus as any, // Cast enum
          completedAt: new Date(),
          answers: {
            create: answersToSave
          }
        }
      });

      return {
        status: 'success',
        data: {
          submissionId: submission.id,
          result: finalStatus,
          score: finalScore
        }
      };

    } catch (err) {
      console.error(err);
      return status(500, { status: 'error', message: 'Failed to submit exam' });
    }
  }, {
    body: t.Object({
      examId: t.String(),
      userId: t.String(),
      answers: t.Array(t.Object({
        questionId: t.String(),
        value: t.String()
      }))
    })
  })