"use server";

import { auth } from "@root/auth";
import { calculateQuarterlyHours, getCurrentQuarterInfo, QuarterlyHours } from "@/lib/vatsim-lib"

interface AtcSessionItem {
  connection_id: { callsign: string; start: string; end: string; };
}
interface VatsimAtcApiResponse {
  items: AtcSessionItem[];
  count: number;
}

export interface QuarterlyCheckWebResult {
  currentQuarterString: string;
  totalHoursThisQuarter: number;
  isRequirementMet: boolean;
  vatsimCid?: string;
  error?: string | null;
  isLoading: boolean;
}

const ATC_REQUIREMENT_HOURS = 3;

async function fetchVatsimAtcSessions(vatsimId: string, retries = 2, initialDelay = 1000): Promise<VatsimAtcApiResponse | null> {
  const url = `https://api.vatsim.net/v2/members/${vatsimId}/atc`;
  let delay = initialDelay;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        return await response.json() as VatsimAtcApiResponse;
      }

      if (response.status === 429 && i < retries) {
        console.warn(`Rate limited by VATSIM API for CID ${vatsimId}. Retrying in ${delay / 1000}s... Attempt ${i + 1}/${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }

      console.error(`Failed to fetch ATC data for CID ${vatsimId}. Status: ${response.status} ${response.statusText}`);
      return null;

    } catch (error) {
      console.error(`Network error fetching ATC data for CID ${vatsimId}:`, error);
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      return null;
    }
  }
  console.error(`Exhausted retries fetching ATC data for CID ${vatsimId}.`);
  return null;
}

export async function getQuarterlyCheckDataAction(): Promise<QuarterlyCheckWebResult> {
  const session = await auth();
  const vatsimCid = process.env.NODE_ENV === 'development' ? "1708238" : session?.user?.cid;

  if (!vatsimCid) {
    return {
      currentQuarterString: "",
      totalHoursThisQuarter: 0,
      isRequirementMet: false,
      error: "VATSIM CID pengguna tidak ditemukan.",
      isLoading: false,
    };
  }

  const atcApiResponse = await fetchVatsimAtcSessions(vatsimCid);

  if (!atcApiResponse || !atcApiResponse.items) {
    return {
      currentQuarterString: "",
      totalHoursThisQuarter: 0,
      isRequirementMet: false,
      error: "Gagal mengambil data sesi ATC dari VATSIM setelah beberapa percobaan.",
      vatsimCid,
      isLoading: false,
    };
  }

  const allQuarterlyHours: QuarterlyHours = calculateQuarterlyHours(atcApiResponse.items);
  const { currentQuarterString, currentQuarterKey } = getCurrentQuarterInfo();
  const totalHoursThisQuarter = allQuarterlyHours[currentQuarterKey] || 0;
  const isRequirementMet = totalHoursThisQuarter >= ATC_REQUIREMENT_HOURS;

  return {
    currentQuarterString,
    totalHoursThisQuarter,
    isRequirementMet,
    vatsimCid,
    error: null,
    isLoading: false,
  };
}