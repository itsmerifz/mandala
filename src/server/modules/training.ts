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