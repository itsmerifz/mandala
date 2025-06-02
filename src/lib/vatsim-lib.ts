interface AtcSessionItem {
  connection_id: {
    callsign: string;
    start: string; // ISO Date string
    end: string;   // ISO Date string
  };
  // Mungkin ada properti lain, tambahkan jika perlu
}

export interface QuarterlyHours {
  'Q1 (Jan-Mar)': number;
  'Q2 (Apr-Jun)': number;
  'Q3 (Jul-Sep)': number;
  'Q4 (Oct-Dec)': number;
}

export function calculateQuarterlyHours(atcData: AtcSessionItem[] | undefined): QuarterlyHours {
  const quarterlyHoursResult: QuarterlyHours = {
    'Q1 (Jan-Mar)': 0,
    'Q2 (Apr-Jun)': 0,
    'Q3 (Jul-Sep)': 0,
    'Q4 (Oct-Dec)': 0,
  };

  if (!atcData || !Array.isArray(atcData)) {
    return quarterlyHoursResult;
  }

  const filteredData = atcData.filter((item) => {
    const callsign = item.connection_id?.callsign;
    // Hanya proses jika callsign ada dan dimulai dengan WI atau WA
    return callsign && (callsign.startsWith('WI') || callsign.startsWith('WA'));
  });

  filteredData.forEach((item) => {
    if (!item.connection_id?.start || !item.connection_id?.end) return;

    const startTime = new Date(item.connection_id.start);
    const endTime = new Date(item.connection_id.end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return; // Lewati jika tanggal tidak valid

    const durationMs = endTime.getTime() - startTime.getTime();
    if (durationMs < 0) return; // Lewati jika durasi negatif

    const durationHours = durationMs / (1000 * 60 * 60);

    const month = startTime.getMonth(); // 0-indexed (0 = Januari, 11 = Desember)
    let quarterKey: keyof QuarterlyHours;

    if (month >= 0 && month <= 2) { // Q1: Jan, Feb, Mar
      quarterKey = 'Q1 (Jan-Mar)';
    } else if (month >= 3 && month <= 5) { // Q2: Apr, May, Jun
      quarterKey = 'Q2 (Apr-Jun)';
    } else if (month >= 6 && month <= 8) { // Q3: Jul, Aug, Sep
      quarterKey = 'Q3 (Jul-Sep)';
    } else { // Q4: Oct, Nov, Dec
      quarterKey = 'Q4 (Oct-Dec)';
    }
    quarterlyHoursResult[quarterKey] += durationHours;
  });

  for (const quarter in quarterlyHoursResult) {
    quarterlyHoursResult[quarter as keyof QuarterlyHours] = parseFloat(
      quarterlyHoursResult[quarter as keyof QuarterlyHours].toFixed(2)
    );
  }

  return quarterlyHoursResult;
}

export function getCurrentQuarterInfo(): { currentQuarterString: string; currentQuarterKey: keyof QuarterlyHours } {
  const now = new Date();
  const month = now.getMonth();
  let currentQuarterString: string;
  let currentQuarterKey: keyof QuarterlyHours;

  if (month >= 0 && month <= 2) {
    currentQuarterString = 'Q1 (Januari - Maret)';
    currentQuarterKey = 'Q1 (Jan-Mar)';
  } else if (month >= 3 && month <= 5) {
    currentQuarterString = 'Q2 (April - Juni)';
    currentQuarterKey = 'Q2 (Apr-Jun)';
  } else if (month >= 6 && month <= 8) {
    currentQuarterString = 'Q3 (Juli - September)';
    currentQuarterKey = 'Q3 (Jul-Sep)';
  } else {
    currentQuarterString = 'Q4 (Oktober - Desember)';
    currentQuarterKey = 'Q4 (Oct-Dec)';
  }
  return { currentQuarterString, currentQuarterKey };
}