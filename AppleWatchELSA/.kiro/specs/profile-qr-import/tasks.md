# Implementation Plan

- [x] 1. Add endpoint constants
  - Add profile import and profile QR URL constants beside the existing watch ingest endpoint.
  - _Requirements: 3.1, 4.1_

- [x] 2. Add base64url helper
  - Encode JSON bytes using URL-safe base64 without padding.
  - _Requirements: 2.2_

- [x] 3. Build profile import links
  - Create a `profile_snapshot` envelope from `FallRiskMonitor`.
  - Reuse persisted participant ID and watch device ID.
  - Return both import URL and QR image URL.
  - _Requirements: 2.1, 2.4, 3.4_

- [x] 4. Add Profile screen QR entry point
  - Add a `Scan QR` button below `Save Profile`.
  - Generate links from the current form snapshot, not only the last saved profile.
  - _Requirements: 1.1, 2.3_

- [x] 5. Add full-screen QR view
  - Present a light-background screen with `AsyncImage`.
  - Add white backing for QR contrast.
  - Add a small back button and failure states.
  - _Requirements: 1.2, 1.3, 3.2, 3.3_

- [x] 6. Verify watchOS framework compatibility
  - Attempt local QR generation.
  - Remove `CoreImage` after build failure showed module unavailability for the watch target.
  - Switch to remote QR image generation.
  - _Requirements: 3.1, 3.2_

- [ ] 7. Implement Vercel QR route in webapp repository
  - Add `/api/profile/qr`.
  - Generate a PNG QR image for `/api/profile/import?payload=...`.
  - Return `Content-Type: image/png`.
  - _Requirements: 4.1_

- [ ] 8. Implement Vercel import route in webapp repository
  - Add `/api/profile/import`.
  - Decode base64url payload.
  - Validate `schemaVersion` and `messageType`.
  - Load profile into webapp state or redirect to import confirmation UI.
  - _Requirements: 4.2_
