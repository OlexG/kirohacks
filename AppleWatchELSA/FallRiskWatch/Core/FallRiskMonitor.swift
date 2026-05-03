import Combine
import CoreLocation
import CoreMotion
import Foundation
import HealthKit
import WatchKit

struct ProfileImportLinks {
    var importURL: URL
    var qrImageURL: URL
}

final class FallRiskMonitor: NSObject, ObservableObject {
    @Published var profile: ProfileSnapshot
    @Published var isAuthorized = false
    @Published var isMonitoring = false
    @Published var latestHealthSnapshot: HealthKitSnapshot?
    @Published var latestFeatureWindow: FeatureWindow?
    @Published var latestRiskScore = 0
    @Published var latestRiskLevel: RiskLevel = .low
    @Published var isInstabilityDetected = false
    @Published var recentEvents: [InstabilityEvent] = []
    @Published var postStatus: NetworkPostStatus = .idle
    @Published var statusText = "Ready"

    private let profileStore = ProfileStore()
    private let baselineStore = BaselineStore()
    private let health = HealthKitService()
    private let network = NetworkClient()
    private let locationManager = CLLocationManager()
    private let motionManager = CMMotionManager()
    private let pedometer = CMPedometer()
    private let altimeter = CMAltimeter()
    private let motionQueue = OperationQueue()
    private let motionLock = NSLock()

    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    private var timer: Timer?
    private var sessionId: String?
    private var sessionStart: Date?
    private var windowStart: Date?
    private var sequence = 0
    private var highRiskSeconds = 0.0
    private var sessionStepStart = 0
    private var sessionDistanceStart: Double?
    private var motionSamples: [MotionSample] = []
    private var pedometerWindowStart = PedometerSnapshot()
    private var pedometerLatest = PedometerSnapshot()
    private var altitudeWindowStart = AltitudeSnapshot()
    private var altitudeLatest = AltitudeSnapshot()
    private var heartRateWindow = HeartRateSnapshot()
    private var sessionCadenceValues: [Double] = []
    private var eventDates: [Date] = []
    private var latestLocationSnapshot: GeoLocationSnapshot?

    override init() {
        profile = profileStore.profile
        super.init()
        motionQueue.name = "fallrisk.motion"
        motionQueue.maxConcurrentOperationCount = 1
        configureLocationManager()
    }

    func requestPermissions(selection: HealthPermissionSelection = .all) {
        Task {
            do {
                try await health.requestAuthorization(selection)
                requestLocationAuthorizationIfNeeded()
                await MainActor.run {
                    isAuthorized = true
                    statusText = "HealthKit authorized"
                }
                await sendHealthSnapshot()
            } catch {
                await MainActor.run {
                    isAuthorized = false
                    statusText = "Permission error: \(error.localizedDescription)"
                }
            }
        }
    }

    func saveProfile(_ next: ProfileSnapshot) {
        profile = next
        profileStore.profile = next
        Task {
            await post(messageType: .profileSnapshot, sessionId: nil, payload: next)
        }
    }

