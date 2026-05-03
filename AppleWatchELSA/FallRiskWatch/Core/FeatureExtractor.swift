import CoreMotion
import Foundation

struct MotionSample {
    var date: Date
    var timestamp: TimeInterval
    var userAcceleration: SIMD3<Double>
    var gravity: SIMD3<Double>
    var rotationRate: SIMD3<Double>
    var attitude: SIMD3<Double>
}

struct PedometerSnapshot {
    var steps: Int = 0
    var distanceM: Double?
    var floorsAscended: Int?
    var floorsDescended: Int?
    var cadenceSpm: Double?
}

struct AltitudeSnapshot {
    var relativeAltitudeM: Double?
}

struct HeartRateSnapshot {
    var samples: [Double] = []
    var confidence: HeartRateConfidence = .unknown
}

struct FeatureInput {
    var sessionId: String
    var windowStart: Date
    var windowEnd: Date
    var samples: [MotionSample]
    var pedometerStart: PedometerSnapshot
    var pedometerEnd: PedometerSnapshot
    var altitudeStart: AltitudeSnapshot
    var altitudeEnd: AltitudeSnapshot
    var heartRate: HeartRateSnapshot
    var baseline: BaselineSnapshot
    var profile: ProfileSnapshot
    var health: HealthKitSnapshot?
    var previousInstabilityWithin60s: Bool
    var automaticEventCooldownActive: Bool
    var instabilityEventsLast10Min: Int
}

enum FeatureExtractor {
    static let sampleRateHz = 50.0

    static func makeFeatureWindow(_ input: FeatureInput) -> FeatureWindow {
        let motion = motionFeatures(samples: input.samples)
        let gait = gaitFeatures(samples: input.samples, pedometerStart: input.pedometerStart, pedometerEnd: input.pedometerEnd, duration: input.windowEnd.timeIntervalSince(input.windowStart))
        let elevation = elevationFeatures(pedometerStart: input.pedometerStart, pedometerEnd: input.pedometerEnd, altitudeStart: input.altitudeStart, altitudeEnd: input.altitudeEnd)
        let activity = activityClass(gait: gait, elevation: elevation, motion: motion)
        let cardio = cardioFeatures(input.heartRate, baseline: input.baseline)

        var window = FeatureWindow(
            windowStart: PayloadClock.string(input.windowStart),
            windowEnd: PayloadClock.string(input.windowEnd),
            collectionMode: .safetySession,
            sampleRateHz: sampleRateHz,
            sampleCount: input.samples.count,
            activityClass: activity,
            motion: motion,
            gait: gait,
            elevation: elevation,
            cardio: cardio,
            scores: .init(ruleRiskScore100: 0, ruleInstabilityScore100: 0, ruleRiskLevel: .low),
            riskFlags: []
        )

        let instability = RiskScorer.instabilityScore(
            feature: window,
            previousInstabilityWithin60s: input.previousInstabilityWithin60s,
            suppressEvents: input.automaticEventCooldownActive
        )
        let risk = RiskScorer.score(
            profile: input.profile,
            health: input.health,
            feature: window,
            baseline: input.baseline,
            instabilityEventsLast10Min: input.instabilityEventsLast10Min + (instability.eventType == nil ? 0 : 1)
        )
        window.scores = .init(
            ruleRiskScore100: risk.score,
            ruleInstabilityScore100: instability.score,
            ruleRiskLevel: risk.level
        )
        window.riskFlags = risk.flags + instability.flags
        return window
    }

    static func makeInstabilityEvent(from feature: FeatureWindow, eventType: InstabilityEventType, severity: Severity) -> InstabilityEvent {
        InstabilityEvent(
            eventId: UUID().uuidString,
            detectedAt: PayloadClock.string(),
            eventType: eventType,
            severity: severity,
            triggerWindowStart: feature.windowStart,
            triggerWindowEnd: feature.windowEnd,
            evidence: .init(
                accelPeakG: feature.motion.accelMagnitudePeakG,
                gyroPeakRadS: feature.motion.gyroMagnitudePeakRadS,
                jerkPeakGPerS: feature.motion.jerkPeakGPerS,
                cadenceBreak: RiskScorer.cadenceBreakDetected(feature),
                recoverySteps: feature.motion.turnRecoverySteps,
                activityClass: feature.activityClass.rawValue
            ),
            userFeedback: .unanswered
        )
    }

