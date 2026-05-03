import Foundation

@propertyWrapper
struct NullCodable<Value: Codable>: Codable {
    var wrappedValue: Value?

    init(wrappedValue: Value?) {
        self.wrappedValue = wrappedValue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        wrappedValue = container.decodeNil() ? nil : try container.decode(Value.self)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let wrappedValue {
            try container.encode(wrappedValue)
        } else {
            try container.encodeNil()
        }
    }
}

enum MessageType: String, Codable {
    case profileSnapshot = "profile_snapshot"
    case healthKitSnapshot = "healthkit_snapshot"
    case featureWindow = "feature_window"
    case instabilityEvent = "instability_event"
    case sessionSummary = "session_summary"
}

enum SourceApp: String, Codable {
    case watch
    case ios
}

struct PayloadSource: Codable {
    var app: SourceApp
    var watchModel: String?
    var watchOS: String?
    var iOS: String?
    var iphoneCarriedAtWaistRequired: Bool
}

struct Envelope<Payload: Encodable>: Encodable {
    var schemaVersion = "fallrisk.v1"
    var messageType: MessageType
    var participantId: String
    var deviceId: String
    @NullCodable var sessionId: String?
    var generatedAt: String
    var sequence: Int
    var source: PayloadSource
    @NullCodable var location: GeoLocationSnapshot?
    var payload: Payload
}

struct GeoLocationSnapshot: Codable {
    var latitude: Double
    var longitude: Double
    @NullCodable var horizontalAccuracyM: Double?
    @NullCodable var altitudeM: Double?
    @NullCodable var verticalAccuracyM: Double?
    @NullCodable var speedMps: Double?
    @NullCodable var courseDeg: Double?
    var timestamp: String
    var source: String
}

enum Sex: String, Codable, CaseIterable, Identifiable {
    case female
    case male
    case other
    case unknown

    var id: String { rawValue }
}

enum AssistiveDevice: String, Codable, CaseIterable, Identifiable {
    case none
    case cane
    case walker
    case wheelchair
    case unknown

    var id: String { rawValue }
}

struct ProfileSnapshot: Codable {
    @NullCodable var ageYears: Int?
    var sex: Sex
    @NullCodable var heightCm: Double?
    var assistiveDevice: AssistiveDevice
    var impairmentTags: [String]
    @NullCodable var priorFalls12mo: Int?
    @NullCodable var injuriousFall12mo: Bool?
    @NullCodable var unableToRiseAfterFall12mo: Bool?
}

enum WalkingSteadinessClass: String, Codable {
    case ok
    case low
    case veryLow = "very_low"
    case unknown
}

enum WalkingSteadinessEvent: String, Codable {
    case initialLow = "initial_low"
    case initialVeryLow = "initial_very_low"
    case repeatLow = "repeat_low"
    case repeatVeryLow = "repeat_very_low"
}

struct HealthKitSnapshot: Codable {
    var lookbackHours: Int
    var mobility: Mobility
    var activity: Activity
    var cardio: Cardio
    var riskFlags: [RiskFlag]

    struct Mobility: Codable {
        @NullCodable var walkingSteadinessScore01: Double?
        var walkingSteadinessClass: WalkingSteadinessClass
        @NullCodable var walkingSteadinessEvent: WalkingSteadinessEvent?
        @NullCodable var walkingSpeedMps: Double?
        @NullCodable var walkingStepLengthM: Double?
        @NullCodable var walkingAsymmetryPct: Double?
        @NullCodable var walkingDoubleSupportPct: Double?
        @NullCodable var sixMinuteWalkDistanceM: Double?
        @NullCodable var stairAscentSpeedMps: Double?
        @NullCodable var stairDescentSpeedMps: Double?
    }

    struct Activity: Codable {
        @NullCodable var stepCount: Double?
        @NullCodable var distanceWalkingRunningM: Double?
        @NullCodable var flightsAscended: Double?
        @NullCodable var flightsDescended: Double?
    }

    struct Cardio: Codable {
        @NullCodable var restingHrBpm: Double?
        @NullCodable var walkingHrAvgBpm: Double?
        @NullCodable var hrvSdnnMs: Double?
    }
}

enum CollectionMode: String, Codable {
    case safetySession = "safety_session"
}

enum ActivityClass: String, Codable {
    case standing
    case walking
    case stairsUp = "stairs_up"
    case stairsDown = "stairs_down"
    case unknown
}

enum HeartRateConfidence: String, Codable {
    case low
    case medium
    case high
    case unknown
}

struct FeatureWindow: Codable {
    var windowStart: String
    var windowEnd: String
    var collectionMode: CollectionMode
    var sampleRateHz: Double
    var sampleCount: Int
    var activityClass: ActivityClass
    var motion: Motion
    var gait: Gait
    var elevation: Elevation
    var cardio: Cardio
    var scores: Scores
    var riskFlags: [RiskFlag]

