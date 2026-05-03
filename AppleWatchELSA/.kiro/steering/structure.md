---
inclusion: always
---

# Project Structure

## Root

- `project.yml`: project generation/configuration source.
- `KiroHacksFallRisk.xcodeproj/`: checked-in Xcode project used by the current build.
- `README.md`: product and integration handoff documentation.
- `Schema/fallrisk.v1.ts`: companion webapp TypeScript payload contract.
- `FallRiskWatch/`: watchOS app source.

## Watch App

- `FallRiskWatch/App/FallRiskWatchApp.swift`: app entry point and environment object injection.
- `FallRiskWatch/App/ContentView.swift`: primary watch UI, settings/profile screens, profile QR presentation.
- `FallRiskWatch/Core/FallRiskMonitor.swift`: main orchestration object for profile state, permissions, sessions, motion collection, scoring, events, location, and network posting.
- `FallRiskWatch/Core/PayloadSchema.swift`: Swift Codable models matching `Schema/fallrisk.v1.ts`.
- `FallRiskWatch/Core/RiskScoring.swift`: transparent rule-based fall-risk and instability scoring.
- `FallRiskWatch/Core/FeatureExtractor.swift`: derived motion/gait/cardio feature extraction and event construction.
- `FallRiskWatch/Core/HealthKitService.swift`: HealthKit authorization, snapshots, workout session, and live heart-rate collection.
- `FallRiskWatch/Core/ProfileStore.swift`: participant ID and profile persistence.
- `FallRiskWatch/Core/NetworkClient.swift`: endpoint constants and JSON POST client.
- `FallRiskWatch/Assets.xcassets/`: app icon and ELSA logo assets.

## Architectural Patterns

- `FallRiskMonitor` is the central `ObservableObject`; SwiftUI views should call it rather than constructing services directly.
- Core services should stay small and focused. Avoid moving UI concerns into `Core`.
- Payload structs should be stable and schema-driven; do not opportunistically rename fields without updating TypeScript and README handoff docs.
- Feature extraction should emit derived metrics only. Do not introduce raw motion streaming unless a spec explicitly changes that requirement.
- Risk scoring should remain explainable through `RiskFlag` values.

## Naming Conventions

- Message types use snake_case raw values matching the TypeScript schema.
- Swift enum cases use idiomatic lowerCamelCase with raw values when serialized names differ.
- Watch UI view structs live in `ContentView.swift` unless a screen becomes large enough to split cleanly.
- Use `PayloadClock.string()` for generated timestamps in outgoing envelopes.
