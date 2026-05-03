import Foundation

struct BaselineStats: Codable {
    var count: Int = 0
    var mean: Double = 0
    var m2: Double = 0

    var standardDeviation: Double {
        count > 1 ? sqrt(m2 / Double(count - 1)) : 0
    }

    mutating func add(_ value: Double) {
        count += 1
        let delta = value - mean
        mean += delta / Double(count)
        let delta2 = value - mean
        m2 += delta * delta2
    }

    func isModerateHighValue(_ value: Double) -> Bool {
        count >= 20 && value > mean + 1.5 * max(standardDeviation, 0.01)
    }

    func isHighValue(_ value: Double) -> Bool {
        count >= 20 && value > mean + 2.0 * max(standardDeviation, 0.01)
    }

    func isModerateLowValue(_ value: Double) -> Bool {
        count >= 20 && value < mean - 1.5 * max(standardDeviation, 0.01)
    }

    func isHighLowValue(_ value: Double) -> Bool {
        count >= 20 && value < mean - 2.0 * max(standardDeviation, 0.01)
    }
}

struct BaselineSnapshot: Codable {
    var walkingSpeedMps = BaselineStats()
    var walkingStepLengthM = BaselineStats()
    var walkingAsymmetryPct = BaselineStats()
    var walkingDoubleSupportPct = BaselineStats()
    var strideTimeCvPct = BaselineStats()
    var cadenceCvPct = BaselineStats()
    var walkingHeartRateBpm = BaselineStats()
}

final class BaselineStore {
    private let key = "fallrisk.baselines.v1"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var snapshot: BaselineSnapshot {
        get {
            guard let data = defaults.data(forKey: key),
                  let decoded = try? JSONDecoder().decode(BaselineSnapshot.self, from: data) else {
                return BaselineSnapshot()
            }
            return decoded
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: key)
            }
        }
    }

    func update(with health: HealthKitSnapshot) {
        var next = snapshot
        if let value = health.mobility.walkingSpeedMps { next.walkingSpeedMps.add(value) }
        if let value = health.mobility.walkingStepLengthM { next.walkingStepLengthM.add(value) }
        if let value = health.mobility.walkingAsymmetryPct { next.walkingAsymmetryPct.add(value) }
        if let value = health.mobility.walkingDoubleSupportPct { next.walkingDoubleSupportPct.add(value) }
        if let value = health.cardio.walkingHrAvgBpm { next.walkingHeartRateBpm.add(value) }
        snapshot = next
    }

    func update(with feature: FeatureWindow) {
        var next = snapshot
        if let value = feature.gait.strideTimeCvPct { next.strideTimeCvPct.add(value) }
        if let value = feature.gait.cadenceCvPct { next.cadenceCvPct.add(value) }
        snapshot = next
    }
}

struct RiskScoreResult {
    var score: Int
    var level: RiskLevel
    var flags: [RiskFlag]
}

struct InstabilityScoreResult {
    var score: Int
    var flags: [RiskFlag]
    var eventType: InstabilityEventType?
    var severity: Severity?
}

enum RiskScorer {
    static func score(
        profile: ProfileSnapshot,
        health: HealthKitSnapshot?,
        feature: FeatureWindow?,
        baseline: BaselineSnapshot,
        instabilityEventsLast10Min: Int
    ) -> RiskScoreResult {
        var score = 0
        var flags: [RiskFlag] = []
        let profileResult = profileScore(profile)
        score += profileResult.score
        flags += profileResult.flags

        if let health {
            let healthResult = healthScore(health, baseline: baseline)
            score += healthResult.score
            flags += healthResult.flags
        }

        if let feature, shouldUseLiveGaitForFallRisk(feature, baseline: baseline) {
            let gaitResult = gaitQualityScore(feature, baseline: baseline)
            score += gaitResult.score
            flags += gaitResult.flags
        }

        if instabilityEventsLast10Min > 0 {
            let instabilityPoints = min(instabilityEventsLast10Min * 10, 50)
            score += instabilityPoints
            flags.append(.number(
                "instability_events_10m",
                severity: instabilityEventsLast10Min >= 5 ? .high : .moderate,
                value: Double(instabilityEventsLast10Min),
                threshold: 5,
                basis: .heuristic
            ))
        }

        score = min(score, 100)
        var level = level(for: score)
        if instabilityEventsLast10Min >= 5 {
            level = .high
            score = max(score, 70)
        }
        if (profile.priorFalls12mo ?? 0) >= 2 && flags.contains(where: { $0.code.hasPrefix("walking_") || $0.code.hasPrefix("gait_") }) {
            level = .high
            score = max(score, 70)
        }

        return RiskScoreResult(score: score, level: level, flags: flags)
    }

