import Foundation
import HealthKit

struct HealthPermissionSelection {
    var mobility = true
    var activity = true
    var cardio = true
    var workouts = true

    static let all = HealthPermissionSelection()

    var hasAnySelection: Bool {
        mobility || activity || cardio || workouts
    }
}

final class HealthKitService {
    let store = HKHealthStore()

    var readTypes: Set<HKObjectType> {
        readTypes(for: .all)
    }

    func readTypes(for selection: HealthPermissionSelection) -> Set<HKObjectType> {
        var types = Set<HKObjectType>()

        if selection.mobility {
            [
                HKQuantityTypeIdentifier.appleWalkingSteadiness,
                HKQuantityTypeIdentifier.walkingSpeed,
                HKQuantityTypeIdentifier.walkingStepLength,
                HKQuantityTypeIdentifier.walkingAsymmetryPercentage,
                HKQuantityTypeIdentifier.walkingDoubleSupportPercentage,
                HKQuantityTypeIdentifier.sixMinuteWalkTestDistance,
                HKQuantityTypeIdentifier.stairAscentSpeed,
                HKQuantityTypeIdentifier.stairDescentSpeed
            ].forEach { identifier in
                if let type = HKObjectType.quantityType(forIdentifier: identifier) {
                    types.insert(type)
                }
            }
            if let type = HKObjectType.categoryType(forIdentifier: .appleWalkingSteadinessEvent) {
                types.insert(type)
            }
        }

        if selection.activity {
            [
                HKQuantityTypeIdentifier.stepCount,
                HKQuantityTypeIdentifier.distanceWalkingRunning,
                HKQuantityTypeIdentifier.flightsClimbed
            ].forEach { identifier in
                if let type = HKObjectType.quantityType(forIdentifier: identifier) {
                    types.insert(type)
                }
            }
        }

        if selection.cardio {
            [
                HKQuantityTypeIdentifier.restingHeartRate,
                HKQuantityTypeIdentifier.walkingHeartRateAverage,
                HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
                HKQuantityTypeIdentifier.heartRate
            ].forEach { identifier in
                if let type = HKObjectType.quantityType(forIdentifier: identifier) {
                    types.insert(type)
                }
            }
        }

        if selection.workouts {
            let type = HKObjectType.workoutType()
            types.insert(type)
        }

        return types
    }

    var shareTypes: Set<HKSampleType> {
        shareTypes(for: .all)
    }

    func shareTypes(for selection: HealthPermissionSelection) -> Set<HKSampleType> {
        selection.workouts ? [HKObjectType.workoutType()] : []
    }

