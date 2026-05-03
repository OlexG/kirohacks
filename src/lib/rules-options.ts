export type RuleOperator = "above" | "below" | "equals" | "detected" | "not_seen_for";
export type RuleSeverity = "info" | "review" | "urgent";

export type RuleSignalOption = {
  key:
    | "fall_detected"
    | "fall_risk_score"
    | "instability_score"
    | "instability_event"
    | "repeated_instability_cluster"
    | "walking_steadiness_score"
    | "walking_asymmetry"
    | "walking_double_support"
    | "jerk_peak"
    | "sway_rms"
    | "attitude_change"
    | "heart_rate"
    | "resting_heart_rate"
    | "walking_heart_rate_average"
    | "low_heart_rate_event"
    | "high_heart_rate_event"
    | "steps"
    | "watch_offline"
    | "blood_pressure_systolic"
    | "blood_pressure_diastolic";
  label: string;
  source: string;
  detail: string;
  defaultOperator: RuleOperator;
  operators: RuleOperator[];
  unit: string | null;
  defaultThreshold: number | null;
  thresholdLabel: string;
  requiresThreshold: boolean;
  reliability: "watch-native" | "healthkit-event" | "derived" | "imported";
};

export const RULE_SIGNALS: RuleSignalOption[] = [
  {
    key: "fall_detected",
    label: "Fall detected",
    source: "HealthKit fall samples",
    detail:
      "Apple Watch can record confirmed falls through HealthKit. Real-time fall notifications require a separate Core Motion entitlement.",
    defaultOperator: "detected",
    operators: ["detected"],
    unit: null,
    defaultThreshold: null,
    thresholdLabel: "No threshold needed",
    requiresThreshold: false,
    reliability: "healthkit-event",
  },
  {
    key: "fall_risk_score",
    label: "Fall-risk score",
    source: "Elsa fall-risk webhook",
    detail:
      "Uses the ruleRiskScore100 value sent by the watch fall-risk pipeline for each feature window.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "/100",
    defaultThreshold: 55,
    thresholdLabel: "Risk score",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "instability_score",
    label: "Instability score",
    source: "Elsa fall-risk webhook",
    detail:
      "Uses ruleInstabilityScore100 from feature windows. This is the same score shown on Sabawoon's profile card.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "/100",
    defaultThreshold: 80,
    thresholdLabel: "Instability score",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "instability_event",
    label: "Instability event",
    source: "Elsa fall-risk webhook",
    detail:
      "Triggers when the watch reports an instability_event message, including high-severity motion events.",
    defaultOperator: "detected",
    operators: ["detected"],
    unit: null,
    defaultThreshold: null,
    thresholdLabel: "No threshold needed",
    requiresThreshold: false,
    reliability: "derived",
  },
  {
    key: "repeated_instability_cluster",
    label: "Repeated instability cluster",
    source: "Elsa fall-risk risk flags",
    detail:
      "Triggers when the pipeline flags repeated instability events inside the current observation window.",
    defaultOperator: "detected",
    operators: ["detected"],
    unit: null,
    defaultThreshold: null,
    thresholdLabel: "Risk flag detected",
    requiresThreshold: false,
    reliability: "derived",
  },
  {
    key: "walking_steadiness_score",
    label: "Walking steadiness score",
    source: "Apple Watch mobility via webhook",
    detail:
      "Uses the walkingSteadinessScore01 mobility value when the watch sends it. Lower values indicate worse steadiness.",
    defaultOperator: "below",
    operators: ["above", "below"],
    unit: "score",
    defaultThreshold: 0.6,
    thresholdLabel: "0-1 score",
    requiresThreshold: true,
    reliability: "watch-native",
  },
  {
    key: "walking_asymmetry",
    label: "Walking asymmetry",
    source: "Apple Watch mobility via webhook",
    detail:
      "Uses walkingAsymmetryPct from mobility snapshots. Higher asymmetry can indicate gait changes worth review.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "%",
    defaultThreshold: 10,
    thresholdLabel: "Percent asymmetry",
    requiresThreshold: true,
    reliability: "watch-native",
  },
  {
    key: "walking_double_support",
    label: "Double support time",
    source: "Apple Watch mobility via webhook",
    detail:
      "Uses walkingDoubleSupportPct. Higher values can indicate cautious or unstable gait.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "%",
    defaultThreshold: 35,
    thresholdLabel: "Percent double support",
    requiresThreshold: true,
    reliability: "watch-native",
  },
  {
    key: "jerk_peak",
    label: "Jerk peak",
    source: "Watch motion features",
    detail:
      "Uses jerkPeakGPerS from motion windows. Spikes can accompany abrupt balance changes.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "g/s",
    defaultThreshold: 2,
    thresholdLabel: "Peak jerk",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "sway_rms",
    label: "Sway RMS",
    source: "Watch motion features",
    detail:
      "Uses swayRmsDeg from motion windows to flag unusually high postural sway.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "deg",
    defaultThreshold: 8,
    thresholdLabel: "Degrees",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "attitude_change",
    label: "Attitude change",
    source: "Watch motion features",
    detail:
      "Uses attitudeChangeDeg from motion windows to flag large orientation changes.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "deg",
    defaultThreshold: 45,
    thresholdLabel: "Degrees",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "heart_rate",
    label: "Heart rate",
    source: "Apple Watch heart-rate samples",
    detail:
      "A basic HealthKit app can read beats-per-minute samples after the wearer grants permission.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "bpm",
    defaultThreshold: 115,
    thresholdLabel: "Beats per minute",
    requiresThreshold: true,
    reliability: "watch-native",
  },
  {
    key: "resting_heart_rate",
    label: "Resting heart rate",
    source: "Apple Watch resting heart rate",
    detail:
      "Useful for quieter baseline rules when ordinary heart-rate samples are too noisy.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "bpm",
    defaultThreshold: 100,
    thresholdLabel: "Resting bpm",
    requiresThreshold: true,
    reliability: "watch-native",
  },
  {
    key: "walking_heart_rate_average",
    label: "Walking heart-rate average",
    source: "Apple Watch walking average",
    detail:
      "A simple rule for exertion while walking without needing a workout session.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "bpm",
    defaultThreshold: 110,
    thresholdLabel: "Walking bpm",
    requiresThreshold: true,
    reliability: "watch-native",
  },
  {
    key: "high_heart_rate_event",
    label: "High heart-rate notification",
    source: "HealthKit category event",
    detail:
      "Apple Watch creates read-only HealthKit events when its own high heart-rate notification fires.",
    defaultOperator: "detected",
    operators: ["detected"],
    unit: null,
    defaultThreshold: null,
    thresholdLabel: "System notification",
    requiresThreshold: false,
    reliability: "healthkit-event",
  },
  {
    key: "low_heart_rate_event",
    label: "Low heart-rate notification",
    source: "HealthKit category event",
    detail:
      "Apple Watch creates read-only HealthKit events when its own low heart-rate notification fires.",
    defaultOperator: "detected",
    operators: ["detected"],
    unit: null,
    defaultThreshold: null,
    thresholdLabel: "System notification",
    requiresThreshold: false,
    reliability: "healthkit-event",
  },
  {
    key: "steps",
    label: "Step count",
    source: "HealthKit activity samples",
    detail:
      "Inactivity rules can be derived from step count and recent sample timestamps.",
    defaultOperator: "below",
    operators: ["above", "below"],
    unit: "steps/day",
    defaultThreshold: 500,
    thresholdLabel: "Steps",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "watch_offline",
    label: "Watch offline",
    source: "App sync heartbeat",
    detail:
      "Not a HealthKit type; the companion app records its latest successful watch sync.",
    defaultOperator: "not_seen_for",
    operators: ["not_seen_for"],
    unit: "minutes",
    defaultThreshold: 30,
    thresholdLabel: "Minutes since sync",
    requiresThreshold: true,
    reliability: "derived",
  },
  {
    key: "blood_pressure_systolic",
    label: "Systolic blood pressure",
    source: "HealthKit imported pressure",
    detail:
      "Apple Watch does not natively measure blood pressure; HealthKit can store readings from compatible cuffs or apps.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "mmHg",
    defaultThreshold: 150,
    thresholdLabel: "Systolic mmHg",
    requiresThreshold: true,
    reliability: "imported",
  },
  {
    key: "blood_pressure_diastolic",
    label: "Diastolic blood pressure",
    source: "HealthKit imported pressure",
    detail:
      "Use this only when a connected cuff or another app writes blood-pressure readings into HealthKit.",
    defaultOperator: "above",
    operators: ["above", "below"],
    unit: "mmHg",
    defaultThreshold: 90,
    thresholdLabel: "Diastolic mmHg",
    requiresThreshold: true,
    reliability: "imported",
  },
];

export function findSignal(signalKey: string) {
  return RULE_SIGNALS.find((signal) => signal.key === signalKey);
}
