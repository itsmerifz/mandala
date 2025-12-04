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