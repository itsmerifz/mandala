import { PrismaClient } from "./generated";

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')

  // 1. Buat COURSE (Induk)
  const courseS2 = await prisma.course.upsert({
    where: { id: 'crs_s2_tower' },
    update: {},
    create: {
      id: 'crs_s2_tower',
      title: 'S2 Tower Controller Course',
      description: 'Fundamental knowledge required for Tower Controller (S2) rating.',
      minRating: 2, // Minimal S1 untuk ambil ini
      isPublished: true,
    }
  })

  // 2. Buat MODULE
  const modTheory = await prisma.module.upsert({
    where: { id: 'mod_s2_theory' },
    update: {},
    create: {
      id: 'mod_s2_theory',
      courseId: courseS2.id,
      title: 'Tower Theory & Procedures',
      content: 'Please read IDvACC Policy Section 3 before taking this exam.',
      order: 1
    }
  })

  // 3. Buat EXAM
  const examBasic = await prisma.exam.upsert({
    where: { id: 'exam_s2_basic' }, // Kita pakai ID manual biar gampang
    update: {
      prerequisiteId: 'crs_s2_tower' // <--- LINK KE COURSE ID
    },
    create: {
      id: 'exam_s2_basic',
      prerequisiteId: 'crs_s2_tower', // <--- SYARATNYA COURSE INI
      title: 'Basic Tower Theory Exam',
      passingScore: 80,
    }
  })

  // 4. Buat QUESTIONS (Kita hapus dulu biar gak duplikat kalo di-run ulang)
  await prisma.question.deleteMany({ where: { examId: examBasic.id } })

  // Soal 1: Pilihan Ganda
  await prisma.question.create({
    data: {
      examId: examBasic.id,
      text: 'What is the minimum separation between departing aircraft on the same runway?',
      type: 'MULTIPLE_CHOICE',
      points: 10,
      order: 1,
      options: {
        create: [
          { text: '1 Minute', isCorrect: false },
          { text: '2 Minutes or appropriate distance', isCorrect: true },
          { text: 'No separation needed', isCorrect: false },
          { text: '5 Miles', isCorrect: false },
        ]
      }
    }
  })

  // Soal 2: True/False
  await prisma.question.create({
    data: {
      examId: examBasic.id,
      text: 'A Tower Controller is responsible for aircraft within the maneuvering area.',
      type: 'TRUE_FALSE',
      points: 10,
      order: 2,
      options: {
        create: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ]
      }
    }
  })

  // Soal 3: Essay
  await prisma.question.create({
    data: {
      examId: examBasic.id,
      text: 'Explain the procedure for a Missed Approach in WIII.',
      type: 'ESSAY',
      points: 20,
      order: 3,
      // Essay tidak butuh options
    }
  })

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })