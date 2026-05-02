import { getSupabaseAdmin } from "@/lib/supabase/server";

type ScheduleEntry = {
  dose?: unknown;
  time?: unknown;
};

export type MedicationRow = {
  id: string;
  elder_id: string;
  name: string;
  weekly_schedule: Record<string, ScheduleEntry[]>;
  description: string | null;
  delivery_method: string | null;
  dosage: string;
  created_at: string;
  updated_at: string;
};

export type MedicationDose = {
  id: string;
  name: string;
  dose: string;
  time: string;
  description: string | null;
  deliveryMethod: string | null;
};

export type MedicationWeek = Record<number, MedicationDose[]>;

export const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const dayKeys = dayNames.map((day) => day.toLowerCase());

function isSchedule(value: unknown): value is Record<string, ScheduleEntry[]> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeMedication(row: MedicationRow): MedicationRow {
  return {
    ...row,
    weekly_schedule: isSchedule(row.weekly_schedule) ? row.weekly_schedule : {},
  };
}

function getTimeMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, hourText, minuteText, periodText] = match;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const period = periodText.toUpperCase();
  const normalizedHour = period === "AM" ? hour % 12 : (hour % 12) + 12;
  return normalizedHour * 60 + minute;
}

export async function listMedicationsForPerson(personId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("medications")
    .select("id, elder_id, name, weekly_schedule, description, delivery_method, dosage, created_at, updated_at")
    .eq("elder_id", personId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load medications: ${error.message}`);
  }

  return ((data ?? []) as MedicationRow[]).map(normalizeMedication);
}

export function buildMedicationWeek(medications: MedicationRow[]) {
  const week: MedicationWeek = {};

  medications.forEach((medication) => {
    dayKeys.forEach((dayKey, dayIndex) => {
      const entries = medication.weekly_schedule[dayKey] ?? [];
      entries.forEach((entry, entryIndex) => {
        const time = typeof entry.time === "string" && entry.time.trim() ? entry.time.trim() : "Time TBD";
        const dose = typeof entry.dose === "string" && entry.dose.trim() ? entry.dose.trim() : medication.dosage;
        week[dayIndex] = [
          ...(week[dayIndex] ?? []),
          {
            id: `${medication.id}-${dayKey}-${entryIndex}`,
            name: medication.name,
            dose,
            time,
            description: medication.description,
            deliveryMethod: medication.delivery_method,
          },
        ];
      });
    });
  });

  Object.keys(week).forEach((dayIndex) => {
    week[Number(dayIndex)] = (week[Number(dayIndex)] ?? []).sort(
      (first, second) => getTimeMinutes(first.time) - getTimeMinutes(second.time),
    );
  });

  return week;
}

export function getNextMedicationLabel(week: MedicationWeek) {
  const next = Object.values(week)
    .flat()
    .sort((first, second) => getTimeMinutes(first.time) - getTimeMinutes(second.time))[0];

  return next ? `${next.name} ${next.time}` : "None";
}
