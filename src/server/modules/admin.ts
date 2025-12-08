/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma'
import { AppRole } from '@root/prisma/generated'

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
          exam: { select: { title: true, passingScore: true } }, // Exam detail secukupnya saja

          // FOKUS DI SINI:
          answers: {
            // Kita ambil detail pertanyaan dari sini, karena inilah soal yang didapat user
            include: {
              selectedOption: true,
              question: {
                include: { options: true } // Ambil opsi jawaban & kunci untuk ditampilkan
              }
            },
            // Urutkan berdasarkan urutan soal asli biar rapi
            orderBy: {
              question: { order: 'asc' }
            }
          }
        }
      })
      if (!submission) return status(404, { status: 'error', message: 'Not found' })
      return { status: 'success', data: submission }
    } catch (err) {
      console.error(err)
      return status(500, { status: 'error', message: 'Server error' })
    }
  })

  .post('/grading/submit', async ({ body, status }) => {
    try {
      const { submissionId, adminFeedback, gradedAnswers } = body;

      // 1. UPDATE NILAI MANUAL DULU
      // (Loop update jawaban essay...)
      await prisma.$transaction(
        gradedAnswers.map((grade: any) =>
          prisma.examAnswer.updateMany({
            where: { submissionId, questionId: grade.questionId },
            data: { pointsAwarded: grade.pointsAwarded, isCorrect: grade.isCorrect }
          })
        )
      );

      // 2. AMBIL DATA FRESH (SUMBER KEBENARAN)
      const freshSubmission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
          exam: { select: { passingScore: true } },
          // PENTING: Kita include 'question' di dalam 'answers'
          // agar kita tahu bobot poin dari soal yang TERSIMPAN di sesi ini saja.
          answers: {
            include: {
              question: { select: { points: true } }
            }
          }
        }
      });

      if (!freshSubmission) return status(404, { status: 'error', message: 'Submission lost' });

      // 3. HITUNG TOTAL POIN (LOGIKA BARU)

      // A. Hitung Total Poin Maksimal (Penyebut)
      // Hanya menjumlahkan poin dari soal yang ada di lembar jawaban ini
      const totalPointsPossible = freshSubmission.answers.reduce(
        (sum, ans) => sum + (ans.question?.points || 0),
        0
      );

      // B. Hitung Poin Didapat (Pembilang)
      const totalPointsEarned = freshSubmission.answers.reduce(
        (sum, ans) => sum + (ans.pointsAwarded || 0),
        0
      );

      // C. Hitung Persentase
      // Cegah pembagian dengan nol
      const finalScore = totalPointsPossible > 0
        ? (totalPointsEarned / totalPointsPossible) * 100
        : 0;

      const roundedScore = parseFloat(finalScore.toFixed(2));
      const finalStatus = roundedScore >= freshSubmission.exam.passingScore ? 'PASSED' : 'FAILED';

      // 4. SIMPAN HASIL
      await prisma.examSubmission.update({
        where: { id: submissionId },
        data: {
          score: roundedScore,
          status: finalStatus as any,
          adminFeedback: adminFeedback
        }
      });

      return {
        status: 'success',
        data: { finalScore: roundedScore, finalStatus: finalStatus }
      };

    } catch (err) {
      console.error("Grading Error:", err);
      return status(500, { status: 'error', message: 'Grading calculation failed' })
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

  // Mentor dan Role Management
  .get('/list/mentors', async () => {
    const mentors = await prisma.user.findMany({
      where: {
        // Ambil semua yang BUKAN member biasa
        role: { in: ['MENTOR', 'STAFF', 'ADMIN'] }
      },
      select: { id: true, name: true, cid: true, ratingShort: true }
    })
    return { status: 'success', data: mentors }
  })

  .post('/members/role', async ({ body, status }) => {
    try {
      await prisma.user.update({
        where: { cid: body.targetCid },
        data: { role: body.role as AppRole }
      })
      return { status: 'success' }
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to update role' })
    }
  }, {
    body: t.Object({
      targetCid: t.String(),
      role: t.String() // 'MEMBER' | 'MENTOR' | 'STAFF' | 'ADMIN'
    })
  })
  .post('/members/assign-mentor', async ({ body, status }) => {
    try {
      const { studentCid, mentorId } = body;

      const student = await prisma.user.findUnique({ where: { cid: studentCid } });
      if (!student) return status(404, { status: 'error', message: 'Student not found' });

      if (student.id === mentorId) {
        return status(400, { status: 'error', message: 'Cannot assign user as their own mentor' });
      }

      // LOGIKA: 
      // Kita cari Training yang sedang aktif (IN_PROGRESS). 
      // Jika ada, update mentornya.
      // Jika tidak ada, buat Training "General" baru.

      const activeTraining = await prisma.training.findFirst({
        where: {
          studentId: student.id,
          status: 'IN_PROGRESS'
        }
      });

      if (activeTraining) {
        // Update training yang ada
        await prisma.training.update({
          where: { id: activeTraining.id },
          data: { mentorId: mentorId }
        });
      } else {
        // Buat training baru
        await prisma.training.create({
          data: {
            studentId: student.id,
            mentorId: mentorId,
            title: 'General Training', // Judul default
            status: 'IN_PROGRESS'
          }
        });
      }

      return { status: 'success' }
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to assign mentor' })
    }
  }, {
    body: t.Object({
      studentCid: t.String(),
      mentorId: t.String() // ID internal (CUID) mentor
    })
  })
  .post('/members/assign-solo', async ({ body, status }) => {
    try {
      const { studentCid, position, validFrom, validUntil } = body;

      // 1. Cari Student
      const student = await prisma.user.findUnique({ where: { cid: studentCid } });
      if (!student) return status(404, { status: 'error', message: 'Student not found' });

      // 2. Cari/Buat Training Aktif
      let activeTraining = await prisma.training.findFirst({
        where: { studentId: student.id, status: 'IN_PROGRESS' }
      });

      if (!activeTraining) {
        activeTraining = await prisma.training.create({
          data: {
            studentId: student.id,
            title: `Training - ${position.split('_')[1] || 'General'}`,
            status: 'IN_PROGRESS'
          }
        });
      }

      // 3. Upsert Solo Detail (Buat baru atau Update yang ada)
      // Asumsi: 1 Training hanya punya 1 Active Solo pada satu waktu
      await prisma.trainingSoloDetail.upsert({
        where: { trainingId: activeTraining.id },
        create: {
          trainingId: activeTraining.id,
          position: position.toUpperCase(),
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil)
        },
        update: {
          position: position.toUpperCase(),
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil)
        }
      });

      return { status: 'success' };

    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to assign solo' })
    }
  }, {
    body: t.Object({
      studentCid: t.String(),
      position: t.String(),
      validFrom: t.String(),  // Dikirim sbg string ISO date
      validUntil: t.String()
    })
  })

  // 5. Revoke Solo Endorsement (Hapus Izin)
  .post('/members/revoke-solo', async ({ body, status }) => {
    try {
      // Cari active training student ini
      const student = await prisma.user.findUnique({ where: { cid: body.studentCid } });
      if (!student) return status(404, { status: 'error', message: 'User not found' });

      const training = await prisma.training.findFirst({
        where: { studentId: student.id, status: 'IN_PROGRESS' }
      });

      if (training) {
        // Hapus detail solo
        await prisma.trainingSoloDetail.deleteMany({
          where: { trainingId: training.id }
        });
      }
      return { status: 'success' }
    } catch (e) {
      console.error(e)
      return status(500, { status: 'error', message: 'Failed to revoke' })
    }
  }, {
    body: t.Object({ studentCid: t.String() })
  })