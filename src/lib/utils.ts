export const VATSIM_RATINGS: Record<number, string> = {
  1: "OBS - Observer",
  2: "S1 - Tower Trainee",
  3: "S2 - Tower Controller",
  4: "S3 - TMA Controller",
  5: "C1 - Enroute Controller",
  7: "C3 - Senior Controller",
  8: "I1 - Instructor",
  10: "I3 - Senior Instructor",
  11: "SUP - Supervisor",
  12: "ADM - Administrator",
}

export function getRatingLabel(rating: number | null | undefined): string {
  if (!rating) return "Unknown";
  return VATSIM_RATINGS[rating] || `Unknown (${rating})`;
}

// Opsional: Helper untuk memberi warna badge berdasarkan rating (DaisyUI colors)
export function getRatingColor(rating: number | null | undefined): string {
  if (!rating) return "badge-ghost";

  // Logic warna standar VATSIM (biasanya)
  if (rating === 1) return "badge-ghost"; // OBS (Abu-abu)
  if (rating >= 2 && rating <= 4) return "badge-warning"; // Student (Kuning/Orange)
  if (rating >= 5 && rating <= 7) return "badge-primary"; // Controller (Biru/Ungu)
  if (rating >= 8) return "badge-secondary"; // Instructor (Merah muda/Ungu tua)
  if (rating >= 11) return "badge-accent"; // SUP/ADM (Teal/Hijau)

  return "badge-ghost";
}