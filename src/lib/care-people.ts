import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CareGroupKey = "stable" | "watch_list" | "active_alerts" | "offline";
export type CareAlertLevel = "urgent" | "warning" | "stable" | "offline";

export type CarePerson = {
  id: string;
  name: string;
  age: number;
  care_group: CareGroupKey;
  status: string;
  heart_rate_bpm: number | null;
  last_seen_label: string;
  watch_battery_percent: number | null;
  initials: string;
  avatar: string;
  alert: CareAlertLevel;
  context: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  sex: "female" | "male" | "other" | "unknown" | null;
  height_cm: number | null;
  assistive_device: "none" | "cane" | "walker" | "wheelchair" | "unknown" | null;
  impairment_tags: string[] | null;
  prior_falls_12mo: number | null;
  injurious_fall_12mo: boolean | null;
  unable_to_rise_after_fall_12mo: boolean | null;
  fall_rule_risk_score_100: number | null;
  fall_rule_instability_score_100: number | null;
  fall_rule_risk_level: "low" | "moderate" | "high" | null;
  fall_ml_risk_score_01: number | null;
  fall_ml_model_version: string | null;
  fall_risk_updated_at: string | null;
  walking_steadiness_class: "ok" | "low" | "very_low" | "unknown" | null;
  walking_steadiness_score_01: number | null;
  walking_speed_mps: number | null;
  walking_step_length_m: number | null;
  walking_asymmetry_pct: number | null;
  walking_double_support_pct: number | null;
};

export type CarePeopleGroup = {
  key: CareGroupKey;
  title: string;
  summary: string;
  tone: "blue" | "green" | "amber" | "red";
  people: CarePerson[];
  footer: string;
};

const groupOrder: CareGroupKey[] = ["stable", "watch_list", "active_alerts", "offline"];

const groupConfig: Record<
  CareGroupKey,
  Omit<CarePeopleGroup, "summary" | "people">
> = {
  stable: {
    key: "stable",
    title: "Stable",
    tone: "green",
    footer: "Quiet check-ins pending",
  },
  watch_list: {
    key: "watch_list",
    title: "Watch List",
    tone: "blue",
    footer: "Custom rules under review",
  },
  active_alerts: {
    key: "active_alerts",
    title: "Active Alerts",
    tone: "amber",
    footer: "Alerts waiting on response",
  },
  offline: {
    key: "offline",
    title: "Offline",
    tone: "red",
    footer: "Devices need setup help",
  },
};

const carePersonSelect =
  "id, name, age, care_group, status, heart_rate_bpm, last_seen_label, watch_battery_percent, initials, avatar, alert, context, active, sort_order, created_at, updated_at, sex, height_cm, assistive_device, impairment_tags, prior_falls_12mo, injurious_fall_12mo, unable_to_rise_after_fall_12mo, fall_rule_risk_score_100, fall_rule_instability_score_100, fall_rule_risk_level, fall_ml_risk_score_01, fall_ml_model_version, fall_risk_updated_at, walking_steadiness_class, walking_steadiness_score_01, walking_speed_mps, walking_step_length_m, walking_asymmetry_pct, walking_double_support_pct";

function numberOrNull(value: unknown) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeCarePerson(row: unknown) {
  const person = row as CarePerson;

  return {
    ...person,
    height_cm: numberOrNull(person.height_cm),
    fall_ml_risk_score_01: numberOrNull(person.fall_ml_risk_score_01),
    walking_steadiness_score_01: numberOrNull(person.walking_steadiness_score_01),
    walking_speed_mps: numberOrNull(person.walking_speed_mps),
    walking_step_length_m: numberOrNull(person.walking_step_length_m),
    walking_asymmetry_pct: numberOrNull(person.walking_asymmetry_pct),
    walking_double_support_pct: numberOrNull(person.walking_double_support_pct),
  } satisfies CarePerson;
}

export async function listCarePeople() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_people")
    .select(carePersonSelect)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Unable to load care people: ${error.message}`);
  }

  return (data ?? []).map(normalizeCarePerson);
}

export async function getCarePerson(personId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_people")
    .select(carePersonSelect)
    .eq("id", personId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load person: ${error.message}`);
  }

  return data ? normalizeCarePerson(data) : null;
}

export function formatHeartRate(heartRateBpm: number | null) {
  return heartRateBpm === null ? "--" : `${heartRateBpm} bpm`;
}

export function formatWatchBattery(watchBatteryPercent: number | null) {
  return watchBatteryPercent === null ? "--" : `${watchBatteryPercent}%`;
}

function summarizeGroup(key: CareGroupKey, people: CarePerson[]) {
  if (key === "offline") {
    const connected = people.filter((person) => person.alert !== "offline").length;
    return `${connected}/${people.length} connected`;
  }

  if (key === "active_alerts") {
    const acknowledged = people.filter((person) => person.alert !== "urgent").length;
    return `${acknowledged}/${people.length} acknowledged`;
  }

  if (key === "watch_list") {
    return `${people.length} reviewed`;
  }

  return `${people.length} monitored`;
}

export function groupCarePeople(people: CarePerson[]): CarePeopleGroup[] {
  return groupOrder.map((key) => {
    const groupPeople = people.filter((person) => person.care_group === key);

    return {
      ...groupConfig[key],
      summary: summarizeGroup(key, groupPeople),
      people: groupPeople,
    };
  });
}
