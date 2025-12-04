/* eslint-disable @typescript-eslint/no-explicit-any */
// Tipe data sederhana untuk status
export type CertStatus = 'PASSED' | 'SOLO' | 'NONE';

// Mapping Rating VATSIM ke Sertifikat Dasar (Otomatis Checklist)
const RATING_IMPLIED_CERTS: Record<number, string[]> = {
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

export function getPositionStatus(member: any, positionCode: string): CertStatus {
  // 1. Cek Hierarchy Rating (Permanent implicit)
  // Jika rating user sudah mencakup posisi ini, otomatis PASSED
  const ratingToCheck = member.ratingId || 0;
  const impliedCerts = RATING_IMPLIED_CERTS[ratingToCheck] || [];

  if (impliedCerts.includes(positionCode)) {
    return 'PASSED';
  }

  // 2. Cek UserCertificate Manual (Permanent explicit)
  // Berguna misal S2 tapi punya sertifikat CTR (jarang, tapi mungkin untuk event)
  const certs = member.userCertificates || member.certificates || [];

  const hasManualCert = certs.some((uc: any) =>
    uc.certificate.code === positionCode && uc.status === 'ACTIVE'
  );
  if (hasManualCert) return 'PASSED';

  // 3. Cek Solo Endorsement (Temporary)
  // Kita cari di list training dia
  const trainings = member.trainingsAsStudent || [];

  const hasSolo = trainings.some((t: any) => {
    if (!t.soloDetail) return false;
    const validUntil = t.soloDetail.validUntil ? new Date(t.soloDetail.validUntil) : null;
    const isValid = validUntil ? validUntil > new Date() : true;
    return t.soloDetail.position.includes(positionCode) && isValid;
  });

  if (hasSolo) return 'SOLO';

  return 'NONE';
}