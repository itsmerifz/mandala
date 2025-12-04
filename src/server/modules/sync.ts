import { Elysia } from 'elysia'
import { prisma } from '@/lib/prisma'

// Logic mapping rating ke sertifikat (sama kayak di frontend, tapi ini buat tulis ke DB)
const RATING_CERTS: Record<number, string[]> = {
  1: [], // OBS
  2: ['DEL', 'GND'], // S1
  3: ['DEL', 'GND', 'TWR'], // S2
  4: ['DEL', 'GND', 'TWR', 'APP'], // S3
  5: ['DEL', 'GND', 'TWR', 'APP', 'CTR'], // C1
  7: ['DEL', 'GND', 'TWR', 'APP', 'CTR'], // C3
  8: ['DEL', 'GND', 'TWR', 'APP', 'CTR'], // I1
  10: ['DEL', 'GND', 'TWR', 'APP', 'CTR'], // I3
  11: ['DEL', 'GND', 'TWR', 'APP', 'CTR'], // SUP
  12: ['DEL', 'GND', 'TWR', 'APP', 'CTR'], // ADM
};

// Map code 'DEL' ke ID database 'cert_del' (sesuai SQL insert di atas)
const CERT_ID_MAP: Record<string, string> = {
  'DEL': 'cert_del',
  'GND': 'cert_gnd',
  'TWR': 'cert_twr',
  'APP': 'cert_app',
  'CTR': 'cert_ctr',
};

export const syncRoutes = new Elysia({ prefix: '/sync' })
  .post('/run', async () => {
    try {
      console.log("🔄 Starting Auto-Sync Certificates...");

      // 1. Ambil semua user
      const users = await prisma.user.findMany();
      let updatedCount = 0;

      for (const user of users) {
        // Cek sertifikat apa yang seharusnya dia punya berdasarkan rating
        const targetCerts = RATING_CERTS[user.ratingId] || [];

        if (targetCerts.length === 0) continue;

        // 2. Loop setiap sertifikat target
        for (const certCode of targetCerts) {
          const certId = CERT_ID_MAP[certCode];
          if (!certId) continue;

          // 3. Upsert (Insert kalau belum ada)
          await prisma.userCertificate.upsert({
            where: {
              userId_certificateId: {
                userId: user.id,
                certificateId: certId
              }
            },
            update: {}, // Kalau sudah ada, biarkan saja
            create: {
              userId: user.id,
              certificateId: certId,
              status: 'ACTIVE',
              issuerId: 'system-auto-sync' // Penanda bahwa ini otomatis
            }
          });
        }
        updatedCount++;
      }

      console.log(`✅ Sync Complete. Processed ${updatedCount} users.`);
      return { status: 'success', message: `Synced ${updatedCount} users` };

    } catch (error) {
      console.error("❌ Sync Error:", error);
      return { status: 'error', message: String(error) };
    }
  })