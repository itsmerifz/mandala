/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma' // Pastikan path import ini sesuai strukturmu

export const trainingRoutes = new Elysia({ prefix: '/training' })
  // Fetch riwayat training berdasarkan CID
  .get('/history/:cid', async ({ params }) => {
    try {
      console.log(`🔍 Fetching training history for CID: ${params.cid}`);

      const sessions = await prisma.trainingSession.findMany({
        where: {
          training: {
            student: {
              cid: params.cid // Filter via Relasi ke User -> CID
            }
          }
        },
        include: {
          // 1. Info Mentor
          mentor: {
            select: { name: true, cid: true }
          },
          // 2. Info Training Induk (Termasuk Solo Detail!)
          training: {
            select: {
              title: true,
              id: true,
              // PENTING: Ambil info solo endorsement
              soloDetail: true
            }
          }
        },
        orderBy: {
          startTime: 'desc'
        }
      })

      // Debugging: Cek apakah data ditemukan
      console.log(`✅ Found ${sessions.length} sessions.`);

      return { status: 'success', data: sessions }
    } catch (err) {
      console.error("❌ Training fetch error:", err)
      return { status: 'error', message: "Failed to load training history", code: 500 }
    }
  }, {
    // VALIDASI: Pastikan params 'cid' dikirim sebagai string
    params: t.Object({
      cid: t.String()
    })
  })
  .post('/session', async ({ body, status }) => {
    try {
      const { mentorCid, studentCid, position, rating, summary, privateNote } = body;

      // 1. Cari User ID untuk Mentor dan Student berdasarkan CID
      const mentor = await prisma.user.findUnique({ where: { cid: mentorCid } });
      const student = await prisma.user.findUnique({ where: { cid: studentCid } });

      if (!mentor || !student) {
        return status(404, { status: 'error', message: 'Mentor or Student not found' });
      }

      // 2. Cari atau Buat "Training Program" Induk
      // Misal: Jika student ini belum punya record Training aktif, kita buatkan "General Training"
      let training = await prisma.training.findFirst({
        where: {
          studentId: student.id,
          status: 'IN_PROGRESS'
        }
      });

      if (!training) {
        training = await prisma.training.create({
          data: {
            studentId: student.id,
            title: `Training - ${position.split('_')[1] || 'General'}`, // Auto title: Training - TWR
            status: 'IN_PROGRESS'
          }
        });
      }

      // 3. Buat Sesi Latihan
      const session = await prisma.trainingSession.create({
        data: {
          trainingId: training.id,
          mentorId: mentor.id,
          position: position,
          startTime: new Date(), // Asumsi log saat ini, atau bisa dikirim dari frontend
          // duration logic bisa ditambah nanti (endTime)
          rating: rating as any, // Enum: SATISFACTORY, UNSATISFACTORY, EXCELLENT
          summary: summary,
          privateNote: privateNote
        }
      });

      return { status: 'success', data: session };

    } catch (err) {
      console.error("Log Session Error:", err);
      return status(500, { status: 'error', message: 'Failed to log session' });
    }
  }, {
    body: t.Object({
      mentorCid: t.String(),
      studentCid: t.String(),
      position: t.String(),
      duration: t.String(), // e.g. "1h 30m" (disimpan sbg string dulu atau convert nanti)
      rating: t.String(),
      summary: t.String(),
      privateNote: t.Optional(t.String())
    })
  })

  .get('/solo/:cid', async ({ params }) => {
    try {
      // Cari Detail Solo yang terhubung dengan Training yang sedang IN_PROGRESS
      const solo = await prisma.trainingSoloDetail.findFirst({
        where: {
          training: {
            student: { cid: params.cid },
            status: 'IN_PROGRESS'
          }
        }
      })

      if (!solo) return { status: 'empty' }

      // Cek apakah sudah expired
      const now = new Date()
      if (solo.validUntil && new Date(solo.validUntil) < now) {
        return { status: 'expired' }
      }

      return { status: 'success', data: solo }
    } catch (e) {
      console.error(e)
      return { status: 'error' }
    }
  })

  .get('/active/:cid', async ({ params }) => {
    try {
      const training = await prisma.training.findFirst({
        where: {
          student: { cid: params.cid },
          status: 'IN_PROGRESS' // Hanya ambil yang aktif
        },
        select: {
          title: true,
          // Hitung jumlah sesi yang sudah dilakukan
          _count: {
            select: { sessions: true }
          }
        }
      })

      return { status: 'success', data: training }
    } catch (e) {
      console.error(e)
      return { status: 'error', message: "Failed to fetch active training" }
    }
  })