/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Elysia, t } from 'elysia'
import { prisma } from '@/lib/prisma'

export const lmsRoutes = new Elysia({ prefix: '/lms' })
  // 1. Get Course List (With Progress Calculation)
  .get('/', async ({ query }) => {
    try {
      const userCid = query.cid as string
      const mode = query.mode as string // <--- Parameter baru

      // Tentukan filter: Kalau admin, ambil semua. Kalau user, cuma yang published.
      const whereClause = mode === 'admin' ? {} : { isPublished: true }

      // Ambil User ID internal dulu (hanya jika bukan mode admin murni)
      let userId = null;
      if (userCid && userCid !== 'admin') {
        const user = await prisma.user.findUnique({ where: { cid: userCid } })
        if (user) userId = user.id
      }

      const courses = await prisma.course.findMany({
        where: whereClause, // <--- Gunakan filter dinamis ini
        include: {
          _count: { select: { modules: true } },
          progress: {
            // Hanya ambil progress jika userId ada
            where: userId ? { userId: userId } : undefined
          }
        },
        orderBy: { createdAt: 'desc' } // Urutkan yang baru dibuat di atas
      })

      const mappedCourses = courses.map(c => {
        const prog = c.progress[0]
        return {
          ...c,
          isCompleted: prog?.isCompleted || false,
          completedAt: prog?.completedAt || null
        }
      })

      return { status: 'success', data: mappedCourses }
    } catch (e) {
      console.error(e)
      return { status: 'error', message: "Failed to fetch courses" }
    }
  }, {
    // Validasi Query Params
    query: t.Object({
      cid: t.String(),
      mode: t.Optional(t.String()) // Optional, bisa 'admin' atau kosong
    })
  })

  // 2. Get Course Detail (Modules List)
  .get('/:courseId', async ({ params }) => {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { exam: { select: { id: true } } } // Cek kalo ada exam
        }
      }
    })
    return { status: 'success', data: course }
  })

  // 3. Mark Course as Complete
  .post('/complete', async ({ body }) => {
    const { userCid, courseId } = body

    const user = await prisma.user.findUnique({ where: { cid: userCid } })
    if (!user) throw new Error("User not found")

    await prisma.courseProgress.upsert({
      where: {
        userId_courseId: { userId: user.id, courseId }
      },
      create: {
        userId: user.id, courseId, isCompleted: true, completedAt: new Date()
      },
      update: {
        isCompleted: true, completedAt: new Date()
      }
    })
    return { status: 'success' }
  }, {
    body: t.Object({
      userCid: t.String(),
      courseId: t.String()
    })
  })
  // --- ADMIN: CREATE COURSE ---
  .post('/create', async ({ body, status }) => {
    try {
      const newCourse = await prisma.course.create({
        data: {
          title: body.title,
          description: body.description,
          minRating: body.minRating,
          isPublished: false // Default draft
        }
      })
      return { status: 'success', data: newCourse }
    } catch (e) {
      return status(500, { status: 'error', message: 'Failed to create course' })
    }
  }, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      minRating: t.Number()
    })
  })

  // --- ADMIN: UPDATE COURSE ---
  .put('/:id', async ({ params, body }) => {
    const updated = await prisma.course.update({
      where: { id: params.id },
      data: body
    })
    return { status: 'success', data: updated }
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      minRating: t.Optional(t.Number()),
      isPublished: t.Optional(t.Boolean())
    })
  })

  // --- ADMIN: ADD MODULE ---
  .post('/module', async ({ body }) => {
    const lastMod = await prisma.module.findFirst({
      where: { courseId: body.courseId },
      orderBy: { order: 'desc' }
    })

    const newMod = await prisma.module.create({
      data: {
        courseId: body.courseId,
        title: body.title,
        content: body.content || "",
        type: body.type as any, // Tambahkan ini (cast any karena enum)
        order: (lastMod?.order || 0) + 1
      }
    })
    return { status: 'success', data: newMod }
  }, {
    body: t.Object({
      courseId: t.String(),
      title: t.String(),
      content: t.Optional(t.String()),
      type: t.Optional(t.String()) // Terima string "TEXT" atau "SLIDE"
    })
  })

  // --- ADMIN: UPDATE MODULE ---
  .put('/module/:id', async ({ params, body }) => {
    const updated = await prisma.module.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content,
        type: body.type as any // Update tipe juga
      }
    })
    return { status: 'success', data: updated }
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      content: t.Optional(t.String()),
      type: t.Optional(t.String())
    })
  })

  // --- ADMIN: DELETE MODULE ---
  .delete('/module/:id', async ({ params }) => {
    await prisma.module.delete({ where: { id: params.id } })
    return { status: 'success' }
  })