    func profileImportLinks(for profile: ProfileSnapshot) -> ProfileImportLinks? {
        let envelope = Envelope(
            messageType: .profileSnapshot,
            participantId: profileStore.participantId,
            deviceId: deviceId,
            sessionId: nil,
            generatedAt: PayloadClock.string(),
            sequence: 0,
            source: PayloadSource(
                app: .watch,
                watchModel: "Apple Watch Series 9",
                watchOS: WKInterfaceDevice.current().systemVersion,
                iOS: nil,
                iphoneCarriedAtWaistRequired: true
            ),
            location: nil,
            payload: profile
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(envelope) else { return nil }
        let payload = data.base64URLEncodedString()

        var importComponents = URLComponents(url: EndpointConfig.profileImportURL, resolvingAgainstBaseURL: false)
        importComponents?.queryItems = [URLQueryItem(name: "payload", value: payload)]

        var qrComponents = URLComponents(url: EndpointConfig.profileQRCodeURL, resolvingAgainstBaseURL: false)
        qrComponents?.queryItems = [URLQueryItem(name: "payload", value: payload)]

        guard let importURL = importComponents?.url, let qrImageURL = qrComponents?.url else { return nil }
        return ProfileImportLinks(importURL: importURL, qrImageURL: qrImageURL)
    }

    func sendHealthSnapshot() async {
        let snapshot = await health.snapshot(lookbackHours: 24, baseline: baselineStore.snapshot)
        baselineStore.update(with: snapshot)
        await MainActor.run {
            latestHealthSnapshot = snapshot
        }
        await post(messageType: .healthKitSnapshot, sessionId: sessionId, payload: snapshot)
    }

    func startMonitoring() {
        guard !isMonitoring else { return }
        Task {
            do {
                try await health.requestAuthorization()
                let start = Date()
                let ids = UUID().uuidString
                let (session, builder) = try health.makeWorkoutSession()
                session.delegate = self
                builder.delegate = self
                workoutSession = session
                workoutBuilder = builder
                sessionId = ids
                sessionStart = start
                windowStart = start
                highRiskSeconds = 0
                sessionStepStart = 0
                sessionDistanceStart = nil
                pedometerWindowStart = PedometerSnapshot()
                pedometerLatest = PedometerSnapshot()
                altitudeWindowStart = AltitudeSnapshot()
                altitudeLatest = AltitudeSnapshot()
                heartRateWindow = HeartRateSnapshot()
                sessionCadenceValues = []
                eventDates = []
                session.startActivity(with: start)
                try await builder.beginCollection(at: start)
                await MainActor.run {
                    isAuthorized = true
                    isMonitoring = true
                    latestFeatureWindow = nil
                    latestRiskScore = 0
                    latestRiskLevel = .low
                    isInstabilityDetected = false
                    recentEvents = []
                    statusText = "Monitoring"
                }
                startMotionCollection(start: start)
                startPedometer(start: start)
                startAltimeter()
                startLocationUpdates()
                startWindowTimer()
                await sendHealthSnapshot()
            } catch {
                await MainActor.run {
                    statusText = "Start failed: \(error.localizedDescription)"
                }
            }
        }
    }

    func stopMonitoring() {
        guard isMonitoring else { return }
        timer?.invalidate()
        timer = nil
        motionManager.stopDeviceMotionUpdates()
        pedometer.stopUpdates()
        altimeter.stopRelativeAltitudeUpdates()
        locationManager.stopUpdatingLocation()
        workoutSession?.end()
        workoutBuilder?.endCollection(withEnd: Date()) { [weak self] _, _ in
            self?.workoutBuilder?.finishWorkout { _, _ in }
        }
        Task {
            await MainActor.run {
                self.collectAndSendWindow()
            }
            await sendHealthSnapshot()
            await sendSessionSummary()
            await MainActor.run {
                isMonitoring = false
                statusText = "Stopped"
            }
            sessionId = nil
        }
    }

    func sendManualSOS() {
        let now = Date()
        let event = InstabilityEvent(
            eventId: UUID().uuidString,
            detectedAt: PayloadClock.string(now),
            eventType: .manualSOS,
            severity: .high,
            triggerWindowStart: PayloadClock.string(now),
            triggerWindowEnd: PayloadClock.string(now),
            evidence: .init(accelPeakG: nil, gyroPeakRadS: nil, jerkPeakGPerS: nil, cadenceBreak: false, recoverySteps: nil, activityClass: "manual"),
            userFeedback: .unanswered
        )
        recentEvents.insert(event, at: 0)
        eventDates.append(now)
        isInstabilityDetected = true
        WKInterfaceDevice.current().play(.notification)
        Task {
            await post(messageType: .instabilityEvent, sessionId: sessionId, payload: event)
        }
    }

    private func startMotionCollection(start: Date) {
        motionSamples.removeAll()
        guard motionManager.isDeviceMotionAvailable else {
            DispatchQueue.main.async {
                self.statusText = "Device motion unavailable"
            }
            return
        }
        motionManager.deviceMotionUpdateInterval = 1.0 / FeatureExtractor.sampleRateHz
        motionManager.startDeviceMotionUpdates(to: motionQueue) { [weak self] motion, _ in
            guard let self, let motion else { return }
            let sample = MotionSample(
                date: Date(),
                timestamp: motion.timestamp,
                userAcceleration: SIMD3(motion.userAcceleration.x, motion.userAcceleration.y, motion.userAcceleration.z),
                gravity: SIMD3(motion.gravity.x, motion.gravity.y, motion.gravity.z),
                rotationRate: SIMD3(motion.rotationRate.x, motion.rotationRate.y, motion.rotationRate.z),
                attitude: SIMD3(motion.attitude.roll, motion.attitude.pitch, motion.attitude.yaw)
            )
            self.motionLock.lock()
            self.motionSamples.append(sample)
            self.motionLock.unlock()
        }
    }

    private func startPedometer(start: Date) {
        guard CMPedometer.isStepCountingAvailable() else { return }
        pedometerWindowStart = PedometerSnapshot()
        pedometerLatest = PedometerSnapshot()
        pedometer.startUpdates(from: start) { [weak self] data, _ in
            guard let self, let data else { return }
            let snapshot = PedometerSnapshot(
                steps: data.numberOfSteps.intValue,
                distanceM: data.distance?.doubleValue,
                floorsAscended: data.floorsAscended?.intValue,
                floorsDescended: data.floorsDescended?.intValue,
                cadenceSpm: nil
            )
            DispatchQueue.main.async {
                if self.sessionStepStart == 0 {
                    self.sessionStepStart = snapshot.steps
                    self.sessionDistanceStart = snapshot.distanceM
                }
                self.pedometerLatest = snapshot
            }
        }
    }

    private func startAltimeter() {
        guard CMAltimeter.isRelativeAltitudeAvailable() else { return }
        altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, _ in
            guard let self, let data else { return }
            self.altitudeLatest = AltitudeSnapshot(relativeAltitudeM: data.relativeAltitude.doubleValue)
        }
    }

