# KiroHacks Fall Risk Watch

This is a hackathon Apple Watch app for **fall-risk awareness and instability monitoring**. It is not a medical device, does not diagnose anyone, and does not guarantee that it can predict or prevent a fall. The goal is to collect useful watch-based signals, turn them into readable risk indicators, and send those indicators to the companion web dashboard.

The app runs directly on the Apple Watch. It sends JSON payloads to:

```text
https://kirohacks.vercel.app/api/watch/alert
```

## What The App Does

The app watches for signs that a person may be walking less steadily than usual. It uses the Apple Watch sensors and Health data to estimate:

- Overall fall-risk level: `low`, `moderate`, or `high`.
- Short-term instability during a monitoring session.
- Possible stumble or near-fall moments.
- Walking rhythm, movement smoothness, turning, sway, and step consistency.
- Heart-rate context during walking.
- HealthKit mobility context when available, such as walking speed, step length, walking asymmetry, double support, and walking steadiness.

The main idea is simple: one unusual motion spike is not enough to call something risky. The app looks for combinations, such as a sudden movement spike plus a break in walking rhythm.

## Main Screens And Buttons

### Settings Gear

The small gear icon in the top-right opens the settings screen.

From this menu, you can:

- Open the Profile screen.
- Request HealthKit permissions.

HealthKit permissions should usually be requested before starting a monitoring session. If permission is granted, the app sends one `healthkit_snapshot` payload and updates the watch screen with the current permission/status result.

### Start Session

The `Start Session` button begins active monitoring.

When pressed, the app:

- Starts a watch workout-style session so the watch can keep collecting motion and heart-rate data.
- Starts reading watch motion at about 50 times per second.
- Starts counting steps and stair/elevation context.
- Starts a 3-second timer for sending live feature summaries.
- Sends a `healthkit_snapshot` payload at the beginning of the session.

While this is running, the watch sends a `feature_window` payload every 3 seconds.

### Stop Session

The `Stop Session` button ends active monitoring.

When pressed, the app:

- Stops motion, step, altitude, and workout collection.
- Sends one final `feature_window` if there is unsent recent data.
- Sends a final `healthkit_snapshot`.
- Sends a `session_summary` with overall session totals.

### Send Alert

The `Send Alert` button sends an immediate manual alert.

When pressed, the app:

- Creates an `instability_event` with type `manual_sos`.
- Marks the severity as `high`.
- Sends it immediately to the web endpoint.

This is the manual alert path for the wearer.

### Profile

The Profile screen is a short fall-risk questionnaire opened from the settings gear.

It collects:

- Age.
- Sex.
- Height.
- Assistive device, such as cane or walker.
- Number of falls in the last 12 months.
- Whether a recent fall caused injury.
- Whether the person was unable to get up after a fall.
- Mobility or neurological impairment flags.

When saved, the app sends a `profile_snapshot` payload.

These values affect the rule-based risk score. For example, recurrent falls or an injurious fall increase the baseline risk.

## What The Watch Sends

Every message uses the same outer wrapper:

```text
schemaVersion
messageType
participantId
deviceId
sessionId
generatedAt
sequence
source
location
payload
```

Plain-language meaning:

- `schemaVersion`: tells the webapp which data format this is.
- `messageType`: tells the webapp what kind of message was sent.
- `participantId`: a random ID stored on the watch for this user.
- `deviceId`: the watch vendor/device ID when available.
- `sessionId`: a random ID for the current monitoring session, or `null` outside a session.
- `generatedAt`: when the watch created the message.
- `sequence`: increasing message number.
- `source`: says the message came from the watch and includes watch model/watchOS.
- `location`: the latest watch GPS fix, or `null` if permission is missing or the watch has not produced a fix yet.
- `payload`: the actual data for that message type.

### Live GPS For The Minimap

Live location is feasible on the Series 9 GPS watch. The app requests location permission and starts location updates when a monitoring session starts. It stops location updates when the session stops.

The watch attaches the latest known GPS fix to every outgoing message:

```text
location.latitude
location.longitude
location.horizontalAccuracyM
location.altitudeM
location.verticalAccuracyM
location.speedMps
location.courseDeg
location.timestamp
location.source
```

For the external app, use `location.latitude` and `location.longitude` to place the user on a minimap. Use `horizontalAccuracyM` to draw an uncertainty radius or to ignore low-quality fixes. If `location` is `null`, keep the last known map point or show location unavailable.

## Transmission Timing

| Message | When it sends | What it is for |
|---|---|---|
| `profile_snapshot` | When Profile is saved | Baseline risk context |
| `healthkit_snapshot` | After permissions, session start, and session stop | Recent HealthKit mobility/cardio context |
| `feature_window` | Every 3 seconds during an active session | Live walking/motion/instability features |
| `instability_event` | Immediately after manual SOS or detected instability | Fast alert path |
| `session_summary` | When monitoring stops | Final session totals and final risk score |

The app sends **derived features**, not a continuous raw sensor stream. This keeps the payload smaller and makes the web dashboard easier to build.

