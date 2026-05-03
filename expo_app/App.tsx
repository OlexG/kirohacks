import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import elsaIcon from "./assets/icon.png";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

type TabKey = "care" | "medication" | "alerts" | "devices";
type AlertTone = "urgent" | "warning" | "info";

declare const process: {
  env?: Record<string, string | undefined>;
};

type MedicationDose = {
  id: string;
  name: string;
  description: string;
  dose: string;
  delivery: string;
  time: string;
  instructions: string;
};

type MedicationDay = {
  key: number;
  label: string;
  short: string;
  date: string;
  administered: boolean;
  doses: MedicationDose[];
};

type ElderProfile = {
  name: string;
  preferredName: string;
  relation: string;
  age: number;
  status: string;
  statusDetail: string;
  location: string;
  lastSeen: string;
  heartRate: number;
  oxygen: string;
  steps: string;
  sleep: string;
  initials: string;
  avatar: string | null;
};

type AlertItem = {
  tone: AlertTone;
  title: string;
  body: string;
  time: string;
};

type AppData = {
  elder: ElderProfile;
  heartSamples: number[];
  fallRiskMetrics: string[][];
  medicationWeek: MedicationDay[];
  alerts: AlertItem[];
  deviceMetrics: string[][];
};

type CarePersonRow = {
  id: string;
  name: string;
  age: number | null;
  care_group: string | null;
  status: string | null;
  heart_rate_bpm: number | null;
  last_seen_label: string | null;
  watch_battery_percent: number | null;
  initials: string | null;
  alert: "urgent" | "warning" | "stable" | "offline" | null;
  context: string | null;
  fall_rule_risk_score_100?: number | null;
  fall_rule_instability_score_100?: number | null;
  fall_rule_risk_level?: string | null;
  fall_ml_risk_score_01?: number | null;
  fall_ml_model_version?: string | null;
  fall_risk_updated_at?: string | null;
  walking_steadiness_class?: string | null;
  walking_steadiness_score_01?: number | null;
  walking_speed_mps?: number | null;
  walking_step_length_m?: number | null;
  walking_asymmetry_pct?: number | null;
  walking_double_support_pct?: number | null;
  avatar: string | null;
};

type CareRuleRow = {
  id: string;
  signal_label: string | null;
  operator: string | null;
  threshold: number | null;
  unit: string | null;
  severity: "info" | "review" | "urgent" | null;
  active: boolean | null;
  notification_channel: string | null;
  notes: string | null;
};

type CareAlertRow = {
  id: string;
  title: string;
  severity: "info" | "warning" | "urgent";
  summary: string;
  metric_label: string;
  metric_value: string;
  triggered_label: string;
  next_step: string;
  created_at: string;
};

type MedicationRow = {
  id?: string;
  elder_id?: string;
  name?: string;
  medication_name?: string;
  description?: string;
  delivery_method?: string;
  dose?: string;
  dosage?: string;
  time?: string;
  scheduled_time?: string;
  instructions?: string;
  notes?: string;
  day_of_week?: number | string;
  weekday?: number | string;
  weekly_schedule?: Record<string, Array<{ dose?: string; dosage?: string; time?: string }>>;
  administered?: boolean;
};

type BiometricsRow = {
  id: string;
  person_id: string;
  person_name: string | null;
  source: string | null;
  alert_type: string | null;
  severity: "info" | "warning" | "urgent" | null;
  occurred_at: string;
  heart_rate_bpm: number | null;
  steps: number | null;
  watch_battery_percent: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
};

/** Mirrors `public.fall_risk_observations` for `person-sabawoon-hakimi`. */
type FallRiskObservationRow = {
  id: string;
  person_id: string;
  schema_version: string;
  message_type: string;
  device_id: string;
  session_id: string | null;
  generated_at: string;
  sequence: number;
  source_app: string;
  window_start: string | null;
  window_end: string | null;
  detected_at: string | null;
  event_type: string | null;
  severity: string | null;
  activity_class: string | null;
  rule_risk_score_100: number | null;
  rule_instability_score_100: number | null;
  rule_risk_level: string | null;
  ml_risk_score_01: number | null;
  ml_model_version: string | null;
  walking_steadiness_score_01: number | null;
  walking_steadiness_class: string | null;
  walking_speed_mps: number | null;
  walking_step_length_m: number | null;
  walking_asymmetry_pct: number | null;
  walking_double_support_pct: number | null;
  heart_rate_bpm: number | null;
  cadence_spm: number | null;
  cadence_cv_pct: number | null;
  stride_time_cv_pct: number | null;
  accel_peak_g: number | null;
  jerk_peak_g_per_s: number | null;
  gyro_peak_rad_s: number | null;
  attitude_change_deg: number | null;
  sway_rms_deg: number | null;
  step_count: number | null;
  altitude_delta_m: number | null;
  floors_ascended: number | null;
  floors_descended: number | null;
  risk_flags: Array<{ code?: string; severity?: string; value?: unknown }> | unknown[];
  payload: Record<string, unknown>;
  created_at: string;
};

const colors = {
  cream: "#F5F3EE",
  surface: "#FDFCF8",
  sand: "#F8EED9",
  taupe: "#D6C8B2",
  stone: "#CBC9C4",
  muted: "#A4A29A",
  textSoft: "#7B786F",
  ink: "#5A564B",
  white: "#FFFCF8",
};

const PERSON_ID = "person-sabawoon-hakimi";
const LIVE_REFRESH_MS = 3500;
const SUPABASE_URL =
  process.env?.EXPO_PUBLIC_SUPABASE_URL ?? process.env?.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Bypasses RLS; only appropriate for demos — never ship a real service role inside a public app bundle. */
const SUPABASE_SERVICE_ROLE_KEY =
  process.env?.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  process.env?.SUPABASE_SERVICE_ROLE_KEY ??
  "";
