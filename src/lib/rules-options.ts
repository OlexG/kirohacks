export type RuleOperator = "above" | "below" | "equals" | "detected" | "not_seen_for";
export type RuleSeverity = "info" | "review" | "urgent";

export type RuleSignalOption = {
  key:
    | "fall_detected"
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
