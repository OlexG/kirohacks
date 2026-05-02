import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SABAWOON_HAKIMI_PERSON_ID } from "@/lib/biometrics-data";

type JsonObject = Record<string, unknown>;

export type FallRiskLevel = "low" | "moderate" | "high";
export type WalkingSteadinessClass = "ok" | "low" | "very_low" | "unknown";
export type FallRiskMessageType =
  | "profile_snapshot"
  | "healthkit_snapshot"
  | "feature_window"
  | "instability_event"
  | "session_summary";

export type FallRiskObservation = {
  id: string;
  person_id: string;
  schema_version: string;
  message_type: Exclude<FallRiskMessageType, "profile_snapshot">;
  device_id: string;
  session_id: string | null;
  generated_at: string;
  sequence: number;
  source_app: "watch" | "ios";
  window_start: string | null;
  window_end: string | null;
  detected_at: string | null;
  event_type: string | null;
  severity: "info" | "moderate" | "high" | null;
  activity_class: string | null;
  rule_risk_score_100: number | null;
  rule_instability_score_100: number | null;
  rule_risk_level: FallRiskLevel | null;
  ml_risk_score_01: number | null;
  ml_model_version: string | null;
  walking_steadiness_score_01: number | null;
  walking_steadiness_class: WalkingSteadinessClass | null;
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
  risk_flags: unknown[];
  payload: JsonObject;
  created_at: string;
};

export class FallRiskEnvelopeError extends Error {}

const observationMessageTypes = [
  "healthkit_snapshot",
  "feature_window",
  "instability_event",
  "session_summary",
] as const;

const allMessageTypes = ["profile_snapshot", ...observationMessageTypes] as const;
const riskLevels = ["low", "moderate", "high"] as const;
const sourceApps = ["watch", "ios"] as const;
const eventSeverities = ["info", "moderate", "high"] as const;
const steadinessClasses = ["ok", "low", "very_low", "unknown"] as const;
const sexes = ["female", "male", "other", "unknown"] as const;
const assistiveDevices = ["none", "cane", "walker", "wheelchair", "unknown"] as const;

