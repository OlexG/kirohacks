# Implementation Plan

- [x] 1. Create watchOS project structure
  - Add SwiftUI app entry point and central environment object.
  - Configure watchOS 11 deployment target and required frameworks.
  - _Requirements: 1.1, 5.1_

- [x] 2. Define payload schema contract
  - Add TypeScript schema for all outbound message types.
  - Add Swift Codable equivalents with explicit null support.
  - _Requirements: 2.3, 5.1, 5.2_

- [x] 3. Implement profile persistence and questionnaire
  - Store random participant ID and profile in `UserDefaults`.
  - Add profile fields that influence baseline risk.
  - Post `profile_snapshot` when saved.
  - _Requirements: 3.1, 5.1_

- [x] 4. Implement HealthKit authorization and snapshots
  - Request mobility, activity, cardio, and workout permissions.
  - Read recent mobility/cardio values where available.
  - Encode unavailable values as nullable fields.
  - _Requirements: 1.4, 2.3_

- [x] 5. Implement active monitoring runtime
  - Start workout session, motion updates, pedometer, altimeter, and location on session start.
  - Stop all services cleanly on session stop.
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Build feature extraction pipeline
  - Aggregate 3-second windows.
  - Derive motion, gait, elevation, cardio, and activity class features.
  - Avoid raw sensor streaming.
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 7. Implement rule-based risk scoring
  - Generate risk score, risk level, and risk flags.
  - Combine profile, HealthKit, and live feature evidence.
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Implement event and summary posting
  - Send manual SOS events.
  - Send detected instability events with evidence.
  - Send final session summary on stop.
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Build watch UI
  - Add main risk display, session controls, alert button, telemetry, recent events, settings, profile, and permissions screens.
  - Apply ELSA visual theme and logo assets.
  - _Requirements: 1.2, 4.1_

- [x] 10. Verify watchOS build
  - Run generic watchOS `xcodebuild` with code signing disabled.
  - Fix compiler errors and watchOS API availability issues.
  - _Requirements: 5.1_
