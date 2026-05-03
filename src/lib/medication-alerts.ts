import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { MedicationWeek } from "@/lib/medications";

const ALERT_KEY = "medication_missed";

/**
 * Insert a medication_missed alert into care_alerts if one doesn't already
 * exist for this person + date. Uses a select-before-insert pattern for
 * deduplication so it's safe to call repeatedly.
 */
export async function createMedicationMissedAlert(
  personId: string,
  personName: string,
  scheduleDate: string,
  pendingDoses: number,
  totalDoses: number,
) {
  const supabase = getSupabaseAdmin();

  // Check for existing active alert
  const { data: existing } = await supabase
    .from("care_alerts")
    .select("id")
    .eq("person_id", personId)
    .eq("alert_key", ALERT_KEY)
    .eq("status", "active")
    .eq("metric_value", scheduleDate)
    .limit(1);

  if (existing && existing.length > 0) {
    return; // already exists
  }

  const dateLabel = formatDateLabel(scheduleDate);

  const { error } = await supabase.from("care_alerts").insert({
    id: crypto.randomUUID(),
    alert_key: ALERT_KEY,
    person_id: personId,
    title: "Medication not administered",
    signal_label: "Medication schedule",
    severity: "warning",
    status: "active",
    summary: `${personName} has ${pendingDoses} of ${totalDoses} doses pending for ${dateLabel}.`,
    metric_label: "Schedule date",
    metric_value: scheduleDate,
    triggered_label: "Missed",
    next_step: "Review medication log and confirm with care team.",
    sort_order: 10,
  });

  if (error) {
    throw new Error(`Unable to create medication missed alert: ${error.message}`);
  }
}

/**
 * Resolve an active medication_missed alert for a person + date.
 * No-op if no matching alert exists.
 */
export async function resolveMedicationMissedAlert(
  personId: string,
  scheduleDate: string,
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("care_alerts")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("person_id", personId)
    .eq("alert_key", ALERT_KEY)
    .eq("status", "active")
    .eq("metric_value", scheduleDate);

  if (error) {
    throw new Error(`Unable to resolve medication missed alert: ${error.message}`);
  }
}

/**
 * Scan past days in a medication week and create medication_missed alerts
 * for any day that has scheduled doses. This is meant to be called on page
 * load so missed days are surfaced even if no cron is running.
 *
 * Days that already have an active or resolved alert are skipped.
 */
export async function checkMissedMedications(
  personId: string,
  personName: string,
  medicationWeek: MedicationWeek,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const supabase = getSupabaseAdmin();

  // Load all medication_missed alerts for this person (active + resolved)
  // so we know which dates are already covered.
  const { data: existingAlerts } = await supabase
    .from("care_alerts")
    .select("metric_value, status")
    .eq("person_id", personId)
    .eq("alert_key", ALERT_KEY)
    .in("status", ["active", "resolved"]);

  const coveredDates = new Set(
    (existingAlerts ?? []).map((alert: { metric_value: string }) => alert.metric_value),
  );

  // Walk the medication week. For each past day with scheduled doses,
  // create an alert if one doesn't already exist.
  const currentDayOfWeek = today.getDay(); // 0 = Sunday

  for (const [dayIndexStr, doses] of Object.entries(medicationWeek)) {
    const dayIndex = Number(dayIndexStr);
    if (doses.length === 0) continue;

    // Calculate how many days ago this weekday was
    let daysAgo = currentDayOfWeek - dayIndex;
    if (daysAgo <= 0) daysAgo += 7; // only past days

    const scheduleDate = new Date(today);
    scheduleDate.setDate(scheduleDate.getDate() - daysAgo);
    const dateStr = formatIsoDate(scheduleDate);

    if (coveredDates.has(dateStr)) continue;

    await createMedicationMissedAlert(
      personId,
      personName,
      dateStr,
      doses.length,
      doses.length,
    );
  }
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