const WEBAPP_BASE_URL = process.env?.EXPO_PUBLIC_WEBAPP_URL ?? "";

const defaultElder: ElderProfile = {
  name: "Sabawoon Hakimi",
  preferredName: "Sabawoon",
  relation: "Care member",
  age: 77,
  status: "Loading live data",
  statusDetail: "Fetching the latest Supabase record for Sabawoon Hakimi.",
  location: "Watch list",
  lastSeen: "Syncing",
  heartRate: 0,
  oxygen: "--",
  steps: "--",
  sleep: "--",
  initials: "SH",
  avatar: null,
};

const defaultMedicationWeek: MedicationDay[] = [
  {
    key: 0,
    label: "Sunday",
    short: "S",
    date: "May 3",
    administered: true,
    doses: [
      {
        id: "sun-aspirin",
        name: "Aspirin",
        description: "Low-dose aspirin. Demo seed data only.",
        dose: "81 mg",
        delivery: "Oral tablet",
        time: "8:00 AM",
        instructions: "Confirm with Sabawoon's live care plan.",
      },
    ],
  },
  {
    key: 1,
    label: "Monday",
    short: "M",
    date: "May 4",
    administered: true,
    doses: [
      {
        id: "mon-lisinopril",
        name: "Lisinopril",
        description: "Blood pressure medication. Demo fallback only.",
        dose: "10 mg",
        delivery: "Oral tablet",
        time: "8:00 AM",
        instructions: "Check blood pressure before administering.",
      },
      {
        id: "mon-atorvastatin",
        name: "Atorvastatin",
        description: "Cholesterol medication. Demo fallback only.",
        dose: "20 mg",
        delivery: "Oral tablet",
        time: "8:00 PM",
        instructions: "Evening dose. Confirm she has eaten dinner.",
      },
    ],
  },
  {
    key: 2,
    label: "Tuesday",
    short: "T",
    date: "May 5",
    administered: false,
    doses: [
      {
        id: "tue-lisinopril",
        name: "Lisinopril",
        description: "Blood pressure medication. Demo fallback only.",
        dose: "10 mg",
        delivery: "Oral tablet",
        time: "8:00 AM",
        instructions: "Morning dose pending confirmation.",
      },
      {
        id: "tue-donepezil",
        name: "Donepezil",
        description: "Cognitive support medication. Demo fallback only.",
        dose: "5 mg",
        delivery: "Oral tablet",
        time: "7:30 PM",
        instructions: "Give before bedtime routine.",
      },
    ],
  },
  {
    key: 3,
    label: "Wednesday",
    short: "W",
    date: "May 6",
    administered: false,
    doses: [
      {
        id: "wed-aspirin",
        name: "Aspirin",
        description: "Low-dose aspirin. Demo fallback only.",
        dose: "81 mg",
        delivery: "Oral tablet",
        time: "8:00 AM",
        instructions: "Give with breakfast.",
      },
    ],
  },
  {
    key: 4,
    label: "Thursday",
    short: "T",
    date: "May 7",
    administered: false,
    doses: [
      {
        id: "thu-lisinopril",
        name: "Lisinopril",
        description: "Blood pressure medication. Demo fallback only.",
        dose: "10 mg",
        delivery: "Oral tablet",
        time: "8:00 AM",
        instructions: "Check blood pressure before administering.",
      },
    ],
  },
  {
    key: 5,
    label: "Friday",
    short: "F",
    date: "May 8",
    administered: false,
    doses: [
      {
        id: "fri-aspirin",
        name: "Aspirin",
        description: "Low-dose aspirin. Demo fallback only.",
        dose: "81 mg",
        delivery: "Oral tablet",
        time: "8:00 AM",
        instructions: "Give with breakfast.",
      },
      {
        id: "fri-atorvastatin",
        name: "Atorvastatin",
        description: "Cholesterol medication. Demo fallback only.",
        dose: "20 mg",
        delivery: "Oral tablet",
        time: "8:00 PM",
        instructions: "Evening dose.",
      },
    ],
  },
  {
    key: 6,
    label: "Saturday",
    short: "S",
    date: "May 9",
    administered: false,
    doses: [],
  },
];

const defaultAlerts: AlertItem[] = [
  {
    tone: "warning",
    title: "Waiting for live alerts",
    body: "Live alerts and care rules will load for Sabawoon Hakimi when Supabase is reachable.",
    time: "Now",
  },
  {
    tone: "info",
    title: "Scoped person",
    body: `This app is filtered to ${PERSON_ID}.`,
    time: "Live seed",
  },
];

const defaultDeviceMetrics = [
  ["Connection", "Connected"],
  ["Battery", "--"],
  ["Last sync", "Syncing"],
  ["Data source", "Supabase"],
];

const defaultAppData: AppData = {
  elder: defaultElder,
  heartSamples: [],
  fallRiskMetrics: [
    ["Risk level", "--"],
    ["Risk score", "--"],
    ["Steadiness", "--"],
    ["Walking speed", "--"],
  ],
  medicationWeek: defaultMedicationWeek,
  alerts: defaultAlerts,
  deviceMetrics: defaultDeviceMetrics,
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "care", label: "Care" },
  { key: "medication", label: "Medication" },
  { key: "alerts", label: "Alerts" },
  { key: "devices", label: "Devices" },
];

