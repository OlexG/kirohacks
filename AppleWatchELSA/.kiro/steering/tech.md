---
inclusion: always
---

# Technology Stack

## Platform

- Native watchOS app built with Swift and SwiftUI.
- Target: Apple Watch Series 9, watchOS 11.0+.
- Xcode project generated from `project.yml`.
- Product name: `ELSAMonitor`.
- Bundle identifier: `com.kirohacks.fallrisk.watch`.

## Apple Frameworks

- `SwiftUI` for watch UI and settings/profile flows.
- `WatchKit` for watch device details and haptics.
- `CoreMotion` for device motion, pedometer, and altimeter inputs.
- `HealthKit` for authorization, workout runtime, live heart rate, and mobility/cardio snapshots.
- `CoreLocation` for optional session location snapshots attached to outgoing messages.
- `Foundation` for JSON encoding, persistence helpers, timers, and networking.

## Project Generation And Build

Use the checked-in Xcode project directly for normal development. If the project file needs regeneration, use the existing XcodeGen-style `project.yml` as source of truth.

Primary verification command:

```sh
xcodebuild -project KiroHacksFallRisk.xcodeproj -scheme FallRiskWatch -configuration Debug -destination generic/platform=watchOS -derivedDataPath /private/tmp/KiroHacksFallRiskDerivedData CODE_SIGNING_ALLOWED=NO build
```

## Networking

- Watch payloads are posted as JSON to `https://kirohacks.vercel.app/api/watch/alert`.
- Profile QR image loading uses `https://kirohacks.vercel.app/api/profile/qr?payload=...`.
- The QR should encode `https://kirohacks.vercel.app/api/profile/import?payload=...`.
- `NetworkClient` owns HTTP behavior and should keep `Content-Type: application/json` and `X-FallRisk-Schema: fallrisk.v1` for watch ingestion posts.

## Schema

- TypeScript schema contract lives in `Schema/fallrisk.v1.ts`.
- Swift payload models live in `FallRiskWatch/Core/PayloadSchema.swift`.
- Keep enum raw values and nullable fields synchronized between TypeScript and Swift.
- Use `NullCodable` when a field must encode explicit JSON `null` rather than being omitted.

## Testing And Validation

- This hackathon repo currently relies on build validation and manual watch testing.
- For behavior changes in scoring or feature extraction, prefer small deterministic unit-testable helpers if time allows.
- Always verify schema-affecting changes against both Swift payload models and the TypeScript contract.