## What Each Payload Contains

### `profile_snapshot`

This contains questionnaire answers:

- Age, sex, height.
- Assistive device.
- Impairment tags.
- Prior falls in the last 12 months.
- Whether a fall caused injury.
- Whether the person could not get up after a fall.

### `healthkit_snapshot`

This contains recent HealthKit values when available:

- Walking steadiness score and class.
- Walking speed.
- Step length.
- Walking asymmetry.
- Double-support percentage.
- Six-minute walk distance.
- Stair ascent/descent speed.
- Step count.
- Walking/running distance.
- Flights climbed.
- Resting heart rate.
- Walking heart-rate average.
- HRV.
- Any risk flags created from those values.

If a value is unavailable or permission is missing, it is sent as `null`.

### `feature_window`

This is the main live monitoring payload. It sends every 3 seconds during a session.

It contains:

- Window start and end time.
- Activity estimate: standing, walking, stairs up, stairs down, or unknown.
- Motion features:
  - Average acceleration.
  - Peak acceleration.
  - User acceleration.
  - Jerk, meaning sudden change in acceleration.
  - Gyroscope movement.
  - Attitude/orientation change.
  - Sway estimate.
  - Turn count and maximum turn rate.
- Gait features:
  - Step count in the window.
  - Cadence.
  - Cadence variability.
  - Stride-time estimate.
  - Stride-time variability.
  - Gait regularity score.
- Elevation/stair context.
- Heart-rate context.
- Rule-based risk score from 0 to 100.
- Instability event state derived from the current motion window.
- Risk level: low, moderate, or high.
- Risk flags explaining why the score changed.

### `instability_event`

This is sent immediately when the app believes something notable happened.

It contains:

- Event ID.
- Event time.
- Event type:
  - `stumble_candidate`
  - `near_fall_candidate`
  - `high_sway`
  - `risky_turn`
  - `gait_degradation`
  - `manual_sos`
- Severity: info, moderate, or high.
- The time window that triggered it.
- Evidence:
  - Peak acceleration.
  - Peak gyroscope movement.
  - Peak jerk.
  - Whether cadence broke.
  - Activity type.
- User feedback state, currently defaulted to `unanswered`.

### `session_summary`

This is sent when the user stops monitoring.

It contains:

- Session start and end time.
- Duration.
- Total steps.
- Distance if available.
- Number of instability events.
- Number of high-risk minutes.
- Average cadence.
- Latest walking speed if available.
- Final rule risk score.
- Final risk level.
- Risk flags.

## How The Risk Score Works

The primary score is rule-based. It is meant to be understandable during a demo.

Examples of things that increase risk:

- Two or more falls in the last year.
- Injurious fall.
- Unable to get up after a fall.
- Assistive device.
- Mobility or neurological impairment.
- Low or very low Apple Walking Steadiness.
- Slow walking speed.
- Declining walking speed compared with personal baseline.
- Higher walking asymmetry.
- Higher double-support percentage.
- Shorter step length compared with personal baseline.
- High gait variability.
- Recent instability events. Each event in the last 10 minutes adds 10 points, capped at 50 points. Five or more events in 10 minutes forces the risk level to high.

Risk levels:

- `0-39`: low
- `40-69`: moderate
- `70-100`: high

## What Counts As Instability

The app avoids triggering on a single movement spike.

It looks for combinations such as:

- Strong acceleration or jerk.
- Strong wrist rotation.
- Break in walking rhythm.
- Enough step/cadence evidence to suggest the user is actually walking.
- Stair descent context.
- Repeated instability after a short cooldown window.

When instability is detected, the watch vibrates and sends an `instability_event` immediately. Automatic events have a short cooldown to prevent one noisy walking segment from stacking alerts every few seconds. If a second instability happens within about 60 seconds, the app treats it as more severe.

## What The Web Dashboard Should Expect

The dashboard should expect frequent `feature_window` messages during a session and occasional event-style messages.

Recommended dashboard behavior:

- Show `feature_window` as the live feed.
- Update the minimap from the envelope-level `location` object whenever it is present.
- Treat `instability_event` as the alert feed.
- Use `healthkit_snapshot` for context cards.
- Use `profile_snapshot` for baseline risk.
- Use `session_summary` for post-session recap.

The TypeScript schema is in:

```text
Schema/fallrisk.v1.ts
```

## Setup

Generate and open the Xcode project:

```sh
xcodegen generate
open KiroHacksFallRisk.xcodeproj
```

In Xcode:

- Select the `FallRiskWatch` scheme.
- Set your Apple development team for signing.
- Run on the paired Apple Watch.
- Grant HealthKit and Motion permissions on first launch.

If install metadata changes do not appear immediately, use:

```text
Product > Clean Build Folder
```

## Current Limitations

- This is a hackathon prototype, not a clinical product.
- The app sends engineered features, not raw sensor streams.
- HealthKit mobility values depend on the watch/phone already having those samples.
- Some iPhone-derived walking metrics may be unavailable if the paired iPhone was not carried correctly.
