import SwiftUI

enum ELSATheme {
    static let background = Color(red: 242 / 255, green: 218 / 255, blue: 164 / 255)
    static let panel = Color(red: 248 / 255, green: 238 / 255, blue: 208 / 255)
    static let divider = Color(red: 203 / 255, green: 201 / 255, blue: 196 / 255)
    static let accent = Color(red: 214 / 255, green: 200 / 255, blue: 178 / 255)
    static let sessionButton = Color(red: 139 / 255, green: 181 / 255, blue: 179 / 255)
    static let alertButton = Color(red: 230 / 255, green: 199 / 255, blue: 117 / 255)
    static let secondaryText = Color(red: 164 / 255, green: 162 / 255, blue: 154 / 255)
    static let primaryText = Color(red: 123 / 255, green: 120 / 255, blue: 111 / 255)
}

struct ContentView: View {
    @EnvironmentObject private var monitor: FallRiskMonitor
    @State private var showingSettings = false

    var body: some View {
        NavigationStack {
            ZStack {
                ELSATheme.background.ignoresSafeArea()
                Image("ELSAIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 190, height: 190)
                    .opacity(0.12)
                    .allowsHitTesting(false)
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        riskHeader
                        controls
                        telemetry
                        recentEvents
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 14)
                    .padding(.bottom, 18)
                    .foregroundStyle(ELSATheme.primaryText)
                }
            }
            .navigationTitle("")
            .toolbarBackground(ELSATheme.background, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.light, for: .navigationBar)
            .navigationDestination(isPresented: $showingSettings) {
                SettingsView()
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("ELSA Monitor")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(ELSATheme.primaryText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                        .allowsTightening(true)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("Settings")
                }
            }
        }
    }

    private var riskHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(monitor.latestRiskLevel.rawValue.uppercased())
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(levelColor)
                Spacer()
                Label("\(monitor.latestRiskScore)", systemImage: "gauge.with.dots.needle.67percent")
                    .font(.caption)
                    .foregroundStyle(ELSATheme.primaryText)
            }
            Image(systemName: "figure.fall")
                .font(.title3)
                .foregroundStyle(monitor.isInstabilityDetected ? .red : ELSATheme.secondaryText)
                .accessibilityLabel(monitor.isInstabilityDetected ? "Instability detected" : "No instability detected")
            Text(monitor.statusText)
                .font(.caption2)
                .foregroundStyle(ELSATheme.secondaryText)
        }
        .padding(10)
        .background(ELSATheme.background.opacity(0.28))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                monitor.isMonitoring ? monitor.stopMonitoring() : monitor.startMonitoring()
            } label: {
                Label(monitor.isMonitoring ? "Stop Session" : "Start Session", systemImage: monitor.isMonitoring ? "stop.fill" : "play.fill")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(.borderedProminent)
            .tint(monitor.isMonitoring ? .red : ELSATheme.sessionButton)

            Button {
                monitor.sendManualSOS()
            } label: {
                Label("Send Alert", systemImage: "exclamationmark.triangle.fill")
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .buttonStyle(.borderedProminent)
            .tint(ELSATheme.alertButton)
            .accessibilityLabel("Send Alert")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var telemetry: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(monitor.postStatus.label, systemImage: "paperplane")
                .lineLimit(2)
            if let feature = monitor.latestFeatureWindow {
                Text("Activity: \(feature.activityClass.rawValue)")
                Text("Cadence: \(format(feature.gait.cadenceSpm)) spm")
                Text("Peak accel: \(format(feature.motion.accelMagnitudePeakG)) g")
                Text("Peak gyro: \(format(feature.motion.gyroMagnitudePeakRadS)) rad/s")
            } else {
                Text("No feature window yet")
                    .foregroundStyle(ELSATheme.secondaryText)
            }
        }
        .font(.caption2)
        .foregroundStyle(ELSATheme.primaryText)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var recentEvents: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Recent Instability")
                .font(.caption.weight(.semibold))
                .foregroundStyle(ELSATheme.primaryText)
            if monitor.recentEvents.isEmpty {
                Text("None")
                    .font(.caption2)
                    .foregroundStyle(ELSATheme.secondaryText)
            } else {
                ForEach(monitor.recentEvents.prefix(3)) { event in
                    Text(readableEventName(event.eventType))
                        .font(.caption2)
                        .lineLimit(1)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .foregroundStyle(event.severity == .moderate ? .black : .white)
                        .background(severityColor(event.severity))
                        .clipShape(Capsule())
                }
            }
        }
    }

    private var levelColor: Color {
        switch monitor.latestRiskLevel {
        case .low: return .green
        case .moderate: return .orange
        case .high: return .red
        }
    }

    private func format(_ value: Double?) -> String {
        guard let value else { return "--" }
        return String(format: "%.2f", value)
    }

    private func readableEventName(_ eventType: InstabilityEventType) -> String {
        eventType.rawValue.replacingOccurrences(of: "_", with: " ")
    }

    private func severityColor(_ severity: Severity) -> Color {
        switch severity {
        case .info: return .blue
        case .moderate: return .yellow
        case .high: return .red
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var monitor: FallRiskMonitor

    var body: some View {
        Form {
            NavigationLink {
                ProfileView(
                    profile: monitor.profile,
                    importLinks: { monitor.profileImportLinks(for: $0) },
                    onSave: { monitor.saveProfile($0) }
                )
            } label: {
                Label("Profile", systemImage: "person.crop.circle")
            }

            NavigationLink {
                HealthPermissionsView()
            } label: {
                Label("Health Permissions", systemImage: "heart.text.square")
            }
        }
        .navigationTitle("Settings")
        .tint(ELSATheme.primaryText)
    }
}

struct HealthPermissionsView: View {
    @EnvironmentObject private var monitor: FallRiskMonitor
    @State private var selection = HealthPermissionSelection.all

    var body: some View {
        Form {
            Section("HealthKit") {
                Toggle(isOn: $selection.mobility) {
                    permissionLabel("Mobility", detail: "steadiness, speed, gait")
                }
                Toggle(isOn: $selection.activity) {
                    permissionLabel("Activity", detail: "steps, distance, flights")
                }
                Toggle(isOn: $selection.cardio) {
                    permissionLabel("Cardio", detail: "heart rate, HRV")
                }
                Toggle(isOn: $selection.workouts) {
                    permissionLabel("Workout", detail: "session write access")
                }
            }

            Section {
                Button {
                    monitor.requestPermissions(selection: selection)
                } label: {
                    Label("Request Access", systemImage: "checkmark.shield")
                }
                .disabled(!selection.hasAnySelection)

                Button {
                    Task { await monitor.sendHealthSnapshot() }
                } label: {
                    Label("Refresh Snapshot", systemImage: "arrow.clockwise")
                }
            }

            Section("Status") {
                Label(monitor.isAuthorized ? "Authorized" : "Not authorized", systemImage: monitor.isAuthorized ? "checkmark.circle" : "xmark.circle")
                Text(monitor.statusText)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Permissions")
        .tint(ELSATheme.primaryText)
    }

    private func permissionLabel(_ title: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
            Text(detail)
                .font(.system(size: 9))
                .foregroundStyle(ELSATheme.secondaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
    }
}

struct ProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showingQRCode = false
    @State private var ageYears: Int
    @State private var sex: Sex
    @State private var heightCm: Int
    @State private var assistiveDevice: AssistiveDevice
    @State private var priorFalls12mo: Int
    @State private var injuriousFall12mo: Bool
    @State private var unableToRiseAfterFall12mo: Bool
    @State private var mobilityImpairment: Bool
    @State private var neuroImpairment: Bool
    let importLinks: (ProfileSnapshot) -> ProfileImportLinks?
    let onSave: (ProfileSnapshot) -> Void

    init(profile: ProfileSnapshot, importLinks: @escaping (ProfileSnapshot) -> ProfileImportLinks?, onSave: @escaping (ProfileSnapshot) -> Void) {
        _ageYears = State(initialValue: profile.ageYears ?? 75)
        _sex = State(initialValue: profile.sex)
        _heightCm = State(initialValue: Int(profile.heightCm ?? 170))
        _assistiveDevice = State(initialValue: profile.assistiveDevice)
        _priorFalls12mo = State(initialValue: profile.priorFalls12mo ?? 0)
        _injuriousFall12mo = State(initialValue: profile.injuriousFall12mo ?? false)
        _unableToRiseAfterFall12mo = State(initialValue: profile.unableToRiseAfterFall12mo ?? false)
        _mobilityImpairment = State(initialValue: profile.impairmentTags.contains("mobility_impairment"))
        _neuroImpairment = State(initialValue: profile.impairmentTags.contains("neurological_impairment"))
        self.importLinks = importLinks
        self.onSave = onSave
    }

    var body: some View {
        Form {
            Stepper(value: $ageYears, in: 18...110) {
                profileFieldLabel("Age", value: "\(ageYears) years")
            }
            Stepper(value: $heightCm, in: 120...220) {
                profileFieldLabel("Height", value: "\(heightCm) cm")
            }
            Picker(selection: $sex) {
                ForEach(Sex.allCases) { Text($0.rawValue).tag($0) }
            } label: {
                profileFieldLabel("Sex", value: sex.rawValue)
            }
            Picker(selection: $assistiveDevice) {
                ForEach(AssistiveDevice.allCases) { Text($0.rawValue).tag($0) }
            } label: {
                profileFieldLabel("Aid", value: assistiveDevice.rawValue)
            }
            Stepper(value: $priorFalls12mo, in: 0...10) {
                profileFieldLabel("Falls", value: "\(priorFalls12mo)")
            }
            Toggle(isOn: $injuriousFall12mo) {
                profileFieldLabel("Injurious fall", value: injuriousFall12mo ? "yes" : "no")
            }
            Toggle(isOn: $unableToRiseAfterFall12mo) {
                profileFieldLabel("Unable to rise", value: unableToRiseAfterFall12mo ? "yes" : "no")
            }
            Toggle(isOn: $mobilityImpairment) {
                profileFieldLabel("Mobility impairment", value: mobilityImpairment ? "yes" : "no")
            }
            Toggle(isOn: $neuroImpairment) {
                profileFieldLabel("Neuro impairment", value: neuroImpairment ? "yes" : "no")
            }
            Button("Save Profile") {
                onSave(snapshot)
                dismiss()
            }
            Button {
                showingQRCode = true
            } label: {
                Label("Scan QR", systemImage: "qrcode")
            }
        }
        .navigationTitle("Profile")
        .tint(ELSATheme.primaryText)
        .fullScreenCover(isPresented: $showingQRCode) {
            ProfileQRCodeView(links: importLinks(snapshot))
        }
    }

    private func profileFieldLabel(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title)
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(ELSATheme.secondaryText)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(ELSATheme.primaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var snapshot: ProfileSnapshot {
        var tags: [String] = []
        if mobilityImpairment { tags.append("mobility_impairment") }
        if neuroImpairment { tags.append("neurological_impairment") }
        return ProfileSnapshot(
            ageYears: ageYears,
            sex: sex,
            heightCm: Double(heightCm),
            assistiveDevice: assistiveDevice,
            impairmentTags: tags,
            priorFalls12mo: priorFalls12mo,
            injuriousFall12mo: injuriousFall12mo,
            unableToRiseAfterFall12mo: unableToRiseAfterFall12mo
        )
    }
}

struct ProfileQRCodeView: View {
    @Environment(\.dismiss) private var dismiss
    let links: ProfileImportLinks?

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color(red: 252 / 255, green: 247 / 255, blue: 235 / 255)
                .ignoresSafeArea()

            VStack(spacing: 8) {
                Spacer(minLength: 18)
                if let qrImageURL = links?.qrImageURL {
                    AsyncImage(url: qrImageURL) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
                                .tint(ELSATheme.primaryText)
                        case .success(let image):
                            image
                                .interpolation(.none)
                                .resizable()
                                .scaledToFit()
                                .padding(10)
                                .background(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        case .failure:
                            Text("QR unavailable")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(ELSATheme.primaryText)
                                .multilineTextAlignment(.center)
                        @unknown default:
                            EmptyView()
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: 150)
                    .padding(.horizontal, 12)
                    Text("Scan to load profile")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(ELSATheme.primaryText)
                        .multilineTextAlignment(.center)
                } else {
                    Text("Unable to create QR")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ELSATheme.primaryText)
                        .multilineTextAlignment(.center)
                        .padding()
                }
                Spacer(minLength: 8)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.caption.weight(.bold))
            }
            .buttonStyle(.bordered)
            .tint(ELSATheme.primaryText)
            .padding(6)
            .accessibilityLabel("Back")
        }
    }
}