    static func instabilityScore(feature: FeatureWindow, previousInstabilityWithin60s: Bool, suppressEvents: Bool = false) -> InstabilityScoreResult {
        var score = 0
        var flags: [RiskFlag] = []
        let accelPeak = feature.motion.accelMagnitudePeakG
        let gyroPeak = feature.motion.gyroMagnitudePeakRadS
        let jerkPeak = feature.motion.jerkPeakGPerS
        let cadenceBreak = cadenceBreakDetected(feature)
        let walking = feature.activityClass == .walking || feature.activityClass == .stairsDown || feature.activityClass == .stairsUp
        let enoughStepsForStumble = (feature.gait.stepCount ?? 0) >= 3 || (feature.gait.cadenceSpm ?? 0) >= 60

        if let value = jerkPeak, value >= 5 {
            score += 20
            flags.append(.number("jerk_peak_gps_ge_5", severity: .moderate, value: value, threshold: 5, basis: .heuristic))
        }
        if let value = gyroPeak, value >= 4.5 {
            score += 20
            flags.append(.number("gyro_peak_rads_ge_4_5", severity: .moderate, value: value, threshold: 4.5, basis: .heuristic))
        }
        if let value = accelPeak, value >= 2.9 {
            score += 20
            flags.append(.number("accel_peak_g_ge_2_9", severity: .moderate, value: value, threshold: 2.9, basis: .heuristic))
        }
        if cadenceBreak {
            score += 20
            flags.append(.bool("cadence_break", severity: .moderate, value: true, threshold: true, basis: .heuristic))
        }
        if feature.activityClass == .stairsDown {
            score += 10
            flags.append(.text("stairs_descent_context", severity: .moderate, value: feature.activityClass.rawValue, threshold: "stairs_down", basis: .heuristic))
        }

        let spikeCount = [
            (jerkPeak ?? 0) >= 5,
            (gyroPeak ?? 0) >= 4.5,
            (accelPeak ?? 0) >= 2.9
        ].filter { $0 }.count
        let strongSpikeCombination = spikeCount >= 3
        var eventType: InstabilityEventType?
        var severity: Severity?
        if !suppressEvents && walking && enoughStepsForStumble && cadenceBreak && strongSpikeCombination {
            eventType = previousInstabilityWithin60s ? .nearFallCandidate : .stumbleCandidate
            severity = previousInstabilityWithin60s ? .high : .moderate
        } else if !suppressEvents && (feature.motion.swayRmsDeg ?? 0) > 14.5 && feature.activityClass == .standing {
            eventType = .highSway
            severity = .moderate
        } else if !suppressEvents && walking && enoughStepsForStumble && (feature.motion.maxTurnRateDegS ?? 0) > 240 && cadenceBreak && spikeCount >= 2 {
            eventType = .riskyTurn
            severity = .moderate
        } else {
            eventType = nil
            severity = nil
        }

        if previousInstabilityWithin60s && eventType != nil {
            score += 20
            flags.append(.bool("second_instability_within_60s", severity: .high, value: true, threshold: true, basis: .heuristic))
        }

        if eventType != nil {
            score = 100
        }

        return InstabilityScoreResult(score: min(score, 100), flags: flags, eventType: eventType, severity: severity)
    }

