import SwiftUI

@main
struct FallRiskWatchApp: App {
    @StateObject private var monitor = FallRiskMonitor()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(monitor)
        }
    }
}
