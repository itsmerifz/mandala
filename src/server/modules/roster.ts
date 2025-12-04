import { Elysia } from 'elysia'
import { prisma } from '@/lib/prisma'

export const rosterRoutes = new Elysia({ prefix: "/roster" })
  .get('/', async () => {
    try {
      // Ambil semua user
      const members = await prisma.user.findMany({
        select: {
          cid: true,
          name: true,
          ratingId: true,
          ratingShort: true,
          rosterStatus: true, // Pastikan ini ada
          joinDate: true,     // Pastikan ini ada

          // Ambil data sertifikat
          certificates: {
            where: {
              status: 'ACTIVE' // Pastikan hanya ambil yang aktif
            },
            include: {
              certificate: true
            }
          },

          trainingsAsStudent: {
            where: {
              status: 'IN_PROGRESS',
            },
            include: {
              soloDetail: true
            }
          }
        },
        orderBy: {
          ratingId: "desc"
        }
      })

      return { status: "success", data: members }
    } catch (e) {
      return { status: "error", message: `Failed to fetch roster, ${e}`}
    }
  })