function getSupabaseHeaders() {
  if (!SUPABASE_URL) return null;

  const key = SUPABASE_SERVICE_ROLE_KEY.trim() || SUPABASE_ANON_KEY.trim();
  if (!key) return null;

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

async function fetchSupabaseRows<T>(table: string, query: string) {
  const headers = getSupabaseHeaders();
  if (!headers) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers,
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as T[];
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRuleBody(rule: CareRuleRow) {
  if (rule.notes) return rule.notes;

  const threshold =
    rule.threshold === null || rule.threshold === undefined
      ? ""
      : ` ${rule.threshold}${rule.unit ? ` ${rule.unit}` : ""}`;

  return `${rule.signal_label ?? "Care signal"} ${rule.operator ?? "changed"}${threshold}.`;
}

function formatReadingTime(value: string | null | undefined) {
  if (!value) return "No reading";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Live reading";

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function formatSteps(value: number | null | undefined) {
  return value === null || value === undefined ? "--" : value.toLocaleString();
}

function formatBloodPressure(reading: BiometricsRow | undefined) {
  if (!reading?.blood_pressure_systolic || !reading.blood_pressure_diastolic) return "--";
  return `${reading.blood_pressure_systolic}/${reading.blood_pressure_diastolic}`;
}

function formatPercentFromRatio(value: number | null | undefined) {
  return value === null || value === undefined ? "--" : `${Math.round(value * 100)}%`;
}

function formatNullableNumber(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "--" : `${Number(value.toFixed(2))}${suffix}`;
}

function isValidAvatarUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^(https?:\/\/|data:image\/|\/)/.test(url);
}

/**
 * Resolve an avatar string to an absolute URL that React Native's Image component can load.
 * Relative paths (starting with `/` but not `//`) are prepended with the webapp base URL.
 * Absolute URLs, data URIs, and protocol-relative URLs pass through unchanged.
 * Null, empty strings, and unrecognized formats return null (triggering initials fallback).
 */
export function resolveAvatarUrl(avatar: string | null, baseUrl: string = WEBAPP_BASE_URL): string | null {
  if (avatar === null || avatar === "") return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  if (avatar.startsWith("data:image/")) return avatar;
  if (avatar.startsWith("//")) return avatar;
  if (avatar.startsWith("/")) return baseUrl + avatar;
  return null;
}

function fallRiskTone(observation: FallRiskObservationRow | undefined): AlertTone {
  if (!observation) return "info";
  const sev = observation.severity?.toLowerCase();
  if (sev === "high" || sev === "urgent") return "urgent";
  if (sev === "moderate" || sev === "warning") return "warning";
  if (observation.rule_risk_level === "moderate" || observation.rule_risk_level === "high") {
    return observation.rule_risk_level === "high" ? "urgent" : "warning";
  }
  return "info";
}

function buildFallRiskMetrics(
  observation: FallRiskObservationRow | undefined,
  person: CarePersonRow,
) {
  if (!observation) {
    return [
      ["Risk level", titleCase(person.fall_rule_risk_level ?? "unknown")],
      [
        "Risk score",
        person.fall_rule_risk_score_100 === null || person.fall_rule_risk_score_100 === undefined
          ? "--"
          : `${person.fall_rule_risk_score_100}/100`,
      ],
      [
        "Steadiness",
        person.walking_steadiness_class
          ? titleCase(person.walking_steadiness_class)
          : formatPercentFromRatio(person.walking_steadiness_score_01),
      ],
      ["Walking speed", formatNullableNumber(person.walking_speed_mps, " m/s")],
    ];
  }

  return [
    ["Risk level", titleCase(observation.rule_risk_level ?? observation.severity ?? "unknown")],
    ["Risk score", observation.rule_risk_score_100 === null ? "--" : `${observation.rule_risk_score_100}/100`],
    [
      "Steadiness",
      observation.walking_steadiness_class
        ? titleCase(observation.walking_steadiness_class)
        : formatPercentFromRatio(observation.walking_steadiness_score_01),
    ],
    ["Walking speed", formatNullableNumber(observation.walking_speed_mps, " m/s")],
  ];
}

function buildFallRiskAlert(observation: FallRiskObservationRow | undefined) {
  if (!observation) return null;

  const flags = Array.isArray(observation.risk_flags)
    ? observation.risk_flags
        .map((flag) =>
          flag && typeof flag === "object" && "code" in flag ? (flag as { code?: string }).code : undefined,
        )
        .filter(Boolean)
        .join(", ")
    : "";
  const eventLabel = observation.event_type
    ? titleCase(observation.event_type)
    : titleCase(observation.message_type ?? "fall risk observation");
  const score =
    observation.rule_risk_score_100 === null ? "" : ` Risk score ${observation.rule_risk_score_100}/100.`;

  return {
    tone: fallRiskTone(observation),
    title: eventLabel,
    body: `${titleCase(observation.activity_class ?? "Mobility")} reading from fall_risk_observations.${score}${
      flags ? ` Flags: ${flags}.` : ""
    }`,
    time: formatReadingTime(observation.detected_at ?? observation.generated_at),
  } satisfies AlertItem;
}

function mapCareAlertTone(severity: CareAlertRow["severity"]): AlertTone {
  if (severity === "urgent") return "urgent";
  if (severity === "warning") return "warning";
  return "info";
}

function mapCareAlerts(alerts: CareAlertRow[]) {
  return alerts.map<AlertItem>((alert) => ({
    tone: mapCareAlertTone(alert.severity),
    title: alert.title,
    body: alert.summary || `${alert.metric_label}: ${alert.metric_value}`,
    time: alert.triggered_label || formatReadingTime(alert.created_at),
  }));
}

function mapRuleTone(severity: CareRuleRow["severity"]): AlertTone {
  if (severity === "urgent") return "urgent";
  if (severity === "review") return "warning";
  return "info";
}

function normalizeMedicationDay(value: MedicationRow["day_of_week"] | MedicationRow["weekday"]) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= 6 ? numeric : null;
}

const dayKeyByName: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function buildDoseFromMedication(
  row: MedicationRow,
  dayKey: number,
  scheduleIndex: number,
  scheduleDose?: { dose?: string; dosage?: string; time?: string },
) {
  const name = row.name ?? row.medication_name ?? "Medication";
  const dose = scheduleDose?.dose ?? scheduleDose?.dosage ?? row.dose ?? row.dosage ?? "As directed";
  const delivery = row.delivery_method ?? "Delivery method not specified";
  const description = row.description ?? row.notes ?? "No medication description provided.";

  return {
    id: `${row.id ?? name}-${dayKey}-${scheduleIndex}`,
    name,
    description,
    dose,
    delivery,
    time: scheduleDose?.time ?? row.time ?? row.scheduled_time ?? "Scheduled",
    instructions: row.instructions ?? description,
  } satisfies MedicationDose;
}

function buildMedicationWeek(rows: MedicationRow[]) {
  if (rows.length === 0) return defaultMedicationWeek;

  return defaultMedicationWeek.map((day) => {
    const doses = rows.flatMap((row, rowIndex) => {
      if (row.weekly_schedule) {
        return Object.entries(row.weekly_schedule).flatMap(([dayName, schedule]) => {
          if (dayKeyByName[dayName.toLowerCase()] !== day.key) return [];

          return schedule.map((scheduleDose, scheduleIndex) =>
            buildDoseFromMedication(row, day.key, scheduleIndex, scheduleDose),
          );
        });
      }

      return normalizeMedicationDay(row.day_of_week ?? row.weekday) === day.key
        ? [buildDoseFromMedication(row, day.key, rowIndex)]
        : [];
    });

    return {
      ...day,
      administered: doses.length > 0 && rows.some((row) => row.administered),
      doses,
    };
  });
}

function mapLiveData(
  person: CarePersonRow,
  careAlerts: CareAlertRow[],
  rules: CareRuleRow[],
  medications: MedicationRow[],
  biometrics: BiometricsRow[],
  fallRiskObservations: FallRiskObservationRow[],
) {
  const latestReading = biometrics[0];
  const latestFallRisk = fallRiskObservations[0];
  const fallRiskHeartSamples = fallRiskObservations
    .map((reading) => ({
        at: reading.generated_at ?? reading.detected_at ?? "",
        value: reading.heart_rate_bpm,
      }))
    .filter((reading): reading is { at: string; value: number } => typeof reading.value === "number")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(-24)
    .map((reading) => reading.value);
  const legacyHeartSamples = biometrics
    .map((reading) => ({ at: reading.occurred_at, value: reading.heart_rate_bpm }))
    .filter((reading): reading is { at: string; value: number } => typeof reading.value === "number")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(-24)
    .map((reading) => reading.value);
  const heartSamples = (fallRiskHeartSamples.length > 0 ? fallRiskHeartSamples : legacyHeartSamples)
    .filter((value): value is number => typeof value === "number");
  const heartRate = latestFallRisk?.heart_rate_bpm ?? latestReading?.heart_rate_bpm ?? person.heart_rate_bpm ?? 0;
  const latestSteps = latestFallRisk?.step_count ?? latestReading?.steps;
  const latestGeneratedAt = latestFallRisk?.generated_at ?? latestReading?.occurred_at;
  const name = person.name || defaultElder.name;
  const fallRiskAlert = buildFallRiskAlert(latestFallRisk);
  const activeCareAlerts = mapCareAlerts(careAlerts);
  const personAlertTone: AlertTone =
    person.alert === "urgent" ? "urgent" : person.alert === "warning" ? "warning" : "info";
  const alerts = [
    ...(fallRiskAlert ? [fallRiskAlert] : []),
    ...(activeCareAlerts.length
      ? activeCareAlerts
      : rules.length
      ? rules
          .filter((rule) => rule.active !== false)
          .map<AlertItem>((rule) => ({
            tone: mapRuleTone(rule.severity),
            title: rule.signal_label ?? "Care rule",
            body: formatRuleBody(rule),
            time: rule.notification_channel ?? "Live rule",
          }))
      : [
          {
            tone: personAlertTone,
            title: person.status ?? "Live care status",
            body: person.context ?? "Latest Supabase care_people record loaded for Sabawoon Hakimi.",
            time: person.last_seen_label ?? "Live",
          },
        ]),
  ];

  return {
    elder: {
      name,
      preferredName: name.split(" ")[0] ?? "Sabawoon",
      relation: "Care member",
      age: person.age ?? defaultElder.age,
      status: person.status ?? defaultElder.status,
      statusDetail: person.context ?? defaultElder.statusDetail,
      location: person.care_group ? titleCase(person.care_group) : defaultElder.location,
      lastSeen: latestGeneratedAt ? formatReadingTime(latestGeneratedAt) : person.last_seen_label ?? defaultElder.lastSeen,
      heartRate,
      oxygen: "--",
      steps: formatSteps(latestSteps),
      sleep: formatBloodPressure(latestReading),
      initials: person.initials ?? initialsFromName(name),
      avatar: resolveAvatarUrl(person.avatar),
    },
    heartSamples,
    fallRiskMetrics: buildFallRiskMetrics(latestFallRisk, person),
    medicationWeek: buildMedicationWeek(medications),
    alerts,
    deviceMetrics: [
      ["Connection", person.alert === "offline" ? "Disconnected" : "Connected"],
      [
        "Battery",
        latestReading?.watch_battery_percent === null || latestReading?.watch_battery_percent === undefined
          ? person.watch_battery_percent === null
            ? "--"
            : `${person.watch_battery_percent}%`
          : `${latestReading.watch_battery_percent}%`,
      ],
      ["Last sync", latestGeneratedAt ? formatReadingTime(latestGeneratedAt) : person.last_seen_label ?? "--"],
      ["Fall risk source", latestFallRisk?.source_app ?? "--"],
      ["Person ID", PERSON_ID],
    ],
  } satisfies AppData;
}

async function loadSabawoonData() {
  try {
    const personRows = await fetchSupabaseRows<CarePersonRow>(
      "care_people",
      `select=*&id=eq.${PERSON_ID}&active=eq.true&limit=1`,
    );

    const person = personRows[0];
    if (!person) return defaultAppData;

    const [rules, medications, biometrics, fallRiskObservations, careAlerts] = await Promise.all([
      fetchSupabaseRows<CareRuleRow>(
        "care_rules",
        `select=*&person_id=eq.${PERSON_ID}&order=created_at.desc`,
      ),
      fetchSupabaseRows<MedicationRow>(
        "medications",
        `select=*&elder_id=eq.${PERSON_ID}&order=created_at.asc`,
      ),
      fetchSupabaseRows<BiometricsRow>(
        "biometrics_data",
        `select=*&person_id=eq.${PERSON_ID}&order=occurred_at.desc&limit=24`,
      ),
      fetchSupabaseRows<FallRiskObservationRow>(
        "fall_risk_observations",
        `select=*&person_id=eq.${PERSON_ID}&order=generated_at.desc&limit=80`,
      ),
      fetchSupabaseRows<CareAlertRow>(
        "care_alerts",
        `select=*&person_id=eq.${PERSON_ID}&status=eq.active&order=sort_order.asc,created_at.desc`,
      ),
    ]);

    return mapLiveData(person, careAlerts, rules, medications, biometrics, fallRiskObservations);
  } catch {
    return defaultAppData;
  }
}

/** Resolve an active medication_missed care_alert for a person + date. */
async function resolveMedicationMissedCareAlert(personId: string, scheduleDate: string) {
  const headers = getSupabaseHeaders();
  if (!headers) return;

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/care_alerts?person_id=eq.${personId}&alert_key=eq.medication_missed&status=eq.active&metric_value=eq.${scheduleDate}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "resolved", updated_at: new Date().toISOString() }),
      },
    );
  } catch {
    // Best-effort — the next poll will pick up the current state
  }
}