    private func startWindowTimer() {
        DispatchQueue.main.async {
            self.timer?.invalidate()
            let timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
                self?.collectAndSendWindow()
            }
            timer.tolerance = 0.3
            self.timer = timer
        }
    }

    private func collectAndSendWindow() {
        guard let sessionId, let start = windowStart else { return }
        let end = Date()
        let samples = drainMotionSamples()
        let input = FeatureInput(
            sessionId: sessionId,
            windowStart: start,
            windowEnd: end,
            samples: samples,
            pedometerStart: pedometerWindowStart,
            pedometerEnd: pedometerLatest,
            altitudeStart: altitudeWindowStart,
            altitudeEnd: altitudeLatest,
            heartRate: heartRateWindow,
            baseline: baselineStore.snapshot,
            profile: profile,
            health: latestHealthSnapshot,
            previousInstabilityWithin60s: hasInstability(within: 60),
            automaticEventCooldownActive: hasInstability(within: 5),
            instabilityEventsLast10Min: instabilityEventsLast10Minutes
        )
        heartRateWindow = HeartRateSnapshot()
        pedometerWindowStart = pedometerLatest
        altitudeWindowStart = altitudeLatest
        windowStart = end

        let feature = FeatureExtractor.makeFeatureWindow(input)
        let instability = RiskScorer.instabilityScore(
            feature: feature,
            previousInstabilityWithin60s: hasInstability(within: 60),
            suppressEvents: hasInstability(within: 12)
        )
        if let cadence = feature.gait.cadenceSpm {
            sessionCadenceValues.append(cadence)
        }
        if feature.scores.ruleRiskLevel == .high {
            highRiskSeconds += end.timeIntervalSince(start)
        }
        latestFeatureWindow = feature
        latestRiskScore = feature.scores.ruleRiskScore100
        latestRiskLevel = feature.scores.ruleRiskLevel
        baselineStore.update(with: feature)

        Task {
            await post(messageType: .featureWindow, sessionId: sessionId, payload: feature)
            if let eventType = instability.eventType, let severity = instability.severity {
                let event = FeatureExtractor.makeInstabilityEvent(from: feature, eventType: eventType, severity: severity)
                await MainActor.run {
                    self.recentEvents.insert(event, at: 0)
                    self.recentEvents = Array(self.recentEvents.prefix(8))
                    self.eventDates.append(Date())
                    self.eventDates = self.eventDates.filter { Date().timeIntervalSince($0) <= 600 }
                    self.isInstabilityDetected = true
                    WKInterfaceDevice.current().play(.notification)
                }
                await post(messageType: .instabilityEvent, sessionId: sessionId, payload: event)
            }
        }
    }

    private func drainMotionSamples() -> [MotionSample] {
        motionLock.lock()
        let drained = motionSamples
        motionSamples.removeAll()
        motionLock.unlock()
        return drained
    }

    private func sendSessionSummary() async {
        guard let sessionStart else { return }
        let end = Date()
        let totalSteps = max(0, pedometerLatest.steps - sessionStepStart)
        let distance = zip(sessionDistanceStart, pedometerLatest.distanceM).map { max(0, $0.1 - $0.0) }
        let risk = RiskScorer.score(
            profile: profile,
            health: latestHealthSnapshot,
            feature: latestFeatureWindow,
            baseline: baselineStore.snapshot,
            instabilityEventsLast10Min: instabilityEventsLast10Minutes
        )
        let summary = SessionSummary(
            sessionStart: PayloadClock.string(sessionStart),
            sessionEnd: PayloadClock.string(end),
            durationSec: Int(end.timeIntervalSince(sessionStart)),
            totalSteps: totalSteps,
            distanceM: distance,
            instabilityEventCount: recentEvents.count,
            highRiskMinutes: Int(highRiskSeconds / 60),
            avgCadenceSpm: sessionCadenceValues.isEmpty ? nil : sessionCadenceValues.reduce(0, +) / Double(sessionCadenceValues.count),
            avgWalkingSpeedMps: latestHealthSnapshot?.mobility.walkingSpeedMps,
            finalRuleRiskScore100: risk.score,
            finalRuleRiskLevel: risk.level,
            riskFlags: risk.flags
        )
        await post(messageType: .sessionSummary, sessionId: sessionId, payload: summary)
    }

    private var instabilityEventsLast10Minutes: Int {
        eventDates.filter { Date().timeIntervalSince($0) <= 600 }.count
    }

    private func hasInstability(within seconds: TimeInterval) -> Bool {
        eventDates.contains { Date().timeIntervalSince($0) <= seconds }
    }

    private func post<Payload: Encodable>(messageType: MessageType, sessionId: String?, payload: Payload) async {
        await MainActor.run { postStatus = .sending }
        let envelope = Envelope(
            messageType: messageType,
            participantId: profileStore.participantId,
            deviceId: deviceId,
            sessionId: sessionId,
            generatedAt: PayloadClock.string(),
            sequence: nextSequence(),
            source: PayloadSource(
                app: .watch,
                watchModel: "Apple Watch Series 9",
                watchOS: WKInterfaceDevice.current().systemVersion,
                iOS: nil,
                iphoneCarriedAtWaistRequired: true
            ),
            location: latestLocationSnapshot,
            payload: payload
        )
        do {
            _ = try await network.post(envelope)
            await MainActor.run {
                postStatus = .sent
            }
        } catch {
            await MainActor.run {
                postStatus = .failed(error.localizedDescription)
            }
        }
    }

    private func nextSequence() -> Int {
        sequence += 1
        return sequence
    }

    private var deviceId: String {
        WKInterfaceDevice.current().identifierForVendor?.uuidString ?? "unknown-watch"
    }

    private func configureLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 5
        locationManager.activityType = .fitness
    }

    private func requestLocationAuthorizationIfNeeded() {
        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            break
        case .denied, .restricted:
            break
        @unknown default:
            break
        }
    }

    private func startLocationUpdates() {
        requestLocationAuthorizationIfNeeded()
        switch locationManager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            locationManager.startUpdatingLocation()
        default:
            break
        }
    }
}

