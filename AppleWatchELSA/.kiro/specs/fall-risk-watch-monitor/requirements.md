# Requirements Document

## Introduction

Build a native Apple Watch fall-risk awareness and instability monitoring app that collects watch-accessible signals, derives transparent risk features, and sends structured JSON payloads to a companion web dashboard. The app is for a hackathon prototype and must avoid clinical claims.

## Requirements

### Requirement 1: Monitoring Session Control

**User Story:** As a wearer, I want to start and stop a monitoring session from my watch, so that I can choose when the app collects continuous motion and cardio context.

#### Acceptance Criteria

1. WHEN the wearer taps `Start Session` THEN the system SHALL start a HealthKit workout-style runtime and begin motion, pedometer, altimeter, location, and heart-rate collection where authorized.
2. WHEN the session is active THEN the system SHALL show a monitoring status on the watch.
3. WHEN the wearer taps `Stop Session` THEN the system SHALL stop all active collection services and send final session payloads.
4. IF permissions are missing THEN the system SHALL display a readable status and continue with available signals where possible.

### Requirement 2: Derived Feature Windows

**User Story:** As a companion dashboard developer, I want regular derived feature payloads, so that the webapp can show live risk state without processing raw sensor streams.

#### Acceptance Criteria

1. WHEN a session is active THEN the system SHALL send a `feature_window` payload approximately every 3 seconds.
2. WHEN constructing feature windows THEN the system SHALL include motion, gait, elevation, cardio, score, and risk flag sections.
3. WHEN a signal is unavailable THEN the system SHALL encode explicit `null` values where the schema requires nullable fields.
4. The system SHALL NOT stream continuous raw accelerometer or gyroscope samples to the companion endpoint.

### Requirement 3: Transparent Risk Scoring

**User Story:** As a user or judge, I want the score to be explainable, so that I can understand why the watch considers a session low, moderate, or high risk.

#### Acceptance Criteria

1. WHEN scoring a profile, HealthKit snapshot, or feature window THEN the system SHALL produce a 0-100 score and a `low`, `moderate`, or `high` level.
2. WHEN risk inputs cross thresholds THEN the system SHALL include `RiskFlag` entries with code, severity, value, threshold, and basis.
3. WHEN instability is detected THEN the system SHALL consider combinations of motion spikes, cadence disruption, risky turns, sway, or gait degradation rather than a single isolated signal.
4. The system SHALL preserve clinical caution language and avoid claiming to predict or prevent all falls.

### Requirement 4: Alert Events

**User Story:** As a wearer, I want to send an immediate manual alert, so that a caregiver dashboard can see a high-severity event even if automatic detection misses something.

#### Acceptance Criteria

1. WHEN the wearer taps `Send Alert` THEN the system SHALL create an `instability_event` with event type `manual_sos`.
2. WHEN an automatic instability event is detected THEN the system SHALL send an `instability_event` with evidence from the triggering feature window.
3. WHEN an alert event is created THEN the watch SHALL provide haptic feedback.

### Requirement 5: Schema Compatibility

**User Story:** As the webapp teammate, I want stable message contracts, so that ingestion and dashboard code can be built independently.

#### Acceptance Criteria

1. WHEN the watch sends data THEN every message SHALL use `schemaVersion: "fallrisk.v1"`.
2. WHEN Swift payload models change THEN the TypeScript schema SHALL be updated in the same change.
3. WHEN README handoff examples mention payload fields THEN they SHALL match `Schema/fallrisk.v1.ts` and `PayloadSchema.swift`.