    private static func motionFeatures(samples: [MotionSample]) -> FeatureWindow.Motion {
        guard !samples.isEmpty else {
            return .init(
                accelMagnitudeMeanG: nil,
                accelMagnitudeRmsG: nil,
                accelMagnitudePeakG: nil,
                userAccelRmsG: nil,
                jerkRmsGPerS: nil,
                jerkPeakGPerS: nil,
                gyroMagnitudeMeanRadS: nil,
                gyroMagnitudePeakRadS: nil,
                attitudeChangeDeg: nil,
                swayRmsDeg: nil,
                turnCount: nil,
                maxTurnRateDegS: nil,
                turnRecoverySteps: nil
            )
        }

        let accelMagnitudes = samples.map { vectorLength($0.userAcceleration + $0.gravity) }
        let userAccelMagnitudes = samples.map { vectorLength($0.userAcceleration) }
        let gyroMagnitudes = samples.map { vectorLength($0.rotationRate) }
        let jerk = jerkSeries(samples)
        let attitudes = samples.map(\.attitude)
        let rollPitch = attitudes.map { SIMD2<Double>($0.x, $0.y) }

        let turnGroups = grouped(samples.map { abs($0.rotationRate.z) > 0.7 })
        let maxTurnRateDegS = samples.map { abs($0.rotationRate.z) * 180 / .pi }.max()
        let first = attitudes.first ?? .zero
        let last = attitudes.last ?? .zero
        let attitudeChange = vectorLength(last - first) * 180 / .pi

        return .init(
            accelMagnitudeMeanG: mean(accelMagnitudes),
            accelMagnitudeRmsG: rms(accelMagnitudes),
            accelMagnitudePeakG: accelMagnitudes.max(),
            userAccelRmsG: rms(userAccelMagnitudes),
            jerkRmsGPerS: rms(jerk),
            jerkPeakGPerS: jerk.max(),
            gyroMagnitudeMeanRadS: mean(gyroMagnitudes),
            gyroMagnitudePeakRadS: gyroMagnitudes.max(),
            attitudeChangeDeg: attitudeChange,
            swayRmsDeg: swayRmsDeg(rollPitch),
            turnCount: turnGroups,
            maxTurnRateDegS: maxTurnRateDegS,
            turnRecoverySteps: nil
        )
    }

    private static func gaitFeatures(samples: [MotionSample], pedometerStart: PedometerSnapshot, pedometerEnd: PedometerSnapshot, duration: TimeInterval) -> FeatureWindow.Gait {
        let stepDelta = max(0, pedometerEnd.steps - pedometerStart.steps)
        let peaks = detectStepPeaks(samples)
        let intervals = zip(peaks.dropFirst(), peaks).map { $0.0.timeIntervalSince($0.1) }.filter { $0 > 0.25 && $0 < 2.5 }
        let intervalMean = mean(intervals)
        let intervalCv = coefficientOfVariationPercent(intervals)
        let cadenceFromPeaks = intervalMean.map { 60 / $0 }
        let cadence = pedometerEnd.cadenceSpm ?? cadenceFromPeaks ?? (duration > 0 ? Double(stepDelta) / duration * 60 : nil)
        let cadenceCv = intervalCv
        let regularity = intervalCv.map { max(0, min(1, 1 - $0 / 20)) }

        return .init(
            stepCount: stepDelta,
            cadenceSpm: cadence,
            cadenceCvPct: cadenceCv,
            strideTimeMeanMs: intervalMean.map { $0 * 1000 },
            strideTimeCvPct: intervalCv,
            gaitRegularity01: regularity
        )
    }

    private static func elevationFeatures(pedometerStart: PedometerSnapshot, pedometerEnd: PedometerSnapshot, altitudeStart: AltitudeSnapshot, altitudeEnd: AltitudeSnapshot) -> FeatureWindow.Elevation {
        let altitudeDelta = zip(altitudeStart.relativeAltitudeM, altitudeEnd.relativeAltitudeM).map { $0.1 - $0.0 }
        return .init(
            altitudeDeltaM: altitudeDelta,
            floorsAscended: zip(pedometerStart.floorsAscended, pedometerEnd.floorsAscended).map { max(0, $0.1 - $0.0) },
            floorsDescended: zip(pedometerStart.floorsDescended, pedometerEnd.floorsDescended).map { max(0, $0.1 - $0.0) }
        )
    }