export function isFallRiskEnvelope(payload: JsonObject) {
  return payload.schemaVersion === "fallrisk.v1";
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(object: JsonObject, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function objectAt(object: JsonObject, key: string) {
  const value = object[key];
  return isObject(value) ? value : null;
}

function stringAt(object: JsonObject | null, key: string) {
  const value = object?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberAt(object: JsonObject | null, key: string) {
  const value = object?.[key];
  const numberValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(numberValue) ? numberValue : null;
}

function booleanAt(object: JsonObject | null, key: string) {
  const value = object?.[key];
  return typeof value === "boolean" ? value : null;
}

function arrayOfStringsAt(object: JsonObject | null, key: string) {
  const value = object?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : null;
}

function enumAt<const T extends readonly string[]>(object: JsonObject | null, key: string, values: T) {
  const value = stringAt(object, key);
  return value && values.includes(value) ? (value as T[number]) : null;
}

function parseIsoTimestamp(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new FallRiskEnvelopeError(`${fieldName} must be an ISO-8601 timestamp.`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new FallRiskEnvelopeError(`${fieldName} must be a valid ISO-8601 timestamp.`);
  }

  return parsed.toISOString();
}

function optionalIsoTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function integerOrNull(value: number | null) {
  return value === null ? null : Math.round(value);
}

function percentScore(value: number | null) {
  return value === null ? null : Math.round(value * 100);
}

function clampScore100(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseEnvelope(envelope: JsonObject) {
  const messageType = enumAt(envelope, "messageType", allMessageTypes);
  const source = objectAt(envelope, "source");
  const sourceApp = enumAt(source, "app", sourceApps);
  const payload = objectAt(envelope, "payload");
  const generatedAt = parseIsoTimestamp(envelope.generatedAt, "generatedAt");
  const deviceId = stringAt(envelope, "deviceId");
  const sessionId = hasOwn(envelope, "sessionId") ? stringAt(envelope, "sessionId") : null;
  const sequence = numberAt(envelope, "sequence");

  if (!messageType) {
    throw new FallRiskEnvelopeError("messageType is not supported.");
  }

  if (!deviceId) {
    throw new FallRiskEnvelopeError("deviceId is required.");
  }

  if (!sourceApp) {
    throw new FallRiskEnvelopeError("source.app must be watch or ios.");
  }

  if (!payload) {
    throw new FallRiskEnvelopeError("payload must be an object.");
  }

  if (sequence === null || !Number.isInteger(sequence)) {
    throw new FallRiskEnvelopeError("sequence must be an integer.");
  }

  return {
    schemaVersion: "fallrisk.v1",
    messageType,
    deviceId,
    sessionId,
    generatedAt,
    sequence,
    sourceApp,
    payload,
  };
}

function buildCareStatus(riskLevel: FallRiskLevel | null) {
  if (riskLevel === "high") {
    return { alert: "urgent", care_group: "active_alerts", status: "High fall-risk signal" };
  }

  if (riskLevel === "moderate") {
    return { alert: "warning", care_group: "watch_list", status: "Moderate fall-risk signal" };
  }

  if (riskLevel === "low") {
    return { alert: "stable", care_group: "stable", status: "Fall-risk signal low" };
  }

  return null;
}

async function updateSabawoonProfileSnapshot(payload: JsonObject, generatedAt: string) {
  const update: JsonObject = {
    updated_at: new Date().toISOString(),
    fall_risk_updated_at: generatedAt,
  };

  const ageYears = numberAt(payload, "ageYears");
  if (ageYears !== null) update.age = Math.round(ageYears);
  if (hasOwn(payload, "sex")) update.sex = enumAt(payload, "sex", sexes);
  if (hasOwn(payload, "heightCm")) update.height_cm = numberAt(payload, "heightCm");
  if (hasOwn(payload, "assistiveDevice")) {
    update.assistive_device = enumAt(payload, "assistiveDevice", assistiveDevices);
  }
  if (hasOwn(payload, "impairmentTags")) update.impairment_tags = arrayOfStringsAt(payload, "impairmentTags") ?? [];
  if (hasOwn(payload, "priorFalls12mo")) update.prior_falls_12mo = integerOrNull(numberAt(payload, "priorFalls12mo"));
  if (hasOwn(payload, "injuriousFall12mo")) update.injurious_fall_12mo = booleanAt(payload, "injuriousFall12mo");
  if (hasOwn(payload, "unableToRiseAfterFall12mo")) {
    update.unable_to_rise_after_fall_12mo = booleanAt(payload, "unableToRiseAfterFall12mo");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("care_people")
    .update(update)
    .eq("id", SABAWOON_HAKIMI_PERSON_ID)
    .select("id, name, updated_at")
    .single();

  if (error) {
    throw new Error(`Unable to update Sabawoon fall-risk profile: ${error.message}`);
  }

  return data;
}

function getScores(payload: JsonObject) {
  const scores = objectAt(payload, "scores");
  const ruleRiskScore100 = numberAt(scores, "ruleRiskScore100") ?? numberAt(payload, "finalRuleRiskScore100");
  const ruleInstabilityScore100 = numberAt(scores, "ruleInstabilityScore100");
  const ruleRiskLevel =
    enumAt(scores, "ruleRiskLevel", riskLevels) ?? enumAt(payload, "finalRuleRiskLevel", riskLevels);
  const mlRiskScore01 = numberAt(scores, "mlRiskScore01") ?? numberAt(payload, "finalMlRiskScore01");
  const mlModelVersion = stringAt(scores, "mlModelVersion");

  return {
    ruleRiskScore100: clampScore100(ruleRiskScore100),
    ruleInstabilityScore100: clampScore100(ruleInstabilityScore100),
    ruleRiskLevel,
    mlRiskScore01,
    mlModelVersion,
  };
}

function buildObservationInsert(envelope: ReturnType<typeof parseEnvelope>) {
  if (envelope.messageType === "profile_snapshot") {
    throw new FallRiskEnvelopeError("profile_snapshot cannot be stored as an observation.");
  }

  const payload = envelope.payload;
  const mobility = objectAt(payload, "mobility");
  const activity = objectAt(payload, "activity");
  const cardio = objectAt(payload, "cardio");
  const motion = objectAt(payload, "motion");
  const gait = objectAt(payload, "gait");
  const elevation = objectAt(payload, "elevation");
  const evidence = objectAt(payload, "evidence");
  const scores = getScores(payload);
  const riskFlags = Array.isArray(payload.riskFlags) ? payload.riskFlags : [];

  return {
    person_id: SABAWOON_HAKIMI_PERSON_ID,
    schema_version: envelope.schemaVersion,
    message_type: envelope.messageType,
    device_id: envelope.deviceId,
    session_id: envelope.sessionId,
    generated_at: envelope.generatedAt,
    sequence: envelope.sequence,
    source_app: envelope.sourceApp,
    window_start:
      optionalIsoTimestamp(payload.windowStart) ??
      optionalIsoTimestamp(payload.triggerWindowStart) ??
      optionalIsoTimestamp(payload.sessionStart),
    window_end:
      optionalIsoTimestamp(payload.windowEnd) ??
      optionalIsoTimestamp(payload.triggerWindowEnd) ??
      optionalIsoTimestamp(payload.sessionEnd),
    detected_at: optionalIsoTimestamp(payload.detectedAt),
    event_type: stringAt(payload, "eventType"),
    severity: enumAt(payload, "severity", eventSeverities),
    activity_class: stringAt(payload, "activityClass") ?? stringAt(evidence, "activityClass"),
    rule_risk_score_100: scores.ruleRiskScore100,
    rule_instability_score_100: scores.ruleInstabilityScore100,
    rule_risk_level: scores.ruleRiskLevel,
    ml_risk_score_01: scores.mlRiskScore01,
    ml_model_version: scores.mlModelVersion,
    walking_steadiness_score_01: numberAt(mobility, "walkingSteadinessScore01"),
    walking_steadiness_class: enumAt(mobility, "walkingSteadinessClass", steadinessClasses),
    walking_speed_mps: numberAt(mobility, "walkingSpeedMps") ?? numberAt(payload, "avgWalkingSpeedMps"),
    walking_step_length_m: numberAt(mobility, "walkingStepLengthM"),
    walking_asymmetry_pct: numberAt(mobility, "walkingAsymmetryPct"),
    walking_double_support_pct: numberAt(mobility, "walkingDoubleSupportPct"),
    heart_rate_bpm: integerOrNull(numberAt(cardio, "hrMeanBpm") ?? numberAt(cardio, "walkingHrAvgBpm")),
    cadence_spm: numberAt(gait, "cadenceSpm") ?? numberAt(payload, "avgCadenceSpm"),
    cadence_cv_pct: numberAt(gait, "cadenceCvPct"),
    stride_time_cv_pct: numberAt(gait, "strideTimeCvPct"),
    accel_peak_g: numberAt(motion, "accelMagnitudePeakG") ?? numberAt(evidence, "accelPeakG"),
    jerk_peak_g_per_s: numberAt(motion, "jerkPeakGPerS") ?? numberAt(evidence, "jerkPeakGPerS"),
    gyro_peak_rad_s: numberAt(motion, "gyroMagnitudePeakRadS") ?? numberAt(evidence, "gyroPeakRadS"),
    attitude_change_deg: numberAt(motion, "attitudeChangeDeg"),
    sway_rms_deg: numberAt(motion, "swayRmsDeg"),
    step_count: integerOrNull(numberAt(gait, "stepCount") ?? numberAt(activity, "stepCount") ?? numberAt(payload, "totalSteps")),
    altitude_delta_m: numberAt(elevation, "altitudeDeltaM"),
    floors_ascended: integerOrNull(numberAt(elevation, "floorsAscended") ?? numberAt(activity, "flightsAscended")),
    floors_descended: integerOrNull(numberAt(elevation, "floorsDescended") ?? numberAt(activity, "flightsDescended")),
    risk_flags: riskFlags,
    payload,
  };
}

async function updateLatestCarePersonState(observation: ReturnType<typeof buildObservationInsert>) {
  const update: JsonObject = {
    last_seen_label: "Just now",
    updated_at: new Date().toISOString(),
    fall_risk_updated_at: observation.generated_at,
  };

  if (observation.rule_risk_score_100 !== null) update.fall_rule_risk_score_100 = observation.rule_risk_score_100;
  if (observation.rule_instability_score_100 !== null) {
    update.fall_rule_instability_score_100 = observation.rule_instability_score_100;
  }
  if (observation.rule_risk_level !== null) update.fall_rule_risk_level = observation.rule_risk_level;
  if (observation.ml_risk_score_01 !== null) update.fall_ml_risk_score_01 = observation.ml_risk_score_01;
  if (observation.ml_model_version !== null) update.fall_ml_model_version = observation.ml_model_version;
  if (observation.walking_steadiness_class !== null) {
    update.walking_steadiness_class = observation.walking_steadiness_class;
  }
  if (observation.walking_steadiness_score_01 !== null) {
    update.walking_steadiness_score_01 = observation.walking_steadiness_score_01;
  }
  if (observation.walking_speed_mps !== null) update.walking_speed_mps = observation.walking_speed_mps;
  if (observation.walking_step_length_m !== null) update.walking_step_length_m = observation.walking_step_length_m;
  if (observation.walking_asymmetry_pct !== null) update.walking_asymmetry_pct = observation.walking_asymmetry_pct;
  if (observation.walking_double_support_pct !== null) {
    update.walking_double_support_pct = observation.walking_double_support_pct;
  }
  if (observation.heart_rate_bpm !== null) update.heart_rate_bpm = observation.heart_rate_bpm;

  const status = buildCareStatus(observation.rule_risk_level);
  if (status) {
    update.alert = status.alert;
    update.care_group = status.care_group;
    update.status = status.status;
    update.context = `${status.status}. Latest rule score ${observation.rule_risk_score_100 ?? "--"}/100.`;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("care_people").update(update).eq("id", SABAWOON_HAKIMI_PERSON_ID);

  if (error) {
    throw new Error(`Unable to update Sabawoon latest fall-risk state: ${error.message}`);
  }
}

export async function recordSabawoonFallRiskEnvelope(payload: JsonObject) {
  const envelope = parseEnvelope(payload);

  if (envelope.messageType === "profile_snapshot") {
    const data = await updateSabawoonProfileSnapshot(envelope.payload, envelope.generatedAt);
    return { messageType: envelope.messageType, person_id: SABAWOON_HAKIMI_PERSON_ID, data };
  }

  const observation = buildObservationInsert(envelope);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fall_risk_observations")
    .insert(observation)
    .select("id, person_id, message_type, generated_at, created_at")
    .single();

  if (error) {
    throw new Error(`Unable to record fall-risk observation: ${error.message}`);
  }

  await updateLatestCarePersonState(observation);

  return { messageType: envelope.messageType, person_id: SABAWOON_HAKIMI_PERSON_ID, data };
}

function normalizeObservation(row: JsonObject): FallRiskObservation {
  const riskFlags = row.risk_flags;
  return {
    ...(row as FallRiskObservation),
    risk_flags: Array.isArray(riskFlags) ? riskFlags : [],
    rule_risk_score_100: integerOrNull(numberAt(row, "rule_risk_score_100")),
    rule_instability_score_100: integerOrNull(numberAt(row, "rule_instability_score_100")),
    ml_risk_score_01: numberAt(row, "ml_risk_score_01"),
    walking_steadiness_score_01: numberAt(row, "walking_steadiness_score_01"),
    walking_speed_mps: numberAt(row, "walking_speed_mps"),
    walking_step_length_m: numberAt(row, "walking_step_length_m"),
    walking_asymmetry_pct: numberAt(row, "walking_asymmetry_pct"),
    walking_double_support_pct: numberAt(row, "walking_double_support_pct"),
    heart_rate_bpm: integerOrNull(numberAt(row, "heart_rate_bpm")),
    cadence_spm: numberAt(row, "cadence_spm"),
    cadence_cv_pct: numberAt(row, "cadence_cv_pct"),
    stride_time_cv_pct: numberAt(row, "stride_time_cv_pct"),
    accel_peak_g: numberAt(row, "accel_peak_g"),
    jerk_peak_g_per_s: numberAt(row, "jerk_peak_g_per_s"),
    gyro_peak_rad_s: numberAt(row, "gyro_peak_rad_s"),
    attitude_change_deg: numberAt(row, "attitude_change_deg"),
    sway_rms_deg: numberAt(row, "sway_rms_deg"),
    step_count: integerOrNull(numberAt(row, "step_count")),
    altitude_delta_m: numberAt(row, "altitude_delta_m"),
    floors_ascended: integerOrNull(numberAt(row, "floors_ascended")),
    floors_descended: integerOrNull(numberAt(row, "floors_descended")),
  };
}

export async function listFallRiskObservationsForPerson(personId: string, limit = 80) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fall_risk_observations")
    .select(
      "id, person_id, schema_version, message_type, device_id, session_id, generated_at, sequence, source_app, window_start, window_end, detected_at, event_type, severity, activity_class, rule_risk_score_100, rule_instability_score_100, rule_risk_level, ml_risk_score_01, ml_model_version, walking_steadiness_score_01, walking_steadiness_class, walking_speed_mps, walking_step_length_m, walking_asymmetry_pct, walking_double_support_pct, heart_rate_bpm, cadence_spm, cadence_cv_pct, stride_time_cv_pct, accel_peak_g, jerk_peak_g_per_s, gyro_peak_rad_s, attitude_change_deg, sway_rms_deg, step_count, altitude_delta_m, floors_ascended, floors_descended, risk_flags, payload, created_at",
    )
    .eq("person_id", personId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load fall-risk observations: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeObservation(row as JsonObject));
}

export function formatRiskScore(score: number | null) {
  return score === null ? "--" : `${score}/100`;
}

export function formatMlScore(score: number | null) {
  return score === null ? "--" : `${Math.round(score * 100)}%`;
}
