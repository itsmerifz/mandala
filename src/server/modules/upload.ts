import { Elysia, t } from 'elysia'
import { join } from 'path'
import { cwd } from 'process'
import { writeFile, mkdir } from 'fs/promises'

export const uploadRoutes = new Elysia({ prefix: '/upload' })
  .post('/', async ({ body, error }) => {
    const file = body.file as File

    if (!file) return error(400, { status: 'error', message: 'No file uploaded' })

    // Validasi Ukuran (Misal max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return error(400, { status: 'error', message: 'File too large (max 5MB)' })
    }

    // 1. Generate Nama Unik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // Ambil ekstensi dengan aman
    const extension = file.name.split('.').pop() || 'bin'
    const filename = `file-${uniqueSuffix}.${extension}`

    // 2. Tentukan Lokasi Simpan
    const uploadDir = join(cwd(), 'public', 'uploads')
    const filePath = join(uploadDir, filename)

    try {
      // Pastikan folder ada (Optional, untuk jaga-jaga)
      await mkdir(uploadDir, { recursive: true })

      // 3. Konversi File ke Buffer dan Simpan (Cara Universal)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await writeFile(filePath, buffer)

      // 4. Return URL Publik
      const publicUrl = `/uploads/${filename}`

      return {
        status: 'success',
        url: publicUrl,
        originalName: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      }
    } catch (e) {
      console.error("Upload Error:", e)
      return error(500, { status: 'error', message: 'Failed to save file' })
    }
  }, {
    body: t.Object({
      file: t.File()
    })
  })