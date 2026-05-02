export type Medication = { name: string; time: string };
export type MedWeek = Record<number, Medication[]>;

export const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const medOptions = [
  "Aspirin",
  "Lisinopril",
  "Metformin",
  "Atorvastatin",
  "Levothyroxine",
  "Amlodipine",
  "Donepezil",
];

const dayPatterns: number[][] = [
  [1, 3, 5],
  [0, 2, 4, 6],
  [1, 2, 3, 4, 5],
  [0, 3, 6],
  [2, 4, 6],
];

export function buildMeds(seed: number): MedWeek {
  const days = dayPatterns[seed % dayPatterns.length];
  const primary = medOptions[seed % medOptions.length];
  const secondary = medOptions[(seed + 2) % medOptions.length];
  const week: MedWeek = {};
  days.forEach((day) => {
    week[day] = [{ name: primary, time: "8:00 AM" }];
  });
  if (seed % 2 === 0) {
    [1, 4].forEach((day) => {
      week[day] = [...(week[day] ?? []), { name: secondary, time: "7:00 PM" }];
    });
  }
  return week;
}

export function buildHrSamples(base: number, seed: number): number[] {
  return Array.from({ length: 28 }, (_, index) => {
    const noise = Math.sin((index + seed) * 0.6) * 4 + Math.cos((index + seed) * 1.4) * 2.4;
    return Math.round(base + noise);
  });
}
