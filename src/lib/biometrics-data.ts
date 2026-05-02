import { getSupabaseAdmin } from "@/lib/supabase/server";

export const SABAWOON_HAKIMI_PERSON_ID = "person-sabawoon-hakimi";
export const SABAWOON_HAKIMI_PERSON_NAME = "Sabawoon Hakimi";

type WatchAlertPayload = Record<string, unknown>;

type BiometricsInsert = {
  person_id: string;
  person_name: string;
  source: string;
  alert_type: string | null;
  severity: "info" | "warning" | "urgent" | null;
  occurred_at: string;
  heart_rate_bpm: number | null;
  steps: number | null;
  watch_battery_percent: number | null;
  payload: WatchAlertPayload;
};

function getString(payload: WatchAlertPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getNumber(payload: WatchAlertPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    const numberValue =
      typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

    if (Number.isFinite(numberValue)) {
      return numberValue;
    }
  }

  return null;
}

function getOccurredAt(payload: WatchAlertPayload) {
  const timestamp = getString(payload, ["occurred_at", "timestamp", "created_at", "date"]);
  if (!timestamp) {
    return new Date().toISOString();
  }

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function getSeverity(payload: WatchAlertPayload): BiometricsInsert["severity"] {
  const severity = getString(payload, ["severity", "level", "priority"])?.toLowerCase();

  if (severity === "urgent" || severity === "critical" || severity === "high") {
    return "urgent";
  }

  if (severity === "warning" || severity === "review" || severity === "medium") {
    return "warning";
  }

  if (severity === "info" || severity === "low") {
    return "info";
  }

  return null;
}

function wholeNumberOrNull(value: number | null) {
  return value === null ? null : Math.round(value);
}

export async function recordSabawoonWatchAlert(payload: WatchAlertPayload) {
  const insertPayload: BiometricsInsert = {
    person_id: SABAWOON_HAKIMI_PERSON_ID,
    person_name: SABAWOON_HAKIMI_PERSON_NAME,
    source: getString(payload, ["source", "device", "platform"]) ?? "apple_watch",
    alert_type: getString(payload, ["alert_type", "type", "event", "signal"]),
    severity: getSeverity(payload),
    occurred_at: getOccurredAt(payload),
    heart_rate_bpm: wholeNumberOrNull(
      getNumber(payload, ["heart_rate_bpm", "heartRate", "heart_rate", "bpm"]),
    ),
    steps: wholeNumberOrNull(getNumber(payload, ["steps", "step_count", "stepCount"])),
    watch_battery_percent: wholeNumberOrNull(
      getNumber(payload, ["watch_battery_percent", "battery", "battery_percent", "batteryPercent"]),
    ),
    payload,
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("biometrics_data")
    .insert(insertPayload)
    .select("id, person_id, person_name, occurred_at, created_at")
    .single();

  if (error) {
    throw new Error(`Unable to record biometrics data: ${error.message}`);
  }

  return data;
}