/** Create a medication_missed care_alert if one doesn't already exist. */
async function createMedicationMissedCareAlert(
  personId: string,
  personName: string,
  scheduleDate: string,
  pendingDoses: number,
  totalDoses: number,
) {
  const headers = getSupabaseHeaders();
  if (!headers) return;

  try {
    // Check for existing active alert
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/care_alerts?person_id=eq.${personId}&alert_key=eq.medication_missed&status=eq.active&metric_value=eq.${scheduleDate}&select=id&limit=1`,
      { headers },
    );
    const rows = await existing.json();
    if (Array.isArray(rows) && rows.length > 0) return;

    const dateLabel = new Date(scheduleDate + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    await fetch(`${SUPABASE_URL}/rest/v1/care_alerts`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        alert_key: "medication_missed",
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
      }),
    });
  } catch {
    // Best-effort
  }
}

/** Format a Date as YYYY-MM-DD. */
function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Scan past days in the medication week and create medication_missed alerts
 * for any day that has scheduled doses but no existing alert.
 */
async function checkMissedMedicationsOnLoad(
  personId: string,
  personName: string,
  medicationWeek: MedicationDay[],
) {
  const headers = getSupabaseHeaders();
  if (!headers) return;

  try {
    // Load existing medication_missed alerts for this person
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/care_alerts?person_id=eq.${personId}&alert_key=eq.medication_missed&select=metric_value,status`,
      { headers },
    );
    const existingAlerts = (await res.json()) as Array<{ metric_value: string; status: string }>;
    const coveredDates = new Set(existingAlerts.map((a) => a.metric_value));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDayOfWeek = today.getDay();

    for (const day of medicationWeek) {
      if (day.doses.length === 0) continue;

      let daysAgo = currentDayOfWeek - day.key;
      if (daysAgo <= 0) daysAgo += 7;

      const scheduleDate = new Date(today);
      scheduleDate.setDate(scheduleDate.getDate() - daysAgo);
      const dateStr = formatIsoDate(scheduleDate);

      if (coveredDates.has(dateStr)) continue;

      await createMedicationMissedCareAlert(
        personId,
        personName,
        dateStr,
        day.doses.length,
        day.doses.length,
      );
    }
  } catch {
    // Best-effort
  }
}