    static func cadenceBreakDetected(_ feature: FeatureWindow) -> Bool {
        if let cv = feature.gait.strideTimeCvPct, cv >= 20 { return true }
        if let cv = feature.gait.cadenceCvPct, cv >= 24 { return true }
        if let regularity = feature.gait.gaitRegularity01, regularity < 0.45 { return true }
        return false
    }

    private static func profileScore(_ profile: ProfileSnapshot) -> RiskScoreResult {
        var score = 0
        var flags: [RiskFlag] = []
        if let falls = profile.priorFalls12mo, falls >= 2 {
            score += 30
            flags.append(.number("prior_falls_12mo_ge_2", severity: .high, value: Double(falls), threshold: 2, basis: .clinicalThreshold))
        }
        if profile.injuriousFall12mo == true {
            score += 25
            flags.append(.bool("injurious_fall_12mo", severity: .high, value: true, threshold: true, basis: .clinicalThreshold))
        }
        if profile.unableToRiseAfterFall12mo == true {
            score += 25
            flags.append(.bool("unable_to_rise_after_fall_12mo", severity: .high, value: true, threshold: true, basis: .clinicalThreshold))
        }
        if profile.assistiveDevice != .none && profile.assistiveDevice != .unknown {
            score += 10
            flags.append(.text("assistive_device", severity: .moderate, value: profile.assistiveDevice.rawValue, threshold: "not_none", basis: .clinicalThreshold))
        }
        if !profile.impairmentTags.isEmpty {
            score += 10
            flags.append(.text("major_impairment_profile", severity: .moderate, value: profile.impairmentTags.joined(separator: ","), threshold: "any", basis: .clinicalThreshold))
        }
        return RiskScoreResult(score: score, level: level(for: score), flags: flags)
    }

    private static func healthScore(_ health: HealthKitSnapshot, baseline: BaselineSnapshot) -> RiskScoreResult {
        let maxHealthKitScore = 80
        var score = 0
        var flags = health.riskFlags

        switch health.mobility.walkingSteadinessClass {
        case .low:
            score += 15
            flags.append(.text("walking_steadiness_low", severity: .moderate, value: "low", threshold: "low", basis: .appleClassification))
        case .veryLow:
            score += 25
            flags.append(.text("walking_steadiness_very_low", severity: .high, value: "very_low", threshold: "very_low", basis: .appleClassification))
        case .ok, .unknown:
            break
        }

        if let speed = health.mobility.walkingSpeedMps {
            if speed < 0.8 {
                score += 15
                flags.append(.number("walking_speed_lt_0_8_mps", severity: .high, value: speed, threshold: 0.8, basis: .clinicalThreshold))
            } else if speed < 1.0 {
                score += 5
                flags.append(.number("walking_speed_lt_1_0_mps", severity: .moderate, value: speed, threshold: 1.0, basis: .clinicalThreshold))
            }
            if baseline.walkingSpeedMps.count >= 5 && baseline.walkingSpeedMps.mean - speed >= 0.10 {
                score += 10
                flags.append(.number("walking_speed_decline_ge_0_10_mps", severity: .moderate, value: baseline.walkingSpeedMps.mean - speed, threshold: 0.10, basis: .personalBaseline))
            }
        }

        if let stepLength = health.mobility.walkingStepLengthM, baseline.walkingStepLengthM.count >= 5 {
            let decline = max(0, baseline.walkingStepLengthM.mean - stepLength) / max(baseline.walkingStepLengthM.mean, 0.01)
            if decline >= 0.20 {
                score += 10
                flags.append(.number("walking_step_length_decline_ge_20pct", severity: .high, value: decline * 100, threshold: 20, basis: .personalBaseline))
            } else if decline >= 0.10 {
                score += 5
                flags.append(.number("walking_step_length_decline_ge_10pct", severity: .moderate, value: decline * 100, threshold: 10, basis: .personalBaseline))
            }
        }

        if let asymmetry = health.mobility.walkingAsymmetryPct {
            if asymmetry > 20 {
                score += 10
                flags.append(.number("walking_asymmetry_gt_20pct", severity: .high, value: asymmetry, threshold: 20, basis: .clinicalThreshold))
            } else if asymmetry > 10 {
                score += 5
                flags.append(.number("walking_asymmetry_gt_10pct", severity: .moderate, value: asymmetry, threshold: 10, basis: .clinicalThreshold))
            } else if baseline.walkingAsymmetryPct.count >= 5 && asymmetry - baseline.walkingAsymmetryPct.mean >= 5 {
                score += 5
                flags.append(.number("walking_asymmetry_baseline_rise_ge_5pp", severity: .moderate, value: asymmetry - baseline.walkingAsymmetryPct.mean, threshold: 5, basis: .personalBaseline))
            }
        }

        if let doubleSupport = health.mobility.walkingDoubleSupportPct {
            if doubleSupport > 45 {
                score += 10
                flags.append(.number("walking_double_support_gt_45pct", severity: .high, value: doubleSupport, threshold: 45, basis: .clinicalThreshold))
            } else if doubleSupport > 40 {
                score += 5
                flags.append(.number("walking_double_support_gt_40pct", severity: .moderate, value: doubleSupport, threshold: 40, basis: .clinicalThreshold))
            } else if baseline.walkingDoubleSupportPct.count >= 5 && doubleSupport - baseline.walkingDoubleSupportPct.mean >= 5 {
                score += 5
                flags.append(.number("walking_double_support_baseline_rise_ge_5pp", severity: .moderate, value: doubleSupport - baseline.walkingDoubleSupportPct.mean, threshold: 5, basis: .personalBaseline))
            }
        }

        score = min(score, maxHealthKitScore)
        return RiskScoreResult(score: score, level: level(for: score), flags: flags)
    }