    private static func cardioFeatures(_ snapshot: HeartRateSnapshot, baseline: BaselineSnapshot) -> FeatureWindow.Cardio {
        let meanHr = mean(snapshot.samples)
        let maxHr = snapshot.samples.max()
        let delta = meanHr.map { value -> Double? in
            guard baseline.walkingHeartRateBpm.count >= 5 else { return nil }
            return value - baseline.walkingHeartRateBpm.mean
        } ?? nil

        return .init(
            hrMeanBpm: meanHr,
            hrMaxBpm: maxHr,
            hrDeltaFromBaselineBpm: delta,
            hrConfidence: snapshot.confidence
        )
    }

    private static func activityClass(gait: FeatureWindow.Gait, elevation: FeatureWindow.Elevation, motion: FeatureWindow.Motion) -> ActivityClass {
        if (elevation.floorsDescended ?? 0) > 0 || (elevation.altitudeDeltaM ?? 0) < -0.7 {
            return .stairsDown
        }
        if (elevation.floorsAscended ?? 0) > 0 || (elevation.altitudeDeltaM ?? 0) > 0.7 {
            return .stairsUp
        }
        if (gait.stepCount ?? 0) >= 3 || (gait.cadenceSpm ?? 0) > 20 {
            return .walking
        }
        if (motion.userAccelRmsG ?? 0) < 0.04 {
            return .standing
        }
        return .unknown
    }

    private static func detectStepPeaks(_ samples: [MotionSample]) -> [Date] {
        guard samples.count >= 5 else { return [] }
        let magnitudes = samples.map { vectorLength($0.userAcceleration + $0.gravity) }
        let baseline = mean(magnitudes) ?? 1
        let threshold = baseline + 0.18
        var peaks: [Date] = []
        var lastPeak = Date.distantPast
        for index in 1..<(magnitudes.count - 1) {
            let isLocalPeak = magnitudes[index] > magnitudes[index - 1] && magnitudes[index] >= magnitudes[index + 1]
            guard isLocalPeak && magnitudes[index] > threshold else { continue }
            let date = samples[index].date
            if date.timeIntervalSince(lastPeak) > 0.28 {
                peaks.append(date)
                lastPeak = date
            }
        }
        return peaks
    }

    private static func jerkSeries(_ samples: [MotionSample]) -> [Double] {
        guard samples.count > 1 else { return [] }
        return zip(samples.dropFirst(), samples).compactMap { current, previous in
            let dt = current.timestamp - previous.timestamp
            guard dt > 0 else { return nil }
            return vectorLength(current.userAcceleration - previous.userAcceleration) / dt
        }
    }

    private static func vectorLength(_ value: SIMD3<Double>) -> Double {
        sqrt(value.x * value.x + value.y * value.y + value.z * value.z)
    }

    private static func swayRmsDeg(_ values: [SIMD2<Double>]) -> Double? {
        guard let rollMean = mean(values.map(\.x)), let pitchMean = mean(values.map(\.y)) else { return nil }
        let squared = values.map { pow($0.x - rollMean, 2) + pow($0.y - pitchMean, 2) }
        return rms(squared.map(sqrt)).map { $0 * 180 / .pi }
    }

    private static func grouped(_ values: [Bool]) -> Int {
        var count = 0
        var inGroup = false
        for value in values {
            if value && !inGroup {
                count += 1
                inGroup = true
            } else if !value {
                inGroup = false
            }
        }
        return count
    }

    private static func mean(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    private static func rms(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        return sqrt(values.map { $0 * $0 }.reduce(0, +) / Double(values.count))
    }

    private static func coefficientOfVariationPercent(_ values: [Double]) -> Double? {
        guard values.count > 1, let meanValue = mean(values), meanValue > 0 else { return nil }
        let variance = values.map { pow($0 - meanValue, 2) }.reduce(0, +) / Double(values.count - 1)
        return sqrt(variance) / meanValue * 100
    }
}

func zip<A, B>(_ a: A?, _ b: B?) -> (A, B)? {
    guard let a, let b else { return nil }
    return (a, b)
}