extension FallRiskMonitor: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if isMonitoring {
            startLocationUpdates()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        latestLocationSnapshot = GeoLocationSnapshot(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            horizontalAccuracyM: location.horizontalAccuracy >= 0 ? location.horizontalAccuracy : nil,
            altitudeM: location.verticalAccuracy >= 0 ? location.altitude : nil,
            verticalAccuracyM: location.verticalAccuracy >= 0 ? location.verticalAccuracy : nil,
            speedMps: location.speed >= 0 ? location.speed : nil,
            courseDeg: location.course >= 0 ? location.course : nil,
            timestamp: PayloadClock.string(location.timestamp),
            source: "watch_gps"
        )
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.statusText = "Location error: \(error.localizedDescription)"
        }
    }
}

extension FallRiskMonitor: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        DispatchQueue.main.async {
            self.statusText = "Workout \(Self.label(for: toState))"
        }
    }

    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        DispatchQueue.main.async {
            self.statusText = "Workout error: \(error.localizedDescription)"
        }
    }

    private static func label(for state: HKWorkoutSessionState) -> String {
        switch state {
        case .notStarted: return "not started"
        case .prepared: return "prepared"
        case .running: return "running"
        case .paused: return "paused"
        case .stopped: return "stopped"
        case .ended: return "ended"
        @unknown default: return "unknown"
        }
    }
}

extension FallRiskMonitor: HKLiveWorkoutBuilderDelegate {
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate),
              collectedTypes.contains(heartRateType),
              let statistics = workoutBuilder.statistics(for: heartRateType),
              let quantity = statistics.mostRecentQuantity() else {
            return
        }
        let bpm = quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        DispatchQueue.main.async {
            self.heartRateWindow.samples.append(bpm)
            self.heartRateWindow.confidence = .medium
        }
    }
}