    private static func gaitQualityScore(_ feature: FeatureWindow, baseline: BaselineSnapshot) -> RiskScoreResult {
        var score = 0
        var flags: [RiskFlag] = []

        if let cv = feature.gait.strideTimeCvPct {
            if baseline.strideTimeCvPct.isHighValue(cv) {
                score += 15
                flags.append(.number("gait_stride_time_cv_gt_baseline_2sd", severity: .high, value: cv, threshold: baseline.strideTimeCvPct.mean + 2 * baseline.strideTimeCvPct.standardDeviation, basis: .personalBaseline))
            } else if baseline.strideTimeCvPct.isModerateHighValue(cv) {
                score += 10
                flags.append(.number("gait_stride_time_cv_gt_baseline_1_5sd", severity: .moderate, value: cv, threshold: baseline.strideTimeCvPct.mean + 1.5 * baseline.strideTimeCvPct.standardDeviation, basis: .personalBaseline))
            }
        }

        if let cv = feature.gait.cadenceCvPct {
            if baseline.cadenceCvPct.isHighValue(cv) {
                score += 15
                flags.append(.number("gait_cadence_cv_gt_baseline_2sd", severity: .high, value: cv, threshold: baseline.cadenceCvPct.mean + 2 * baseline.cadenceCvPct.standardDeviation, basis: .personalBaseline))
            } else if baseline.cadenceCvPct.isModerateHighValue(cv) {
                score += 10
                flags.append(.number("gait_cadence_cv_gt_baseline_1_5sd", severity: .moderate, value: cv, threshold: baseline.cadenceCvPct.mean + 1.5 * baseline.cadenceCvPct.standardDeviation, basis: .personalBaseline))
            }
        }

        return RiskScoreResult(score: score, level: level(for: score), flags: flags)
    }

    private static func shouldUseLiveGaitForFallRisk(_ feature: FeatureWindow, baseline: BaselineSnapshot) -> Bool {
        let walking = feature.activityClass == .walking || feature.activityClass == .stairsUp || feature.activityClass == .stairsDown
        let enoughSteps = (feature.gait.stepCount ?? 0) >= 12
        let enoughBaseline = baseline.strideTimeCvPct.count >= 20 && baseline.cadenceCvPct.count >= 20
        return walking && enoughSteps && enoughBaseline
    }

    static func level(for score: Int) -> RiskLevel {
        if score >= 70 { return .high }
        if score >= 40 { return .moderate }
        return .low
    }
}