    struct Motion: Codable {
        @NullCodable var accelMagnitudeMeanG: Double?
        @NullCodable var accelMagnitudeRmsG: Double?
        @NullCodable var accelMagnitudePeakG: Double?
        @NullCodable var userAccelRmsG: Double?
        @NullCodable var jerkRmsGPerS: Double?
        @NullCodable var jerkPeakGPerS: Double?
        @NullCodable var gyroMagnitudeMeanRadS: Double?
        @NullCodable var gyroMagnitudePeakRadS: Double?
        @NullCodable var attitudeChangeDeg: Double?
        @NullCodable var swayRmsDeg: Double?
        @NullCodable var turnCount: Int?
        @NullCodable var maxTurnRateDegS: Double?
        @NullCodable var turnRecoverySteps: Int?
    }

    struct Gait: Codable {
        @NullCodable var stepCount: Int?
        @NullCodable var cadenceSpm: Double?
        @NullCodable var cadenceCvPct: Double?
        @NullCodable var strideTimeMeanMs: Double?
        @NullCodable var strideTimeCvPct: Double?
        @NullCodable var gaitRegularity01: Double?
    }

    struct Elevation: Codable {
        @NullCodable var altitudeDeltaM: Double?
        @NullCodable var floorsAscended: Int?
        @NullCodable var floorsDescended: Int?
    }

    struct Cardio: Codable {
        @NullCodable var hrMeanBpm: Double?
        @NullCodable var hrMaxBpm: Double?
        @NullCodable var hrDeltaFromBaselineBpm: Double?
        var hrConfidence: HeartRateConfidence
    }

    struct Scores: Codable {
        var ruleRiskScore100: Int
        var ruleInstabilityScore100: Int
        var ruleRiskLevel: RiskLevel
    }
}

enum InstabilityEventType: String, Codable {
    case stumbleCandidate = "stumble_candidate"
    case nearFallCandidate = "near_fall_candidate"
    case highSway = "high_sway"
    case riskyTurn = "risky_turn"
    case gaitDegradation = "gait_degradation"
    case manualSOS = "manual_sos"
}

enum Severity: String, Codable {
    case info
    case moderate
    case high
}

enum UserFeedback: String, Codable {
    case unanswered
    case confirmedIssue = "confirmed_issue"
    case falseAlarm = "false_alarm"
    case dismissed
}

struct InstabilityEvent: Codable, Identifiable {
    var eventId: String
    var detectedAt: String
    var eventType: InstabilityEventType
    var severity: Severity
    var triggerWindowStart: String
    var triggerWindowEnd: String
    var evidence: Evidence
    var userFeedback: UserFeedback

    var id: String { eventId }

    struct Evidence: Codable {
        @NullCodable var accelPeakG: Double?
        @NullCodable var gyroPeakRadS: Double?
        @NullCodable var jerkPeakGPerS: Double?
        var cadenceBreak: Bool
        @NullCodable var recoverySteps: Int?
        var activityClass: String
    }
}

struct SessionSummary: Codable {
    var sessionStart: String
    var sessionEnd: String
    var durationSec: Int
    @NullCodable var totalSteps: Int?
    @NullCodable var distanceM: Double?
    var instabilityEventCount: Int
    var highRiskMinutes: Int
    @NullCodable var avgCadenceSpm: Double?
    @NullCodable var avgWalkingSpeedMps: Double?
    var finalRuleRiskScore100: Int
    var finalRuleRiskLevel: RiskLevel
    var riskFlags: [RiskFlag]
}

enum RiskLevel: String, Codable {
    case low
    case moderate
    case high
}

enum RiskFlagBasis: String, Codable {
    case clinicalThreshold = "clinical_threshold"
    case appleClassification = "apple_classification"
    case personalBaseline = "personal_baseline"
    case heuristic
}

struct RiskFlag: Codable, Identifiable {
    var code: String
    var severity: Severity
    var value: RiskFlagValue
    var threshold: RiskFlagValue
    var basis: RiskFlagBasis

    var id: String { code + severity.rawValue }
}

enum RiskFlagValue: Codable {
    case number(Double)
    case string(String)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else {
            self = .string(try container.decode(String.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .number(let value):
            try container.encode(value)
        case .string(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }
}

extension RiskFlag {
    static func number(_ code: String, severity: Severity, value: Double?, threshold: Double?, basis: RiskFlagBasis) -> RiskFlag {
        RiskFlag(
            code: code,
            severity: severity,
            value: value.map(RiskFlagValue.number) ?? .null,
            threshold: threshold.map(RiskFlagValue.number) ?? .null,
            basis: basis
        )
    }

    static func text(_ code: String, severity: Severity, value: String?, threshold: String?, basis: RiskFlagBasis) -> RiskFlag {
        RiskFlag(
            code: code,
            severity: severity,
            value: value.map(RiskFlagValue.string) ?? .null,
            threshold: threshold.map(RiskFlagValue.string) ?? .null,
            basis: basis
        )
    }

    static func bool(_ code: String, severity: Severity, value: Bool?, threshold: Bool?, basis: RiskFlagBasis) -> RiskFlag {
        RiskFlag(
            code: code,
            severity: severity,
            value: value.map(RiskFlagValue.bool) ?? .null,
            threshold: threshold.map(RiskFlagValue.bool) ?? .null,
            basis: basis
        )
    }
}

enum PayloadClock {
    static let formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static func string(_ date: Date = Date()) -> String {
        formatter.string(from: date)
    }
}

extension Data {
    func base64URLEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
