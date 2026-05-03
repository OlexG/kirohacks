import { getSupabaseAdmin } from "@/lib/supabase/server";
import { findSignal, type RuleOperator, type RuleSeverity } from "@/lib/rules-options";

type JsonObject = Record<string, unknown>;

type RuleRow = {
  id: string;
  person_id: string;
  person_name: string;
  signal_key: string;
  signal_label: string;
  operator: RuleOperator;
  threshold: number | string | null;
  unit: string | null;
  severity: RuleSeverity;
  active: boolean;
  notification_channel: string;
  notes: string | null;
};

type ObservationRow = {
  id?: string;
  person_id: string;
  message_type: string;
  generated_at: string;
  event_type: string | null;
  severity: string | null;
  rule_risk_score_100: number | string | null;
  rule_instability_score_100: number | string | null;
  rule_risk_level: string | null;
  walking_steadiness_score_01: number | string | null;
  walking_steadiness_class: string | null;
  walking_speed_mps: number | string | null;
  walking_asymmetry_pct: number | string | null;
  walking_double_support_pct: number | string | null;
  heart_rate_bpm: number | string | null;
  cadence_spm: number | string | null;
  jerk_peak_g_per_s: number | string | null;
  attitude_change_deg: number | string | null;
  sway_rms_deg: number | string | null;
  step_count: number | string | null;
  risk_flags: unknown;
};

type WatchAlertRow = {
  person_id: string;
  alert_type: string | null;
  severity: string | null;
  occurred_at: string;
  heart_rate_bpm: number | string | null;
  steps: number | string | null;
};

type RuleReading = {
  status: "available" | "unavailable";
  detected?: boolean;
  metricLabel: string;
  metricValue: string;
  numericValue?: number;
};

type RuleEvaluation = RuleReading & {
  matches: boolean;
  shouldResolve: boolean;
};

const observationSelect = [
  "id",
  "person_id",
  "message_type",
  "generated_at",
  "event_type",
  "severity",
  "rule_risk_score_100",
  "rule_instability_score_100",
  "rule_risk_level",
  "walking_steadiness_score_01",
  "walking_steadiness_class",
  "walking_speed_mps",
  "walking_asymmetry_pct",
  "walking_double_support_pct",
  "heart_rate_bpm",
  "cadence_spm",
  "jerk_peak_g_per_s",
  "attitude_change_deg",
  "sway_rms_deg",
  "step_count",
  "risk_flags",
].join(", ");

const ruleSelect =
  "id, person_id, person_name, signal_key, signal_label, operator, threshold, unit, severity, active, notification_channel, notes";

