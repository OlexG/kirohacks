export type Envelope =
  | EnvelopeOf<ProfileSnapshot, "profile_snapshot">
  | EnvelopeOf<HealthKitSnapshot, "healthkit_snapshot">
  | EnvelopeOf<FeatureWindow, "feature_window">
  | EnvelopeOf<InstabilityEvent, "instability_event">
  | EnvelopeOf<SessionSummary, "session_summary">;

export type EnvelopeOf<TPayload, TMessageType extends string> = {
  schemaVersion: "fallrisk.v1";
  messageType: TMessageType;
  participantId: string;
  deviceId: string;
  sessionId: string | null;
  generatedAt: string;
  sequence: number;
  source: {
    app: "watch" | "ios";
    watchModel?: "Apple Watch Series 9";
    watchOS?: string;
    iOS?: string;
    iphoneCarriedAtWaistRequired: true;
  };
  location: GeoLocationSnapshot | null;
  payload: TPayload;
};

export type GeoLocationSnapshot = {
  latitude: number;
  longitude: number;
  horizontalAccuracyM: number | null;
  altitudeM: number | null;
  verticalAccuracyM: number | null;
  speedMps: number | null;
  courseDeg: number | null;
  timestamp: string;
  source: "watch_gps";
};

export type ProfileSnapshot = {
  ageYears: number | null;
  sex: "female" | "male" | "other" | "unknown";
  heightCm: number | null;
  assistiveDevice: "none" | "cane" | "walker" | "wheelchair" | "unknown";
  impairmentTags: string[];
  priorFalls12mo: number | null;
  injuriousFall12mo: boolean | null;
  unableToRiseAfterFall12mo: boolean | null;
};

export type HealthKitSnapshot = {
  lookbackHours: number;
  mobility: {
    walkingSteadinessScore01: number | null;
    walkingSteadinessClass: "ok" | "low" | "very_low" | "unknown";
    walkingSteadinessEvent: "initial_low" | "initial_very_low" | "repeat_low" | "repeat_very_low" | null;
    walkingSpeedMps: number | null;
    walkingStepLengthM: number | null;
    walkingAsymmetryPct: number | null;
    walkingDoubleSupportPct: number | null;
    sixMinuteWalkDistanceM: number | null;
    stairAscentSpeedMps: number | null;
    stairDescentSpeedMps: number | null;
  };
  activity: {
    stepCount: number | null;
    distanceWalkingRunningM: number | null;
    flightsAscended: number | null;
    flightsDescended: number | null;
  };
  cardio: {
    restingHrBpm: number | null;
    walkingHrAvgBpm: number | null;
    hrvSdnnMs: number | null;
  };
  riskFlags: RiskFlag[];
};

export type FeatureWindow = {
  windowStart: string;
  windowEnd: string;
  collectionMode: "safety_session";
  sampleRateHz: number;
  sampleCount: number;
  activityClass: "standing" | "walking" | "stairs_up" | "stairs_down" | "unknown";
  motion: {
    accelMagnitudeMeanG: number | null;
    accelMagnitudeRmsG: number | null;
    accelMagnitudePeakG: number | null;
    userAccelRmsG: number | null;
    jerkRmsGPerS: number | null;
    jerkPeakGPerS: number | null;
    gyroMagnitudeMeanRadS: number | null;
    gyroMagnitudePeakRadS: number | null;
    attitudeChangeDeg: number | null;
    swayRmsDeg: number | null;
    turnCount: number | null;
    maxTurnRateDegS: number | null;
    turnRecoverySteps: number | null;
  };
  gait: {
    stepCount: number | null;
    cadenceSpm: number | null;
    cadenceCvPct: number | null;
    strideTimeMeanMs: number | null;
    strideTimeCvPct: number | null;
    gaitRegularity01: number | null;
  };
  elevation: {
    altitudeDeltaM: number | null;
    floorsAscended: number | null;
    floorsDescended: number | null;
  };
  cardio: {
    hrMeanBpm: number | null;
    hrMaxBpm: number | null;
    hrDeltaFromBaselineBpm: number | null;
    hrConfidence: "low" | "medium" | "high" | "unknown";
  };
  scores: {
    ruleRiskScore100: number;
    ruleInstabilityScore100: number;
    ruleRiskLevel: "low" | "moderate" | "high";
  };
  riskFlags: RiskFlag[];
};

export type InstabilityEvent = {
  eventId: string;
  detectedAt: string;
  eventType: "stumble_candidate" | "near_fall_candidate" | "high_sway" | "risky_turn" | "gait_degradation" | "manual_sos";
  severity: "info" | "moderate" | "high";
  triggerWindowStart: string;
  triggerWindowEnd: string;
  evidence: {
    accelPeakG: number | null;
    gyroPeakRadS: number | null;
    jerkPeakGPerS: number | null;
    cadenceBreak: boolean;
    recoverySteps: number | null;
    activityClass: string;
  };
  userFeedback: "unanswered" | "confirmed_issue" | "false_alarm" | "dismissed";
};

export type SessionSummary = {
  sessionStart: string;
  sessionEnd: string;
  durationSec: number;
  totalSteps: number | null;
  distanceM: number | null;
  instabilityEventCount: number;
  highRiskMinutes: number;
  avgCadenceSpm: number | null;
  avgWalkingSpeedMps: number | null;
  finalRuleRiskScore100: number;
  finalRuleRiskLevel: "low" | "moderate" | "high";
  riskFlags: RiskFlag[];
};

export type RiskFlag = {
  code: string;
  severity: "info" | "moderate" | "high";
  value: number | string | boolean | null;
  threshold: number | string | boolean | null;
  basis: "clinical_threshold" | "apple_classification" | "personal_baseline" | "heuristic";
};