    func requestAuthorization(_ selection: HealthPermissionSelection = .all) async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            store.requestAuthorization(toShare: shareTypes(for: selection), read: readTypes(for: selection)) { success, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if success {
                    continuation.resume()
                } else {
                    continuation.resume(throwing: NSError(domain: "FallRiskHealthKit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Health authorization was not granted."]))
                }
            }
        }
    }

    func snapshot(lookbackHours: Int = 24, baseline: BaselineSnapshot) async -> HealthKitSnapshot {
        let start = Date().addingTimeInterval(-Double(lookbackHours) * 3600)
        async let steadiness = latestQuantity(.appleWalkingSteadiness, unit: .percent(), start: start)
        async let steadinessEvent = latestWalkingSteadinessEvent(start: start)
        async let walkingSpeed = latestQuantity(.walkingSpeed, unit: .meter().unitDivided(by: .second()), start: start)
        async let stepLength = latestQuantity(.walkingStepLength, unit: .meter(), start: start)
        async let asymmetry = latestQuantity(.walkingAsymmetryPercentage, unit: .percent(), start: start)
        async let doubleSupport = latestQuantity(.walkingDoubleSupportPercentage, unit: .percent(), start: start)
        async let sixMinute = latestQuantity(.sixMinuteWalkTestDistance, unit: .meter(), start: start)
        async let stairUp = latestQuantity(.stairAscentSpeed, unit: .meter().unitDivided(by: .second()), start: start)
        async let stairDown = latestQuantity(.stairDescentSpeed, unit: .meter().unitDivided(by: .second()), start: start)
        async let stepCount = cumulativeQuantity(.stepCount, unit: .count(), start: start)
        async let distance = cumulativeQuantity(.distanceWalkingRunning, unit: .meter(), start: start)
        async let flights = cumulativeQuantity(.flightsClimbed, unit: .count(), start: start)
        async let restingHR = latestQuantity(.restingHeartRate, unit: heartRateUnit, start: start)
        async let walkingHR = latestQuantity(.walkingHeartRateAverage, unit: heartRateUnit, start: start)
        async let hrv = latestQuantity(.heartRateVariabilitySDNN, unit: .secondUnit(with: .milli), start: start)

        let steadinessValue = await steadiness
        let mobility = HealthKitSnapshot.Mobility(
            walkingSteadinessScore01: steadinessValue.map(score01),
            walkingSteadinessClass: walkingSteadinessClass(steadinessValue),
            walkingSteadinessEvent: await steadinessEvent,
            walkingSpeedMps: await walkingSpeed,
            walkingStepLengthM: await stepLength,
            walkingAsymmetryPct: await asymmetry.map(normalizePercent),
            walkingDoubleSupportPct: await doubleSupport.map(normalizePercent),
            sixMinuteWalkDistanceM: await sixMinute,
            stairAscentSpeedMps: await stairUp,
            stairDescentSpeedMps: await stairDown
        )

        let activity = HealthKitSnapshot.Activity(
            stepCount: await stepCount,
            distanceWalkingRunningM: await distance,
            flightsAscended: await flights,
            flightsDescended: nil
        )

        let cardio = HealthKitSnapshot.Cardio(
            restingHrBpm: await restingHR,
            walkingHrAvgBpm: await walkingHR,
            hrvSdnnMs: await hrv
        )

        var snapshot = HealthKitSnapshot(lookbackHours: lookbackHours, mobility: mobility, activity: activity, cardio: cardio, riskFlags: [])
        snapshot.riskFlags = snapshotFlags(snapshot, baseline: baseline)
        return snapshot
    }

    func makeWorkoutSession() throws -> (HKWorkoutSession, HKLiveWorkoutBuilder) {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .walking
        configuration.locationType = .unknown
        let session = try HKWorkoutSession(healthStore: store, configuration: configuration)
        let builder = session.associatedWorkoutBuilder()
        builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: configuration)
        return (session, builder)
    }

    private var heartRateUnit: HKUnit {
        HKUnit.count().unitDivided(by: .minute())
    }

    private func latestQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, start: Date) async -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        return await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                let value = (samples?.first as? HKQuantitySample)?.quantity.doubleValue(for: unit)
                continuation.resume(returning: value)
            }
            store.execute(query)
        }
    }

    private func cumulativeQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit, start: Date) async -> Double? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        return await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, statistics, _ in
                continuation.resume(returning: statistics?.sumQuantity()?.doubleValue(for: unit))
            }
            store.execute(query)
        }
    }

    private func latestWalkingSteadinessEvent(start: Date) async -> WalkingSteadinessEvent? {
        guard let type = HKObjectType.categoryType(forIdentifier: .appleWalkingSteadinessEvent) else { return nil }
        return await withCheckedContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: start, end: Date(), options: .strictStartDate)
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                guard let value = (samples?.first as? HKCategorySample)?.value else {
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: Self.mapWalkingSteadinessEvent(value))
            }
            store.execute(query)
        }
    }

    private func walkingSteadinessClass(_ rawPercent: Double?) -> WalkingSteadinessClass {
        guard let rawPercent else { return .unknown }
        let quantity = HKQuantity(unit: .percent(), doubleValue: rawPercent)
        if let classification = try? HKAppleWalkingSteadinessClassification(for: quantity) {
            switch classification {
            case .ok: return .ok
            case .low: return .low
            case .veryLow: return .veryLow
            @unknown default: return .unknown
            }
        }
        return .unknown
    }

    private func normalizePercent(_ value: Double) -> Double {
        value <= 1 ? value * 100 : value
    }

    private func score01(_ value: Double) -> Double {
        let normalized = value > 1 ? value / 100 : value
        return min(1, max(0, normalized))
    }

    private func snapshotFlags(_ snapshot: HealthKitSnapshot, baseline: BaselineSnapshot) -> [RiskFlag] {
        var flags: [RiskFlag] = []
        if snapshot.mobility.walkingSteadinessClass == .unknown {
            flags.append(.text("walking_steadiness_unavailable", severity: .info, value: "unknown", threshold: "available", basis: .appleClassification))
        }
        if let hrDelta = snapshot.cardio.walkingHrAvgBpm.map({ value -> Double? in
            guard baseline.walkingHeartRateBpm.count >= 5 else { return nil }
            return value - baseline.walkingHeartRateBpm.mean
        }) ?? nil, hrDelta > 25 {
            flags.append(.number("walking_hr_baseline_delta_gt_25bpm", severity: .moderate, value: hrDelta, threshold: 25, basis: .personalBaseline))
        }
        return flags
    }

    private static func mapWalkingSteadinessEvent(_ value: Int) -> WalkingSteadinessEvent? {
        switch value {
        case HKCategoryValueAppleWalkingSteadinessEvent.initialLow.rawValue:
            return .initialLow
        case HKCategoryValueAppleWalkingSteadinessEvent.initialVeryLow.rawValue:
            return .initialVeryLow
        case HKCategoryValueAppleWalkingSteadinessEvent.repeatLow.rawValue:
            return .repeatLow
        case HKCategoryValueAppleWalkingSteadinessEvent.repeatVeryLow.rawValue:
            return .repeatVeryLow
        default:
            return nil
        }
    }
}