function numberOrNull(value: unknown) {
  const numberValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizedFlags(riskFlags: unknown) {
  return Array.isArray(riskFlags) ? riskFlags.filter((flag): flag is JsonObject => Boolean(flag) && typeof flag === "object") : [];
}

function hasRiskFlag(observation: ObservationRow, code: string) {
  return normalizedFlags(observation.risk_flags).some((flag) => flag.code === code);
}

function formatMetricValue(value: number, unit: string | null) {
  if (unit === "/100") {
    return `${Math.round(value)}/100`;
  }

  if (unit === "%") {
    return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
  }

  if (unit === "score") {
    return value.toFixed(2);
  }

  if (unit === "g/s" || unit === "deg") {
    return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
  }

  if (unit) {
    return `${value.toFixed(value % 1 === 0 ? 0 : 1)} ${unit}`;
  }

  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

function numericReading(
  observation: ObservationRow,
  rule: RuleRow,
  field: keyof ObservationRow,
  metricLabel = rule.signal_label,
): RuleReading {
  const value = numberOrNull(observation[field]);

  if (value === null) {
    return {
      status: "unavailable",
      metricLabel,
      metricValue: "Not reported",
    };
  }

  return {
    status: "available",
    metricLabel,
    metricValue: formatMetricValue(value, rule.unit),
    numericValue: value,
  };
}

function detectedReading(metricLabel: string, detected: boolean, metricValue = "Detected"): RuleReading {
  return {
    status: "available",
    detected,
    metricLabel,
    metricValue: detected ? metricValue : "Not detected",
  };
}

function readingForRule(rule: RuleRow, observation: ObservationRow): RuleReading {
  switch (rule.signal_key) {
    case "fall_risk_score":
      return numericReading(observation, rule, "rule_risk_score_100");
    case "instability_score":
      return numericReading(observation, rule, "rule_instability_score_100");
    case "heart_rate":
    case "walking_heart_rate_average":
      return numericReading(observation, rule, "heart_rate_bpm", "Heart rate");
    case "steps":
      return numericReading(observation, rule, "step_count", "Step count");
    case "walking_steadiness_score":
      return numericReading(observation, rule, "walking_steadiness_score_01");
    case "walking_asymmetry":
      return numericReading(observation, rule, "walking_asymmetry_pct");
    case "walking_double_support":
      return numericReading(observation, rule, "walking_double_support_pct");
    case "jerk_peak":
      return numericReading(observation, rule, "jerk_peak_g_per_s");
    case "sway_rms":
      return numericReading(observation, rule, "sway_rms_deg");
    case "attitude_change":
      return numericReading(observation, rule, "attitude_change_deg");
    case "instability_event": {
      const detected = observation.message_type === "instability_event";
      const value = observation.severity ? `${observation.severity} severity` : "Detected";
      return detectedReading("Instability event", detected, value);
    }
    case "repeated_instability_cluster":
      return detectedReading(
        "Repeated instability cluster",
        hasRiskFlag(observation, "repeated_instability_cluster_10m"),
        "Cluster in last 10 min",
      );
    case "fall_detected": {
      const eventType = observation.event_type?.toLowerCase() ?? "";
      return detectedReading("Fall event", eventType.includes("fall"), observation.event_type ?? "Detected");
    }
    case "high_heart_rate_event": {
      const eventType = observation.event_type?.toLowerCase() ?? "";
      return detectedReading("High heart-rate event", eventType.includes("high") && eventType.includes("heart"));
    }
    case "low_heart_rate_event": {
      const eventType = observation.event_type?.toLowerCase() ?? "";
      return detectedReading("Low heart-rate event", eventType.includes("low") && eventType.includes("heart"));
    }
    default:
      return {
        status: "unavailable",
        metricLabel: rule.signal_label,
        metricValue: "Not reported",
      };
  }
}

function evaluateRule(rule: RuleRow, observation: ObservationRow): RuleEvaluation {
  const reading = readingForRule(rule, observation);

  if (reading.status === "unavailable") {
    return {
      ...reading,
      matches: false,
      shouldResolve: false,
    };
  }

  if (rule.operator === "detected") {
    return {
      ...reading,
      matches: reading.detected === true,
      shouldResolve: false,
    };
  }

  const threshold = numberOrNull(rule.threshold);
  if (threshold === null || reading.numericValue === undefined) {
    return {
      ...reading,
      matches: false,
      shouldResolve: false,
    };
  }

  const matches =
    rule.operator === "above"
      ? reading.numericValue >= threshold
      : rule.operator === "below"
        ? reading.numericValue <= threshold
        : rule.operator === "equals"
          ? reading.numericValue === threshold
          : false;

  return {
    ...reading,
    matches,
    shouldResolve: !matches,
  };
}

function alertSeverity(severity: RuleSeverity) {
  if (severity === "urgent") {
    return "urgent";
  }

  if (severity === "info") {
    return "info";
  }

  return "warning";
}

function alertSortOrder(severity: RuleSeverity) {
  if (severity === "urgent") {
    return 10;
  }

  if (severity === "info") {
    return 60;
  }

  return 30;
}

function alertTitle(rule: RuleRow) {
  switch (rule.signal_key) {
    case "instability_score":
      return "Instability score reached critical range";
    case "instability_event":
      return "Instability event detected";
    case "repeated_instability_cluster":
      return "Repeated instability detected";
    case "fall_risk_score":
      return "Fall-risk score elevated";
    case "jerk_peak":
      return "Abrupt motion spike";
    case "fall_detected":
      return "Fall detected";
    case "high_heart_rate_event":
      return "High heart-rate notification";
    case "low_heart_rate_event":
      return "Low heart-rate notification";
    case "walking_steadiness_score":
      return "Walking steadiness low";
    case "walking_asymmetry":
      return "Walking asymmetry high";
    case "walking_double_support":
      return "Double support high";
    case "heart_rate":
    case "walking_heart_rate_average":
      return rule.operator === "below" ? "Heart rate low" : "Heart rate high";
    default:
      return rule.signal_label;
  }
}

function conditionLabel(rule: RuleRow) {
  const threshold = numberOrNull(rule.threshold);
  if (rule.operator === "detected") {
    return "detected";
  }

  if (threshold === null) {
    return "matched";
  }

  const prefix = rule.operator === "below" ? "at/below" : "at/above";
  return `${prefix} ${formatMetricValue(threshold, rule.unit)}`;
}

function nextStep(rule: RuleRow) {
  if (rule.signal_key === "fall_detected") {
    return "Call Sabawoon immediately; if he does not answer, escalate to the emergency contact.";
  }

  if (
    rule.signal_key === "instability_score" ||
    rule.signal_key === "instability_event" ||
    rule.signal_key === "repeated_instability_cluster" ||
    rule.signal_key === "fall_risk_score"
  ) {
    return "Check on Sabawoon now and ask whether he feels dizzy, weak, or unsteady.";
  }

  if (rule.signal_key.includes("walking") || rule.signal_key === "jerk_peak") {
    return "Review gait context and ask whether Sabawoon needs support before walking again.";
  }

  if (rule.signal_key.includes("heart")) {
    return "Check for chest pain, dizziness, shortness of breath, or unusual fatigue.";
  }

  return rule.severity === "urgent"
    ? "Escalate to the caregiver and verify Sabawoon is safe."
    : "Review the latest watch data and follow up if the pattern continues.";
}

function alertSummary(rule: RuleRow, evaluation: RuleEvaluation) {
  const signalLabel = rule.signal_label.toLowerCase();

  if (rule.operator === "detected") {
    return `${rule.person_name}'s watch reported ${signalLabel} (${evaluation.metricValue}).`;
  }

  return `${rule.person_name}'s ${signalLabel} is ${evaluation.metricValue}, triggering the ${conditionLabel(rule)} rule.`;
}

function buildAlert(rule: RuleRow, evaluation: RuleEvaluation) {
  const now = new Date().toISOString();
  return {
    alert_key: `rule-${rule.id}`,
    person_id: rule.person_id,
    title: alertTitle(rule),
    signal_label: rule.signal_label,
    severity: alertSeverity(rule.severity),
    status: "active",
    summary: alertSummary(rule, evaluation),
    metric_label: evaluation.metricLabel,
    metric_value: evaluation.metricValue,
    triggered_label: "Just now",
    next_step: nextStep(rule),
    sort_order: alertSortOrder(rule.severity),
    updated_at: now,
  };
}

export async function resolveCareRuleAlert(ruleId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("care_alerts")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("alert_key", `rule-${ruleId}`)
    .eq("status", "active");

  if (error) {
    throw new Error(`Unable to resolve rule alert: ${error.message}`);
  }
}

async function evaluateRulesForObservation(observation: ObservationRow) {
  const supabase = getSupabaseAdmin();
  const { data: rules, error } = await supabase
    .from("care_rules")
    .select(ruleSelect)
    .eq("person_id", observation.person_id)
    .eq("active", true);

  if (error) {
    throw new Error(`Unable to load rules for evaluation: ${error.message}`);
  }

  for (const rule of (rules ?? []) as RuleRow[]) {
    const signal = findSignal(rule.signal_key);
    if (!signal) {
      continue;
    }

    const evaluation = evaluateRule(rule, observation);
    if (evaluation.status === "unavailable") {
      continue;
    }

    if (evaluation.matches) {
      const { error: upsertError } = await supabase
        .from("care_alerts")
        .upsert(buildAlert(rule, evaluation), { onConflict: "alert_key" });

      if (upsertError) {
        throw new Error(`Unable to write rule alert: ${upsertError.message}`);
      }
      continue;
    }

    if (evaluation.shouldResolve) {
      await resolveCareRuleAlert(rule.id);
    }
  }
}

export async function evaluateCareRulesForFallRiskObservation(observation: ObservationRow) {
  await evaluateRulesForObservation(observation);
}

export async function evaluateCareRulesForWatchAlert(watchAlert: WatchAlertRow) {
  await evaluateRulesForObservation({
    person_id: watchAlert.person_id,
    message_type: "healthkit_snapshot",
    generated_at: watchAlert.occurred_at,
    event_type: watchAlert.alert_type,
    severity: watchAlert.severity,
    rule_risk_score_100: null,
    rule_instability_score_100: null,
    rule_risk_level: null,
    walking_steadiness_score_01: null,
    walking_steadiness_class: null,
    walking_speed_mps: null,
    walking_asymmetry_pct: null,
    walking_double_support_pct: null,
    heart_rate_bpm: watchAlert.heart_rate_bpm,
    cadence_spm: null,
    jerk_peak_g_per_s: null,
    attitude_change_deg: null,
    sway_rms_deg: null,
    step_count: watchAlert.steps,
    risk_flags: [],
  });
}

export async function evaluateCareRulesForLatestObservation(personId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fall_risk_observations")
    .select(observationSelect)
    .eq("person_id", personId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load latest observation for rule evaluation: ${error.message}`);
  }

  if (data) {
    await evaluateRulesForObservation(data as unknown as ObservationRow);
  }
}