function HeartMark() {
  return (
    <View style={styles.brandMark}>
      <Image
        source={elsaIcon}
        style={styles.brandMarkImage}
        resizeMode="cover"
        alt=""
        accessible={false}
      />
    </View>
  );
}

function ActionButton({
  label,
  tone = "dark",
}: {
  readonly label: string;
  readonly tone?: "dark" | "light";
}) {
  return (
    <Pressable style={[styles.actionButton, tone === "light" && styles.actionButtonLight]}>
      <Text style={[styles.actionButtonText, tone === "light" && styles.actionButtonTextLight]}>
        {label}
      </Text>
    </Pressable>
  );
}

function HeartMonitor({
  elder,
  heartSamples,
}: {
  readonly elder: ElderProfile;
  readonly heartSamples: number[];
}) {
  const hasReadings = heartSamples.length > 0;
  const max = hasReadings ? Math.max(...heartSamples) : 1;
  const min = hasReadings ? Math.min(...heartSamples) : 0;
  const range = Math.max(max - min, 1);

  return (
    <View style={styles.monitorCard}>
      <View style={styles.monitorHeader}>
        <View>
          <Text style={styles.eyebrow}>Heartbeat monitor</Text>
          <Text style={styles.heartRate}>{elder.heartRate > 0 ? elder.heartRate : "—"}</Text>
          <Text style={styles.heartRateUnit}>beats per minute</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>Live</Text>
        </View>
      </View>

      {hasReadings ? (
        <View style={styles.heartGraph}>
          {heartSamples.map((sample, index) => {
            const height = 28 + ((sample - min) / range) * 54;
            return (
              <View
                key={`${sample}-${index}`}
                style={[styles.heartBar, { height }]}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyHeartGraph}>
          <Text style={styles.emptyHeartText}>No live health readings yet.</Text>
        </View>
      )}
      <Text style={styles.monitorNote}>
        Heart-rate history is loaded from Supabase biometrics readings for {elder.preferredName}.
      </Text>
    </View>
  );
}

function MetricTile({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number;
}) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function CareView({
  elder,
  heartSamples,
  fallRiskMetrics,
}: {
  readonly elder: ElderProfile;
  readonly heartSamples: number[];
  readonly fallRiskMetrics: string[][];
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            {isValidAvatarUrl(elder.avatar) ? (
              <Image
                source={{ uri: elder.avatar }}
                style={styles.avatarImage}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel={`${elder.name} photo`}
              />
            ) : (
              <Text style={styles.avatarText}>{elder.initials}</Text>
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{elder.name}</Text>
            <Text style={styles.profileMeta}>
              {elder.relation} · Age {elder.age}
            </Text>
          </View>
        </View>
        <View style={styles.profileStats}>
          <MetricTile label="Location" value={elder.location} />
          <MetricTile label="Status" value={elder.status} />
        </View>
      </View>

      <HeartMonitor elder={elder} heartSamples={heartSamples} />

      <View style={styles.metricGrid}>
        <MetricTile label="Oxygen" value={elder.oxygen} />
        <MetricTile label="Steps" value={elder.steps} />
        <MetricTile label="Blood pressure" value={elder.sleep} />
        <MetricTile label="Next med" value="8:00 PM" />
      </View>

      <View style={styles.fallRiskCard}>
        <Text style={styles.sectionTitle}>Fall risk</Text>
        <View style={styles.metricGrid}>
          {fallRiskMetrics.map(([label, value]) => (
            <MetricTile key={label} label={label} value={value} />
          ))}
        </View>
      </View>
    </View>
  );
}

function MedicationView({
  medicationWeek,
  selectedDay,
  administeredDays,
  checkedDoses,
  onSelectDay,
  onToggleDose,
}: {
  readonly medicationWeek: MedicationDay[];
  readonly selectedDay: MedicationDay;
  readonly administeredDays: Record<number, boolean>;
  readonly checkedDoses: Record<string, boolean>;
  readonly onSelectDay: (day: MedicationDay) => void;
  readonly onToggleDose: (doseId: string, dayKey: number) => void;
}) {
  /** A day is "Given" only when it has doses and every dose is checked. */
  const isDayComplete = (day: MedicationDay) => {
    if (day.doses.length === 0) return false;
    return day.doses.every((dose) => checkedDoses[dose.id] === true);
  };

  const selectedComplete = isDayComplete(selectedDay);

  return (
    <View style={styles.stack}>
      <View style={styles.weekCard}>
        <Text style={styles.sectionTitle}>Weekly medication</Text>
        <View style={styles.weekRow}>
          {medicationWeek.map((day) => {
            const active = selectedDay.key === day.key;
            const done = isDayComplete(day);
            return (
              <Pressable
                key={day.key}
                onPress={() => onSelectDay(day)}
                style={[styles.dayButton, active && styles.dayButtonActive]}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.short}</Text>
                <View style={[styles.checkbox, done && styles.checkboxChecked]}>
                  <Text style={[styles.checkboxText, done && styles.checkboxTextChecked]}>
                    {done ? "✓" : ""}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.weekHint}>
          Tap a day for medication details. Check off each medication once administered.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.eyebrow}>{selectedDay.date}</Text>
            <Text style={styles.detailTitle}>{selectedDay.label}</Text>
          </View>
          <View style={[styles.statusPill, selectedComplete && styles.statusPillDark]}>
            <Text
              style={[
                styles.statusPillText,
                selectedComplete && styles.statusPillTextDark,
              ]}
            >
              {selectedComplete ? "Given" : "Pending"}
            </Text>
          </View>
        </View>

        {selectedDay.doses.length === 0 ? (
          <Text style={styles.emptyText}>No medication scheduled for this day.</Text>
        ) : (
          <View style={styles.stack}>
            {selectedDay.doses.map((dose) => {
              const doseChecked = checkedDoses[dose.id] === true;
              return (
                <View key={dose.id} style={styles.medicationDose}>
                  <View style={styles.medicationDoseTop}>
                    <Pressable
                      onPress={() => onToggleDose(dose.id, selectedDay.key)}
                      style={[styles.doseCheckbox, doseChecked && styles.doseCheckboxChecked]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: doseChecked }}
                      accessibilityLabel={`Mark ${dose.name} as ${doseChecked ? "not given" : "given"}`}
                    >
                      <Text style={[styles.doseCheckboxText, doseChecked && styles.doseCheckboxTextChecked]}>
                        {doseChecked ? "✓" : ""}
                      </Text>
                    </Pressable>
                    <Text style={styles.doseTime}>{dose.time}</Text>
                    <Text style={[styles.doseName, doseChecked && styles.doseNameChecked]}>{dose.name}</Text>
                  </View>
                  <Text style={styles.doseDescription}>{dose.description}</Text>
                  <View style={styles.doseMetaRow}>
                    <View style={styles.doseMetaPill}>
                      <Text style={styles.doseMetaLabel}>Dosage</Text>
                      <Text style={styles.doseMetaValue}>{dose.dose}</Text>
                    </View>
                    <View style={styles.doseMetaPill}>
                      <Text style={styles.doseMetaLabel}>Delivery</Text>
                      <Text style={styles.doseMetaValue}>{dose.delivery}</Text>
                    </View>
                  </View>
                  <Text style={styles.doseInstructions}>{dose.instructions}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function AlertsView({ alerts }: Readonly<{ alerts: AlertItem[] }>) {
  return (
    <View style={styles.stack}>
      {alerts.map((alert, index) => (
        <View
          key={`${alert.title}-${alert.time}-${index}`}
          style={[
            styles.alertCard,
            alert.tone === "urgent" && styles.alertUrgent,
            alert.tone === "warning" && styles.alertWarning,
          ]}
        >
          <View style={styles.alertHeader}>
            <View style={[styles.alertDot, styles[`${alert.tone}Dot`]]} />
            <Text style={styles.alertType}>{alert.tone}</Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertBody}>{alert.body}</Text>
          <View style={styles.alertActions}>
            <ActionButton label="Review" />
            <ActionButton label="Dismiss" tone="light" />
          </View>
        </View>
      ))}
    </View>
  );
}

function DevicesView({
  elder,
  deviceMetrics,
}: Readonly<{ elder: ElderProfile; deviceMetrics: string[][] }>) {
  return (
    <View style={styles.stack}>
      <View style={styles.watchCard}>
        <View style={styles.watchBody}>
          <View style={styles.watchStrapTop} />
          <View style={styles.watchFace}>
            <Text style={styles.watchHeart}>{elder.heartRate > 0 ? elder.heartRate : "—"}</Text>
            <Text style={styles.watchUnit}>bpm</Text>
          </View>
          <View style={styles.watchStrapBottom} />
        </View>
        <Text style={styles.watchTitle}>{`${elder.preferredName}'s Apple Watch`}</Text>
        <Text style={styles.watchSubtitle}>
          Connected, syncing biometrics, fall detection, movement, and medication reminders.
        </Text>
      </View>

      <View style={styles.deviceGrid}>
        {deviceMetrics.map(([label, value]) => (
          <MetricTile key={label} label={label} value={value} />
        ))}
      </View>

      <View style={styles.deviceStatusCard}>
        <Text style={styles.sectionTitle}>Device checks</Text>
        <View style={styles.deviceCheck}>
          <Text style={styles.deviceCheckTitle}>Fall detection</Text>
          <Text style={styles.deviceCheckValue}>Enabled</Text>
        </View>
        <View style={styles.deviceCheck}>
          <Text style={styles.deviceCheckTitle}>Heart rate alerts</Text>
          <Text style={styles.deviceCheckValue}>Above 105 bpm</Text>
        </View>
        <View style={styles.deviceCheck}>
          <Text style={styles.deviceCheckTitle}>Medication reminders</Text>
          <Text style={styles.deviceCheckValue}>On watch and phone</Text>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [appData, setAppData] = useState<AppData>(defaultAppData);
  const [activeTab, setActiveTab] = useState<TabKey>("care");
  const [selectedDay, setSelectedDay] = useState<MedicationDay>(defaultAppData.medicationWeek[2]);
  const [administeredDays, setAdministeredDays] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(defaultAppData.medicationWeek.map((day) => [day.key, day.administered])),
  );
  const [checkedDoses, setCheckedDoses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ignore = false;
    let hasSeededMedication = false;

    const refresh = () => {
      loadSabawoonData()
        .then((data) => {
          if (ignore) return;
          setAppData(data);
          if (!hasSeededMedication) {
            setSelectedDay(data.medicationWeek[2] ?? data.medicationWeek[0]);
            setAdministeredDays(
              Object.fromEntries(data.medicationWeek.map((day) => [day.key, day.administered])),
            );
            // Seed per-dose checkboxes: mark all doses as checked for days that are already administered
            const seededDoses: Record<string, boolean> = {};
            for (const day of data.medicationWeek) {
              if (day.administered) {
                for (const dose of day.doses) {
                  seededDoses[dose.id] = true;
                }
              }
            }
            setCheckedDoses(seededDoses);
            hasSeededMedication = true;

            // Check for missed medications and create alerts for past incomplete days
            checkMissedMedicationsOnLoad(
              PERSON_ID,
              data.elder.name,
              data.medicationWeek,
            );
          }
        })
        .catch(() => {
          if (!ignore) setAppData(defaultAppData);
        });
    };

    refresh();
    const interval = setInterval(refresh, LIVE_REFRESH_MS);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  const title = useMemo(() => {
    if (activeTab === "care") return "Care overview";
    if (activeTab === "medication") return "Medication";
    if (activeTab === "alerts") return "Alerts";
    return "Devices";
  }, [activeTab]);

  const subtitle = useMemo(() => {
    if (activeTab === "care") return "One elder, one calm view";
    if (activeTab === "medication") return "Weekly doses and confirmation";
    if (activeTab === "alerts") return "Biometrics, falls, and missed care";
    return "Apple Watch connection status";
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <HeartMark />
            <View>
              <Text style={styles.brandName}>Elsa</Text>
              <Text style={styles.brandSub}>Elder-living safety assistant</Text>
            </View>
          </View>
          <Text style={styles.headerPill}>Live</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>{subtitle}</Text>
            <Text style={styles.screenTitle}>{title}</Text>
          </View>

          {activeTab === "care" ? (
            <CareView
              elder={appData.elder}
              heartSamples={appData.heartSamples}
              fallRiskMetrics={appData.fallRiskMetrics}
            />
          ) : null}
          {activeTab === "medication" ? (
            <MedicationView
              medicationWeek={appData.medicationWeek}
              selectedDay={selectedDay}
              administeredDays={administeredDays}
              checkedDoses={checkedDoses}
              onSelectDay={setSelectedDay}
              onToggleDose={(doseId, dayKey) => {
                setCheckedDoses((current) => {
                  const updated = { ...current, [doseId]: !current[doseId] };

                  // Check if all doses for this day are now checked
                  const day = appData.medicationWeek.find((d) => d.key === dayKey);
                  if (day && day.doses.length > 0) {
                    const allChecked = day.doses.every((dose) => updated[dose.id] === true);
                    if (allChecked) {
                      // Resolve the medication_missed alert for this day
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const currentDayOfWeek = today.getDay();
                      let daysAgo = currentDayOfWeek - dayKey;
                      if (daysAgo < 0) daysAgo += 7;
                      const scheduleDate = new Date(today);
                      scheduleDate.setDate(scheduleDate.getDate() - daysAgo);
                      resolveMedicationMissedCareAlert(PERSON_ID, formatIsoDate(scheduleDate));
                    }
                  }

                  return updated;
                });
              }}
            />
          ) : null}
          {activeTab === "alerts" ? <AlertsView alerts={appData.alerts} /> : null}
          {activeTab === "devices" ? (
            <DevicesView elder={appData.elder} deviceMetrics={appData.deviceMetrics} />
          ) : null}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, active && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(245, 243, 238, 0.96)",
    borderBottomColor: "rgba(90, 86, 75, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.sand,
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    overflow: "hidden",
    width: 38,
  },
  brandMarkImage: {
    height: 38,
    width: 38,
  },
  brandName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 16,
  },
  brandSub: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 11,
    marginTop: 1,
  },
  headerPill: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 112,
  },
  titleBlock: {
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 38,
    marginTop: 6,
  },
  stack: {
    gap: 14,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
  },
  profileTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.taupe,
    borderRadius: 16,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  avatarImage: {
    borderRadius: 16,
    height: 58,
    width: 58,
  },
  avatarText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  profileMeta: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusPillDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  statusPillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
  },
  statusPillTextDark: {
    color: colors.sand,
  },
  profileBody: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 16,
  },
  profileStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  monitorCard: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 20,
  },
  monitorHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heartRate: {
    color: colors.sand,
    fontSize: 58,
    fontWeight: "900",
    letterSpacing: -1.8,
    lineHeight: 62,
    marginTop: 5,
  },
  heartRateUnit: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "800",
  },
  livePill: {
    alignItems: "center",
    backgroundColor: "rgba(248, 238, 217, 0.12)",
    borderColor: "rgba(248, 238, 217, 0.32)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  liveDot: {
    backgroundColor: colors.sand,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  livePillText: {
    color: colors.sand,
    fontSize: 12,
    fontWeight: "900",
  },
  heartGraph: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    height: 104,
    marginTop: 18,
  },
  heartBar: {
    backgroundColor: colors.sand,
    borderRadius: 999,
    flex: 1,
    opacity: 0.9,
  },
  emptyHeartGraph: {
    alignItems: "center",
    backgroundColor: "rgba(248, 238, 217, 0.1)",
    borderColor: "rgba(248, 238, 217, 0.2)",
    borderRadius: 18,
    borderWidth: 1,
    height: 104,
    justifyContent: "center",
    marginTop: 18,
  },
  emptyHeartText: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "800",
  },
  monitorNote: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 14,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricTile: {
    backgroundColor: colors.surface,
    borderColor: colors.stone,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: "46%",
    padding: 14,
  },
  metricLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7,
  },
  fallRiskCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  fallRiskBody: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  weekRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
  },
  dayButton: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.stone,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 72,
    paddingVertical: 9,
  },
  dayButtonActive: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
  },
  dayText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "900",
  },
  dayTextActive: {
    color: colors.ink,
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 7,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  checkboxText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  checkboxTextChecked: {
    color: colors.sand,
  },
  weekHint: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 12,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  detailHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 3,
  },
  emptyText: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  medicationDose: {
    backgroundColor: colors.cream,
    borderColor: colors.stone,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  medicationDoseTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  doseCheckbox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 7,
    borderWidth: 1.5,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  doseCheckboxChecked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  doseCheckboxText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  doseCheckboxTextChecked: {
    color: colors.sand,
  },
  doseTime: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  doseName: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  doseNameChecked: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  doseDescription: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 10,
  },
  doseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  doseMetaPill: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: "46%",
    padding: 10,
  },
  doseMetaLabel: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  doseMetaValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  doseInstructions: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 5,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  alertUrgent: {
    backgroundColor: colors.sand,
  },
  alertWarning: {
    backgroundColor: colors.white,
  },
  alertHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  alertDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  urgentDot: {
    backgroundColor: colors.ink,
  },
  warningDot: {
    backgroundColor: colors.taupe,
  },
  infoDot: {
    backgroundColor: colors.muted,
  },
  alertType: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  alertTime: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  alertTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 26,
    marginTop: 13,
  },
  alertBody: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
  },
  alertActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 16,
  },
  actionButtonLight: {
    backgroundColor: colors.sand,
    borderColor: colors.taupe,
  },
  actionButtonText: {
    color: colors.sand,
    fontSize: 13,
    fontWeight: "900",
  },
  actionButtonTextLight: {
    color: colors.ink,
  },
  watchCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  watchBody: {
    alignItems: "center",
  },
  watchStrapTop: {
    backgroundColor: colors.textSoft,
    borderRadius: 18,
    height: 48,
    width: 78,
  },
  watchFace: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: colors.textSoft,
    borderRadius: 34,
    borderWidth: 8,
    height: 138,
    justifyContent: "center",
    marginVertical: -4,
    width: 112,
    zIndex: 2,
  },
  watchHeart: {
    color: colors.sand,
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 44,
  },
  watchUnit: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "800",
  },
  watchStrapBottom: {
    backgroundColor: colors.textSoft,
    borderRadius: 18,
    height: 48,
    width: 78,
  },
  watchTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 18,
  },
  watchSubtitle: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  deviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  deviceStatusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  deviceCheck: {
    backgroundColor: colors.cream,
    borderColor: colors.stone,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 13,
  },
  deviceCheckTitle: {
    color: colors.textSoft,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  deviceCheckValue: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  tabBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.taupe,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 22,
    flexDirection: "row",
    gap: 4,
    left: 18,
    padding: 6,
    position: "absolute",
    right: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  tabButtonActive: {
    backgroundColor: colors.ink,
  },
  tabText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "900",
  },
  tabTextActive: {
    color: colors.sand,
  },
});
