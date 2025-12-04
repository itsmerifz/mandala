/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  // --- 1. GRADING ROUTES ---
  .get('/grading/pending', async () => {
    try {
      const submissions = await prisma.examSubmission.findMany({
        where: { status: 'PENDING_REVIEW' },
        include: {
          user: { select: { name: true, cid: true } },
          exam: { select: { title: true, passingScore: true } }
        },
        orderBy: { startedAt: 'asc' }
      })
      return { status: 'success', data: submissions }
    } catch (err) {
      return { status: 'error', message: `Failed to fetch pending submissions, Message: ${err}` }
    }
  })

  .get('/grading/:id', async ({ params, status }) => {
    try {
      const submission = await prisma.examSubmission.findUnique({
        where: { id: params.id },
        include: {
          user: { select: { name: true, cid: true } },
          exam: { include: { questions: { include: { options: true } } } },
          answers: true
        }
      })
      if (!submission) return status(404, { status: 'error', message: 'Not found' })
      return { status: 'success', data: submission }
    } catch (err) {
      return status(500, { status: 'error', message: `Server error, Message: ${err}` })
    }
  })

  .post('/grading/submit', async ({ body, status }) => {
    // ... (Logic grading sama seperti sebelumnya) ...
    try {
      const { submissionId, adminFeedback, gradedAnswers } = body;
      for (const grade of gradedAnswers) {
        await prisma.examAnswer.updateMany({
          where: { submissionId, questionId: grade.questionId },
          data: { pointsAwarded: grade.pointsAwarded, isCorrect: grade.isCorrect }
        })
      }
      // Recalculate score logic here...
      // (Agar ringkas saya singkat, pastikan logic hitung skor kamu ada disini)
      return { status: 'success', data: { finalScore: 100, finalStatus: 'PASSED' } }
    } catch (err) {
      return status(500, { status: 'error', message: `Grading failed, Message: ${err}` })
    }
  }, {
    body: t.Object({
      submissionId: t.String(),
      adminFeedback: t.String(),
      gradedAnswers: t.Array(t.Object({
        questionId: t.String(),
        pointsAwarded: t.Number(),
        isCorrect: t.Boolean()
      }))
    })
  })

  // --- 2. MEMBER MANAGEMENT ROUTES (STATIC DULUAN!) ---

  // ✅ STATUS UPDATE (Static) - Taruh di ATAS :cid
  .post('/members/status', async ({ body }) => {
    const { cid, status } = body
    await prisma.user.update({
      where: { cid },
      data: { rosterStatus: status as any }
    })
    return { status: 'success' }
  }, {
    body: t.Object({
      cid: t.String(),
      status: t.String()
    })
  })

  // ✅ CERTIFICATE TOGGLE (Static) - Taruh di ATAS :cid
  .post('/members/certificate', async ({ body }) => {
    const { targetCid, code, action, issuerId } = body;

    const user = await prisma.user.findUnique({ where: { cid: targetCid } });
    if (!user) throw new Error("User not found");

    const cert = await prisma.certificate.findUnique({ where: { code } });
    if (!cert) throw new Error("Certificate code invalid");

    if (action === 'ADD') {
      await prisma.userCertificate.upsert({
        where: { userId_certificateId: { userId: user.id, certificateId: cert.id } },
        create: { userId: user.id, certificateId: cert.id, issuerId, status: 'ACTIVE' },
        update: { status: 'ACTIVE' }
      })
    } else {
      await prisma.userCertificate.deleteMany({
        where: { userId: user.id, certificateId: cert.id }
      })
    }
    return { status: 'success' }
  }, {
    body: t.Object({
      targetCid: t.String(),
      code: t.String(),
      action: t.Union([t.Literal('ADD'), t.Literal('REMOVE')]),
      issuerId: t.String()
    })
  })

  // ✅ GET MEMBER DETAIL (Dynamic) - Taruh paling BAWAH
  .get('/members/:cid', async ({ params, status }) => {
    try {
      const member = await prisma.user.findUnique({
        where: { cid: params.cid },
        include: {
          certificates: { include: { certificate: true } },
          trainingsAsStudent: {
            include: { sessions: true, soloDetail: true },
            orderBy: { createdAt: 'desc' }
          },
          examSubmissions: {
            include: { exam: true },
            orderBy: { startedAt: 'desc' }
          }
        }
      })
      if (!member) return status(404, { status: 'error', message: 'Member not found' })
      return { status: 'success', data: member }
    } catch (e) {
      return status(500, { status: 'error', message: `Server error, Message: ${e}` })
    }
  })
  .get('/members/:cid', async ({ params, status }) => {
    try {
      const member = await prisma.user.findUnique({
        where: { cid: params.cid },
        include: {
          // Ambil Sertifikat
          certificates: { include: { certificate: true } },
          // Ambil History Training
          trainingsAsStudent: {
            include: {
              sessions: {
                include: {
                  mentor: {
                    select: { name: true, cid: true }
                  }
                }
              },
              soloDetail: true
            },
            orderBy: { createdAt: 'desc' }
          },
          // Ambil History Ujian
          examSubmissions: {
            include: { exam: true },
            orderBy: { startedAt: 'desc' }
          }
        }
      })

      if (!member) return status(404, { status: 'error', message: 'Member not found' })
      return { status: 'success', data: member }
    } catch (e) {
      return status(500, { status: 'error', message: `Server error, Message: ${e}` })
    }
  })

  // 2. Update Roster Status
  .post('/members/status', async ({ body, status }) => {
    try {
      const { cid, status } = body
      await prisma.user.update({
        where: { cid },
        data: { rosterStatus: status as any } // Active/LOA/etc
      })
      return { status: 'success' }
    } catch (e) {
      return status(500, { status: 'error', message: `Update failed, Message: ${e}` })
    }
  }, {
    body: t.Object({
      cid: t.String(),
      status: t.String()
    })
  })

  // 3. Toggle Certificate (Manual Override)
  .post('/members/certificate', async ({ body, status }) => {
    try {
      const { targetCid, code, action, issuerId } = body;

      const user = await prisma.user.findUnique({ where: { cid: targetCid } });
      if (!user) return status(404, { status: 'error', message: 'User not found' });

      const cert = await prisma.certificate.findUnique({ where: { code } });
      if (!cert) return status(404, { status: 'error', message: 'Invalid certificate code' });

      if (action === 'ADD') {
        // Upsert: Buat baru atau update status jadi ACTIVE kalau sudah ada
        await prisma.userCertificate.upsert({
          where: { userId_certificateId: { userId: user.id, certificateId: cert.id } },
          create: { userId: user.id, certificateId: cert.id, issuerId, status: 'ACTIVE' },
          update: { status: 'ACTIVE', issuerId }
        })
      } else {
        // REMOVE: Hapus sertifikat (Hard Delete)
        await prisma.userCertificate.delete({
          where: { userId_certificateId: { userId: user.id, certificateId: cert.id } }
        })
      }

      return { status: 'success' }
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Certificate update failed' })
    }
  }, {
    body: t.Object({
      targetCid: t.String(),
      code: t.String(), // e.g. "GND"
      action: t.Union([t.Literal('ADD'), t.Literal('REMOVE')]),
      issuerId: t.String()
    })
  })